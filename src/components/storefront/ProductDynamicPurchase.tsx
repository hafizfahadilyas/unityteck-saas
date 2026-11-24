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
import {
  customFieldIsFillable,
  customFieldIsFreeColorPicker,
  normalizeCustomFieldType,
} from '../../utils/customFieldTypes';
import { isOptionValueAvailable, optionValuesList } from '../../utils/productVariants';
import {
  choiceLooksLikeColor,
  choiceLooksLikeImage,
  fieldControlKind,
  isCustomFieldVisible,
  normalizeCustomFieldOptions,
  optionKind,
  resolveChoiceSwatchColor,
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
  return isAr ? `${text}⃁` : `⃁ ${text}`;
}

/** Honor Care box vs Gift cards — care = one bordered panel; gift = each row its own card. */
function isHonorCareField(
  field: ProductCustomField,
  optionItems: ReturnType<typeof normalizeCustomFieldOptions>,
): boolean {
  const blob = `${field.name || ''} ${field.nameAr || ''} ${field.type || ''}`.toLowerCase();
  // Only real care/warranty fields use the Care panel — never force every Text choice into it
  // (that was painting a fake heart / “img” placeholder on Single Choice – Text).
  if (/care|warranty|protection|حماية|رعاية|ضمان|صيانة|عناية/.test(blob)) return true;
  const kind = fieldControlKind(field.type, field.options);
  // Image choice without thumbs → care list style (radio + label). Text/Size → gift/chip cards.
  if (!kind.includes('Image')) return false;
  const hasImg = optionItems.some((o) => !!o.imageUrl || choiceLooksLikeImage(o.label));
  return !hasImg;
}

/** Honor Care panel = black; Gift cards = medium gray (exact ref). */
const honorCareBorder = {
  boxShadow: 'none' as const,
  border: '1px solid #000000',
  borderColor: '#000000',
  outline: '1px solid #000000',
  outlineOffset: '-1px',
  borderRadius: '12px',
};
const honorGiftBorder = {
  boxShadow: 'none' as const,
  border: '1px solid #9A9A9A',
  borderColor: '#9A9A9A',
  outline: '1px solid #9A9A9A',
  outlineOffset: '-1px',
  borderRadius: '12px',
};
/** @deprecated use honorCareBorder / honorGiftBorder */
const honorBorder = honorCareBorder;

/** Square select control — always show a visible black border (all Care / Gift / offer rows). */
const honorRadioBox =
  'w-[18px] h-[18px] rounded-[3px] flex items-center justify-center shrink-0 bg-white border border-solid border-neutral-900 box-border';
const honorRadioBoxStyle = {
  boxShadow: 'none' as const,
  border: '1px solid #000000',
  borderColor: '#000000',
};

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

  const coffeeInputClass = coffee
    ? 'w-full px-3.5 py-3 rounded-lg border border-solid border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 box-border shadow-none focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10'
    : 'w-full px-3 py-2.5 rounded-xl border border-solid border-[#cfc7b6] dark:border-slate-600 bg-white dark:bg-slate-900 text-xs box-border';

  return (
    <div className="space-y-4" data-coffee-dynamic-purchase="1">
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
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      title={valueLabel(v)}
                      aria-label={valueLabel(v)}
                      aria-pressed={on}
                      aria-disabled={!available}
                      disabled={!available}
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        !available
                          ? 'opacity-30 cursor-not-allowed'
                          : on
                            ? coffee
                              ? 'ring-2 ring-black ring-offset-2 scale-105 cursor-pointer'
                              : 'ring-2 ring-[#102a1c] dark:ring-emerald-400 ring-offset-2 cursor-pointer'
                            : 'hover:scale-105 opacity-80 hover:opacity-100 cursor-pointer'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-full border border-neutral-300/80 block"
                        style={{ backgroundColor: v.colorHex || '#cbd5e1', boxShadow: 'none' }}
                      />
                    </button>
                  );
                })}
              </div>
            ) : kind === 'image' ? (
              <div className="flex flex-wrap gap-2">
                {vals.map((v) => {
                  const on = current === v.label;
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-label={valueLabel(v)}
                      aria-pressed={on}
                      aria-disabled={!available}
                      disabled={!available}
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                      className={`w-14 h-14 rounded-xl border border-solid overflow-hidden bg-white shadow-none ${
                        !available
                          ? 'opacity-30 cursor-not-allowed border-neutral-200'
                          : on
                            ? coffee
                              ? 'border-neutral-900 cursor-pointer'
                              : 'border-[#102a1c] dark:border-emerald-400 cursor-pointer'
                            : 'border-neutral-200 cursor-pointer'
                      }`}
                      style={coffee ? { boxShadow: 'none' } : undefined}
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
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
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
                      aria-disabled={!available}
                      disabled={!available}
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                      className={
                        coffee
                          ? `p-4 rounded-xl text-start transition-all bg-white shadow-none ${
                              !available
                                ? 'opacity-40 cursor-not-allowed bg-neutral-50'
                                : 'cursor-pointer'
                            }`
                          : `px-3 py-2 rounded-xl border text-xs font-bold ${
                              !available
                                ? 'opacity-40 cursor-not-allowed line-through border-slate-200'
                                : on
                                  ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/5 dark:bg-emerald-950/30 cursor-pointer'
                                  : 'border-[#d6cfc0] dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer'
                            }`
                      }
                          style={
                        coffee
                          ? honorBorder
                          : undefined
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
        const declaredKind = normalizeCustomFieldType(field.type);
        const kind = fieldControlKind(field.type, field.options);
        const value = fieldValues[field.id];
        const text = Array.isArray(value) ? '' : String(value ?? '');
        const many = Array.isArray(value) ? value : [];
        // Golden rule: merchant content is one text (any language) — show as typed.
        const content =
          field.contentEn || field.contentAr || field.description || '';
        const fillable = customFieldIsFillable(field.type);
        const extra = Number(field.extraPrice) || 0;
        const optionItemsEarly = normalizeCustomFieldOptions(field.options);
        const fieldTitle = isAr && field.nameAr ? field.nameAr : field.name;
        const isChoiceKind =
          kind === 'Single Choice' ||
          kind === 'Multiple Choice' ||
          kind === 'Size Selector' ||
          kind === 'Single Choice Image' ||
          kind === 'Multiple Choice Image' ||
          kind === 'Single Choice Color' ||
          kind === 'Multiple Choice Color';
        // Coffee buy: ALL choice lists → Honor Care panel OR Gift cards (borders always)
        const coffeeHonorList =
          coffee && fillable && isChoiceKind && optionItemsEarly.length > 0 && !kind.includes('Color');
        // Thumbs only when merchant chose an Image type (never invent icon for Text).
        const isImageChoiceKind = declaredKind.includes('Image');

        // Honor Care / Gift layouts for coffee side-info
        if (coffeeHonorList) {
          const multiple = kind.startsWith('Multiple');
          const careMode = isHonorCareField(field, optionItemsEarly);
          const toggle = (opt: string) => {
            if (!multiple) {
              setField(field.id, opt);
              return;
            }
            const next = many.includes(opt) ? many.filter((item) => item !== opt) : [...many, opt];
            setField(field.id, next);
          };

          if (careMode) {
            // Honor Care: ONE black-border panel, title inside, checkbox rows (no per-row card)
            return (
              <div key={field.id} className="pt-3" data-honor-offer="care">
                <div
                  data-honor-care-panel="1"
                  className="rounded-xl bg-white p-4 sm:p-5 space-y-1 shadow-none box-border"
                  style={honorCareBorder}
                >
                  <div className="space-y-1">
                    <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                      {fieldTitle}
                      {field.required ? <span className="text-rose-600"> *</span> : null}
                    </h2>
                    {content ? (
                      <p className="text-[11px] text-neutral-500 leading-relaxed">{content}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {optionItemsEarly.map((item) => {
                      const on = multiple ? many.includes(item.label) : text === item.label;
                      const title = isAr && item.labelAr ? item.labelAr : item.label;
                      const thumb = isImageChoiceKind
                        ? item.imageUrl || (choiceLooksLikeImage(item.label) ? item.label : '')
                        : '';
                      const price = Number(item.price) || 0;
                      const compare = Number(item.compareAtPrice) || 0;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role={multiple ? 'checkbox' : 'radio'}
                          aria-checked={on}
                          onClick={() => toggle(item.label)}
                          className="w-full flex items-center gap-3 py-3 text-start bg-transparent cursor-pointer shadow-none border-0"
                          style={{ boxShadow: 'none' }}
                        >
                          <span className={honorRadioBox} style={honorRadioBoxStyle} aria-hidden>
                            {on ? (
                              <span className="w-2.5 h-2.5 bg-black block rounded-[1px]" />
                            ) : null}
                          </span>
                          {/* Image thumbs only for Image field types — never fake icon on Text. */}
                          {isImageChoiceKind ? (
                            thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="w-10 h-10 rounded-lg object-contain bg-neutral-50 shrink-0 border border-solid border-neutral-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span
                                className="w-10 h-10 rounded-lg bg-neutral-100 shrink-0 border border-solid border-neutral-200"
                                aria-hidden
                              />
                            )
                          ) : null}
                          <span className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                            {title}
                          </span>
                          <span className="shrink-0 text-end">
                            <span className="block text-xs sm:text-sm font-bold text-neutral-900 font-sans">
                              {money(price, isAr)}
                            </span>
                            {compare > price ? (
                              <span className="block text-[11px] text-neutral-400 line-through font-sans">
                                {money(compare, isAr)}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // Honor Gift: title outside, EACH card medium-gray border (ref image)
          return (
            <div key={field.id} className="space-y-3 pt-3" data-honor-offer="gift">
              <div className="space-y-1">
                <h2 className={titleClass}>
                  {fieldTitle}
                  {field.required ? <span className="text-rose-600"> *</span> : null}
                </h2>
                {content ? (
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{content}</p>
                ) : null}
              </div>
              <div className="space-y-3">
                {optionItemsEarly.map((item) => {
                  const on = multiple ? many.includes(item.label) : text === item.label;
                  const title = isAr && item.labelAr ? item.labelAr : item.label;
                  const thumb = isImageChoiceKind
                    ? item.imageUrl || (choiceLooksLikeImage(item.label) ? item.label : '')
                    : '';
                  const price = Number(item.price) || 0;
                  const compare = Number(item.compareAtPrice) || 0;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      role={multiple ? 'checkbox' : 'radio'}
                      aria-checked={on}
                      onClick={() => toggle(item.label)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-start rounded-xl bg-white shadow-none transition-colors cursor-pointer box-border ${
                        on ? 'bg-neutral-50' : ''
                      }`}
                      style={honorGiftBorder}
                      data-honor-offer-row="1"
                    >
                      {isImageChoiceKind ? (
                        thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain bg-neutral-50 shrink-0"
                            style={{ border: '1px solid #D2D2D7' }}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-neutral-100 shrink-0"
                            style={{ border: '1px solid #D2D2D7' }}
                          />
                        )
                      ) : null}
                      <span className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                        {title}
                      </span>
                      <span className="shrink-0 text-end">
                        <span className="block text-xs sm:text-sm font-bold text-neutral-900 font-sans">
                          {money(price, isAr)}
                        </span>
                        {compare > price ? (
                          <span className="block text-[11px] text-neutral-400 line-through font-sans">
                            {money(compare, isAr)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={field.id} className={sectionClass}>
            {kind === 'Divider' ? (
              <div className="h-px bg-neutral-200 dark:bg-slate-700" />
            ) : (
              <h2 className={`${titleClass} flex items-center justify-between gap-2`}>
                <span>
                  {fieldTitle}
                  {field.required ? <span className="text-rose-600"> *</span> : null}
                </span>
                {extra > 0 &&
                kind !== 'Image Upload' &&
                kind !== 'File Upload' &&
                !optionItemsEarly.some((o) => (Number(o.price) || 0) > 0) ? (
                  <span className="text-xs font-semibold text-neutral-500 shrink-0">+{money(extra, isAr)}</span>
                ) : null}
              </h2>
            )}
            {field.imageUrl && kind === 'Content' ? (
              <img src={field.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : null}
            {field.videoUrl ? (
              <video src={field.videoUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
            ) : null}
            {content && !coffee ? (
              <p className="text-xs text-neutral-700 dark:text-slate-300 whitespace-pre-line">{content}</p>
            ) : null}
            {content && coffee ? (
              <p className="text-[11px] text-neutral-500 leading-relaxed">{content}</p>
            ) : null}
            {fillable && kind !== 'Divider' && renderControl()}
          </div>
        );

        function renderControl() {
          const inputClass = coffee
            ? coffeeInputClass
            : 'w-full px-3 py-2.5 rounded-xl border border-solid border-[#cfc7b6] dark:border-slate-600 bg-white dark:bg-slate-900 text-xs box-border';
          const inputStyle = coffee ? ({ boxShadow: 'none' } as const) : undefined;
          if (kind === 'Long Text') {
            return (
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setField(field.id, e.target.value)}
                className={inputClass}
                style={inputStyle}
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
                style={inputStyle}
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
                style={inputStyle}
              />
            );
          }
          if (kind === 'Image Upload' || kind === 'File Upload') {
            const inputId = `cf-upload-${field.id}`;
            const isImage = kind === 'Image Upload';
            return (
              <div className="space-y-2.5">
                <input
                  id={inputId}
                  type="file"
                  accept={isImage ? 'image/*' : undefined}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setField(field.id, file.name);
                    if (isImage) {
                      setPreviews((prev) => ({ ...prev, [field.id]: URL.createObjectURL(file) }));
                    }
                  }}
                />
                <label
                  htmlFor={inputId}
                  className={`flex flex-col items-center justify-center gap-2 w-full min-h-[120px] px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer text-center transition-colors box-border ${
                    coffee
                      ? 'border-neutral-200 bg-neutral-50/90 hover:bg-neutral-50 hover:border-neutral-400'
                      : 'border-[#cfc7b6] dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                  style={{ boxShadow: 'none' }}
                >
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                      coffee ? 'bg-neutral-900 text-white' : 'bg-[#102a1c] text-white'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M12 16V4m0 0l-4 4m4-4l4 4M4 16.5V18a2 2 0 002 2h12a2 2 0 002-2v-1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="text-sm font-bold text-neutral-900">
                    {isImage
                      ? isAr
                        ? 'رفع صورة'
                        : 'Upload image'
                      : isAr
                        ? 'رفع ملف'
                        : 'Upload file'}
                  </span>
                  <span className="text-[11px] text-neutral-500 max-w-xs">
                    {isAr ? 'اضغط لاختيار ملف من جهازك' : 'Tap to choose a file from your device'}
                  </span>
                </label>
                {previews[field.id] ? (
                  <img
                    src={previews[field.id]}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover border border-neutral-200"
                    style={{ boxShadow: 'none' }}
                  />
                ) : null}
                {text ? <p className="text-[11px] text-neutral-600 font-medium break-all">{text}</p> : null}
              </div>
            );
          }
          // Color Picker = free HEX pick (pencil / native color tool) — not fixed swatches.
          if (customFieldIsFreeColorPicker(kind) || kind === 'Color Selector') {
            const colorValue = choiceLooksLikeColor(text) ? text : '#64748b';
            const pickerId = `cf-color-${field.id}`;
            return (
              <div className="inline-flex items-center gap-2.5 flex-wrap">
                <label
                  htmlFor={pickerId}
                  className={`inline-flex items-center gap-3 min-h-[48px] px-3.5 py-2.5 rounded-xl border border-solid cursor-pointer select-none box-border ${
                    coffee
                      ? 'border-neutral-200 bg-white hover:bg-neutral-50'
                      : 'border-[#cfc7b6] dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  style={{ boxShadow: 'none' }}
                >
                  <span
                    className="w-10 h-10 rounded-lg border border-neutral-200 shrink-0"
                    style={{ backgroundColor: colorValue, boxShadow: 'none' }}
                    aria-hidden
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="shrink-0 text-neutral-700 dark:text-slate-200"
                  >
                    <path
                      d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-bold font-mono text-neutral-800 dark:text-slate-100 uppercase tracking-wide">
                    {colorValue}
                  </span>
                  <input
                    id={pickerId}
                    type="color"
                    value={colorValue}
                    onChange={(e) => setField(field.id, e.target.value)}
                    className="sr-only"
                    aria-label={fieldTitle || field.name}
                  />
                </label>
              </div>
            );
          }
          const optionItems = normalizeCustomFieldOptions(field.options);
          const multiple = kind.startsWith('Multiple');
          if (
            kind === 'Single Choice' ||
            kind === 'Multiple Choice' ||
            kind === 'Size Selector' ||
            kind === 'Single Choice Image' ||
            kind === 'Multiple Choice Image' ||
            kind === 'Single Choice Color' ||
            kind === 'Multiple Choice Color'
          ) {
            const toggle = (opt: string) => {
              if (!multiple) {
                setField(field.id, opt);
                return;
              }
              const next = many.includes(opt) ? many.filter((item) => item !== opt) : [...many, opt];
              setField(field.id, next);
            };

            const isColorKind = kind.includes('Color') || declaredKind.includes('Color');
            // Respect merchant field type — Text never renders as image grid/icon.
            const isImageKind = declaredKind.includes('Image');
            const allColor =
              isColorKind ||
              optionItems.every(
                (o) => choiceLooksLikeColor(o.label) || choiceLooksLikeColor(o.imageUrl || ''),
              );
            // Image grid only for Image field types — Text choices stay text chips.
            const allImage = isImageKind;

            // Coffee / Honor: Memory-style cards (single) or offer list with radio + thumb
            if (coffee && !isColorKind && !allColor) {
              const honorOfferList =
                isImageKind &&
                (multiple || optionItems.some((o) => o.imageUrl || (o.price != null && o.price > 0)));
              if (honorOfferList) {
                return (
                  <div className="space-y-2.5">
                    {optionItems.map((item) => {
                      const on = multiple ? many.includes(item.label) : text === item.label;
                      const title = isAr && item.labelAr ? item.labelAr : item.label;
                      const thumb =
                        item.imageUrl ||
                        (choiceLooksLikeImage(item.label) ? item.label : '');
                      const price = Number(item.price) || 0;
                      const compare = Number(item.compareAtPrice) || 0;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => toggle(item.label)}
                          className={`w-full flex items-center gap-3 px-3.5 py-3 text-start rounded-xl bg-white shadow-none transition-colors cursor-pointer box-border ${
                            on ? 'bg-neutral-50' : ''
                          }`}
                          style={honorGiftBorder}
                          data-honor-offer-row="1"
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt=""
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain bg-neutral-50 shrink-0"
                              style={{ border: '1px solid #D2D2D7' }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-neutral-100 shrink-0"
                              style={{ border: '1px solid #D2D2D7' }}
                            />
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                              {title}
                            </span>
                          </span>
                          <span className="shrink-0 text-end">
                            {price > 0 ? (
                              <>
                                <span className="block text-xs sm:text-sm font-bold text-neutral-900 font-sans">
                                  {money(price, isAr)}
                                </span>
                                {compare > price ? (
                                  <span className="block text-[11px] text-neutral-400 line-through font-sans">
                                    {money(compare, isAr)}
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-xs font-bold text-neutral-900 font-sans">
                                {money(0, isAr)}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              }

              // Single choice Memory-style cards
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {optionItems.map((item) => {
                    const on = text === item.label;
                    const title = isAr && item.labelAr ? item.labelAr : item.label;
                    const price = Number(item.price) || Number(field.extraPrice) || 0;
                    const thumb = isImageKind ? item.imageUrl || '' : '';
                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(item.label)}
                        className={`p-4 rounded-xl text-start transition-all cursor-pointer bg-white shadow-none border border-solid border-black box-border ${
                          on ? 'bg-neutral-50' : ''
                        }`}
                        style={honorBorder}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-20 object-contain mb-3"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <div className="font-extrabold text-sm text-neutral-900">{title}</div>
                        {price > 0 ? (
                          <div className="font-sans text-xs font-semibold text-neutral-600 mt-2">
                            {money(price, isAr)}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            }

            if (isColorKind || allColor) {
              return (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3 max-w-md">
                  {optionItems.map((item) => {
                    const opt = item.label;
                    const on = multiple ? many.includes(opt) : text === opt;
                    const swatch = resolveChoiceSwatchColor(item);
                    const swatchLabel = isAr && item.labelAr ? item.labelAr : opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        title={swatchLabel}
                        aria-label={swatchLabel}
                        aria-pressed={on}
                        onClick={() => toggle(opt)}
                        className="flex flex-col items-center gap-1.5 p-1 rounded-lg cursor-pointer bg-transparent border-0"
                        style={{ boxShadow: 'none' }}
                      >
                        <span
                          className={`w-11 h-11 rounded-full border-2 border-solid block shrink-0 ${
                            on ? 'border-neutral-900 ring-2 ring-neutral-900/20' : 'border-neutral-200'
                          }`}
                          style={{ backgroundColor: swatch, boxShadow: 'none' }}
                          aria-hidden
                        />
                        <span className="text-[10px] font-semibold text-neutral-700 text-center leading-tight max-w-[4.5rem] truncate">
                          {swatchLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            }

            return (
              <div className="flex flex-wrap gap-2">
                {optionItems.map((item) => {
                  const opt = item.label;
                  const on = multiple ? many.includes(opt) : text === opt;
                  if (choiceLooksLikeColor(opt)) {
                    const swatch = resolveChoiceSwatchColor(item);
                    return (
                      <button
                        key={opt}
                        type="button"
                        title={opt}
                        aria-label={opt}
                        aria-pressed={on}
                        onClick={() => toggle(opt)}
                        className={`w-9 h-9 rounded-full border border-solid cursor-pointer shadow-none box-border ${on ? 'border-neutral-900' : 'border-neutral-300'}`}
                        style={{ backgroundColor: swatch, boxShadow: 'none' }}
                      />
                    );
                  }
                  if (isImageKind || allImage) {
                    const src = item.imageUrl || (choiceLooksLikeImage(opt) ? opt : '');
                    return (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(opt)}
                        className={`w-14 h-14 rounded-xl border border-solid overflow-hidden cursor-pointer bg-white shadow-none box-border ${
                          on ? 'border-neutral-900' : 'border-neutral-300'
                        }`}
                        style={{ boxShadow: 'none' }}
                      >
                        {src ? (
                          <img src={src} alt="" className="w-full h-full object-cover" />
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border border-solid cursor-pointer box-border ${
                        on
                          ? coffee
                            ? 'bg-black text-white border-black'
                            : 'bg-[#102a1c] text-white border-[#102a1c]'
                          : coffee
                            ? 'bg-white text-neutral-800 border-neutral-300'
                            : 'bg-white text-neutral-800 border-[#cfc7b6] dark:border-slate-600'
                      }`}
                    >
                      {isAr && item.labelAr ? item.labelAr : opt}
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
              style={inputStyle}
            />
          );
        }
      })}
    </div>
  );
};
