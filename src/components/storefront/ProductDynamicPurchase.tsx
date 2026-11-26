/**
 * Product page block: variation options + custom fields.
 * Coffee tone = Honor selection chrome (color ring, memory card, offer checkbox/radio).
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
import {
  HonorColorPickerField,
  HonorColorSwatch,
  HonorImageThumb,
  HonorMemoryCard,
  HonorOfferRow,
  HonorSelectMark,
  HonorUploadZone,
  HONOR_FIELD_INPUT_CLASS,
  HONOR_FIELD_INVALID_CLASS,
  HONOR_FIELD_TEXTAREA_CLASS,
  honorCardStyle,
} from './honorSelectionUi';

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
  /** After Buy/Add attempt — empty required fields get rose highlight. */
  invalidFieldIds?: string[];
}

function money(amount: number, isAr: boolean): string {
  const n = Number.isFinite(amount) ? amount : 0;
  const text = n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return isAr ? `${text}⃁` : `⃁ ${text}`;
}

function isHonorCareField(
  field: ProductCustomField,
  optionItems: ReturnType<typeof normalizeCustomFieldOptions>,
): boolean {
  const blob = `${field.name || ''} ${field.nameAr || ''} ${field.type || ''}`.toLowerCase();
  if (/care|warranty|protection|حماية|رعاية|ضمان|صيانة|عناية/.test(blob)) return true;
  const kind = fieldControlKind(field.type, field.options);
  if (!kind.includes('Image')) return false;
  const hasImg = optionItems.some((o) => !!o.imageUrl || choiceLooksLikeImage(o.label));
  return !hasImg;
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
  invalidFieldIds = [],
}) => {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const coffee = tone === 'coffee';
  const invalidSet = new Set(invalidFieldIds);
  const visibleFields = (fields || []).filter((field) =>
    isCustomFieldVisible(field, fieldValues, rules, selected),
  );
  if (options.length === 0 && visibleFields.length === 0) return null;

  const setField = (id: string, value: FieldValueMap[string]) => {
    onFieldValues({ ...fieldValues, [id]: value });
  };

  const requiredMark = (required?: boolean) =>
    required ? (
      <span className="text-rose-600" aria-hidden>
        {' '}
        *
      </span>
    ) : null;

  const requiredHint = (invalid: boolean) =>
    invalid ? (
      <p className="text-[11px] font-bold text-rose-600" role="alert">
        {isAr ? 'هذا الحقل مطلوب لإتمام الطلب' : 'This field is required to place the order'}
      </p>
    ) : null;

  const sectionClass = coffee
    ? 'space-y-3 pt-3 border-t border-neutral-100'
    : 'space-y-2 pt-3 border-t border-[#e8e4dc] dark:border-slate-800';
  const titleClass = coffee
    ? 'text-base font-extrabold text-neutral-900 tracking-tight'
    : 'text-[11px] font-bold text-[#102a1c] dark:text-slate-200';

  return (
    <div className="space-y-4" data-coffee-dynamic-purchase="1">
      {options.map((opt) => {
        const vals = optionValuesList(opt.values).filter((v) => v.selected !== false && v.label.trim());
        const kind = optionKind(opt);
        const current = selected[opt.name] || '';
        const currentRow = vals.find((v) => v.label === current);
        const currentLabel = isAr && currentRow?.labelAr ? currentRow.labelAr : current;
        const optionTitle = isAr && opt.nameAr ? opt.nameAr : opt.name;
        const valueLabel = (v: { label: string; labelAr?: string }) =>
          isAr && v.labelAr ? v.labelAr : v.label;

        return (
          <div key={opt.id || opt.name} className={sectionClass}>
            <h2 className={titleClass}>{optionTitle}</h2>
            {kind === 'color' ? (
              <>
                <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label={optionTitle}>
                  {vals.map((v) => {
                    const on = current === v.label;
                    const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                    return (
                      <HonorColorSwatch
                        key={v.id}
                        hex={v.colorHex || '#cbd5e1'}
                        selected={on}
                        label={valueLabel(v)}
                        disabled={!available}
                        onClick={() =>
                          available && onSelect({ ...selected, [opt.name]: v.label })
                        }
                      />
                    );
                  })}
                </div>
                {currentLabel ? (
                  <div className="pt-1 space-y-1">
                    <div className="text-sm font-bold text-neutral-900">{currentLabel}</div>
                    {coffee && currentRow ? (
                      <div className="inline-block px-2.5 py-1 rounded-md bg-[#2B7CD3] text-white text-xs font-bold font-sans">
                        {money(
                          resolveSelectionPrice(basePrice, options, selected, variations).selling,
                          isAr,
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : kind === 'image' ? (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={optionTitle}>
                {vals.map((v) => {
                  const on = current === v.label;
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                  const src = v.imageUrl || '';
                  if (!src) {
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        disabled={!available}
                        onClick={() =>
                          available && onSelect({ ...selected, [opt.name]: v.label })
                        }
                        className="px-3 py-2 rounded-xl text-xs font-bold box-border"
                        style={honorCardStyle(on)}
                      >
                        {valueLabel(v)}
                      </button>
                    );
                  }
                  return (
                    <HonorImageThumb
                      key={v.id}
                      src={src}
                      selected={on}
                      label={valueLabel(v)}
                      disabled={!available}
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                    />
                  );
                })}
              </div>
            ) : coffee ? (
              <div className="space-y-3" role="radiogroup" aria-label={optionTitle}>
                {vals.map((v) => {
                  const on = current === v.label;
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                  const quote = resolveSelectionPrice(
                    basePrice,
                    options,
                    { ...selected, [opt.name]: v.label },
                    variations,
                  );
                  const mrp = quote.mrp;
                  const sell = quote.selling;
                  return (
                    <HonorMemoryCard
                      key={v.id}
                      selected={on}
                      disabled={!available}
                      title={valueLabel(v)}
                      priceLabel={money(sell, isAr)}
                      compareLabel={
                        mrp != null && mrp > sell ? money(mrp, isAr) : undefined
                      }
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {vals.map((v) => {
                  const on = current === v.label;
                  const available = isOptionValueAvailable(variations, selected, opt.name, v.label);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={on}
                      disabled={!available}
                      onClick={() =>
                        available && onSelect({ ...selected, [opt.name]: v.label })
                      }
                      className={`px-3 py-2 rounded-xl border text-xs font-bold ${
                        !available
                          ? 'opacity-40 cursor-not-allowed line-through border-slate-200'
                          : on
                            ? 'border-[#102a1c] dark:border-emerald-500 bg-[#102a1c]/5 dark:bg-emerald-950/30 cursor-pointer'
                            : 'border-[#d6cfc0] dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer'
                      }`}
                    >
                      {valueLabel(v)}
                    </button>
                  );
                })}
              </div>
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
        const content = field.contentEn || field.contentAr || field.description || '';
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
        const isImageChoiceKind = declaredKind.includes('Image');
        // Multiple* = checkbox multi; Single*/Size = radio one
        const multiple = kind.startsWith('Multiple');
        const selectedOne = Array.isArray(value) ? String(value[0] || '') : text;
        const isOn = (label: string) =>
          multiple ? many.includes(label) : selectedOne === label;
        const toggle = (opt: string) => {
          if (!multiple) {
            setField(field.id, selectedOne === opt ? '' : opt);
            return;
          }
          const next = many.includes(opt) ? many.filter((item) => item !== opt) : [...many, opt];
          setField(field.id, next);
        };

        const coffeeHonorList =
          coffee && fillable && isChoiceKind && optionItemsEarly.length > 0 && !kind.includes('Color');

        if (coffeeHonorList) {
          const careMode = isHonorCareField(field, optionItemsEarly);
          const invalid = invalidSet.has(field.id);

          if (careMode) {
            return (
              <div
                key={field.id}
                className="pt-3"
                data-honor-offer="care"
                data-cf-field={field.id}
                data-cf-required={field.required ? '1' : '0'}
                data-cf-invalid={invalid ? '1' : '0'}
                id={`cf-field-${field.id}`}
              >
                <div
                  data-honor-care-panel="1"
                  className="rounded-xl bg-white p-4 sm:p-5 space-y-1 shadow-none box-border"
                  style={honorCardStyle(true, invalid)}
                >
                  <div className="space-y-1 mb-1">
                    <h2 className="text-base font-extrabold text-neutral-900 tracking-tight">
                      {fieldTitle}
                      {requiredMark(field.required)}
                    </h2>
                    {content ? (
                      <p className="text-[11px] text-neutral-500 leading-relaxed">{content}</p>
                    ) : null}
                    {requiredHint(invalid)}
                  </div>
                  <div className="space-y-1" role={multiple ? 'group' : 'radiogroup'} aria-label={fieldTitle}>
                    {optionItemsEarly.map((item) => {
                      const on = isOn(item.label);
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
                          data-honor-offer-row="1"
                          className="w-full min-h-[56px] flex items-center gap-3 px-4 py-3.5 text-start cursor-pointer box-border transition-colors"
                          style={honorCardStyle(on)}
                        >
                          <HonorSelectMark selected={on} multiple={multiple} />
                          {isImageChoiceKind && thumb ? (
                            <span className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                              <img
                                src={thumb}
                                alt=""
                                className="w-full h-full object-cover object-center"
                                referrerPolicy="no-referrer"
                              />
                            </span>
                          ) : null}
                          <span className="flex-1 min-w-0 text-xs sm:text-sm font-bold text-neutral-900">
                            {title}
                          </span>
                          <span className="shrink-0 text-end">
                            <span className="block text-xs sm:text-sm font-bold font-sans">
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

          // Offer / gift rows — checkbox or radio + thumb; border always visible (focused look)
          return (
            <div
              key={field.id}
              className="space-y-3 pt-3"
              data-honor-offer="gift"
              data-cf-field={field.id}
              data-cf-required={field.required ? '1' : '0'}
              data-cf-invalid={invalid ? '1' : '0'}
              id={`cf-field-${field.id}`}
            >
              <div className="space-y-1">
                <h2 className={titleClass}>
                  {fieldTitle}
                  {requiredMark(field.required)}
                </h2>
                {content ? (
                  <p className="text-[11px] text-neutral-500 leading-relaxed">{content}</p>
                ) : null}
                {requiredHint(invalid)}
              </div>
              <div
                className="space-y-3"
                role={multiple ? 'group' : 'radiogroup'}
                aria-label={fieldTitle}
              >
                {optionItemsEarly.map((item) => {
                  const on = isOn(item.label);
                  const title = isAr && item.labelAr ? item.labelAr : item.label;
                  const thumb = isImageChoiceKind
                    ? item.imageUrl || (choiceLooksLikeImage(item.label) ? item.label : '')
                    : '';
                  const price = Number(item.price) || 0;
                  const compare = Number(item.compareAtPrice) || 0;
                  return (
                    <HonorOfferRow
                      key={item.label}
                      selected={on}
                      multiple={multiple}
                      title={title}
                      thumb={thumb || undefined}
                      priceLabel={money(price, isAr)}
                      compareLabel={compare > price ? money(compare, isAr) : undefined}
                      onClick={() => toggle(item.label)}
                    />
                  );
                })}
              </div>
            </div>
          );
        }

        const invalid = invalidSet.has(field.id);

        return (
          <div
            key={field.id}
            className={sectionClass}
            data-cf-field={field.id}
            data-cf-required={field.required ? '1' : '0'}
            data-cf-invalid={invalid ? '1' : '0'}
            id={`cf-field-${field.id}`}
          >
            {kind === 'Divider' ? (
              <div className="h-px bg-neutral-200 dark:bg-slate-700" />
            ) : (
              <h2 className={`${titleClass} flex items-center justify-between gap-2`}>
                <span>
                  {fieldTitle}
                  {requiredMark(field.required)}
                </span>
                {extra > 0 &&
                kind !== 'Image Upload' &&
                kind !== 'File Upload' &&
                !optionItemsEarly.some((o) => (Number(o.price) || 0) > 0) ? (
                  <span className="text-xs font-semibold text-neutral-500 shrink-0">
                    +{money(extra, isAr)}
                  </span>
                ) : null}
              </h2>
            )}
            {field.imageUrl && kind === 'Content' ? (
              <img src={field.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : null}
            {field.videoUrl ? (
              <video src={field.videoUrl} controls className="w-full max-h-48 rounded-xl bg-black" />
            ) : null}
            {content ? (
              <p
                className={
                  coffee
                    ? 'text-[11px] text-neutral-500 leading-relaxed'
                    : 'text-xs text-neutral-700 dark:text-slate-300 whitespace-pre-line'
                }
              >
                {content}
              </p>
            ) : null}
            {requiredHint(invalid && kind !== 'Divider' && kind !== 'Content')}
            {fillable && kind !== 'Divider' && renderControl()}
          </div>
        );

        function renderControl() {
          const inputClass = coffee
            ? `${HONOR_FIELD_INPUT_CLASS}${invalid ? ` ${HONOR_FIELD_INVALID_CLASS}` : ''}`
            : 'w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-solid border-[#cfc7b6] dark:border-slate-600 bg-white dark:bg-slate-900 text-xs box-border';
          const textareaClass = coffee
            ? `${HONOR_FIELD_TEXTAREA_CLASS}${invalid ? ` ${HONOR_FIELD_INVALID_CLASS}` : ''}`
            : inputClass;

          if (kind === 'Long Text') {
            return (
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setField(field.id, e.target.value)}
                className={textareaClass}
                data-cf-input="long-text"
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
                data-cf-input="number"
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
                data-cf-input={inputType}
              />
            );
          }
          if (kind === 'Image Upload' || kind === 'File Upload') {
            const inputId = `cf-upload-${field.id}`;
            const isImage = kind === 'Image Upload';
            return (
              <HonorUploadZone
                inputId={inputId}
                isImage={isImage}
                isAr={isAr}
                fileName={text || undefined}
                previewUrl={isImage ? previews[field.id] : undefined}
                onFile={(file) => {
                  setField(field.id, file.name);
                  if (isImage) {
                    setPreviews((prev) => ({ ...prev, [field.id]: URL.createObjectURL(file) }));
                  }
                }}
              />
            );
          }
          if (customFieldIsFreeColorPicker(kind) || kind === 'Color Selector') {
            const colorValue = choiceLooksLikeColor(text) ? text : '#64748b';
            const pickerId = `cf-color-${field.id}`;
            return (
              <HonorColorPickerField
                pickerId={pickerId}
                value={colorValue}
                isAr={isAr}
                onChange={(hex) => setField(field.id, hex)}
              />
            );
          }

          const optionItems = normalizeCustomFieldOptions(field.options);
          if (
            kind === 'Single Choice' ||
            kind === 'Multiple Choice' ||
            kind === 'Size Selector' ||
            kind === 'Single Choice Image' ||
            kind === 'Multiple Choice Image' ||
            kind === 'Single Choice Color' ||
            kind === 'Multiple Choice Color'
          ) {
            const isColorKind = kind.includes('Color') || declaredKind.includes('Color');
            const isImageKind = declaredKind.includes('Image');

            if (coffee && (isColorKind || optionItems.every((o) => choiceLooksLikeColor(o.label) || choiceLooksLikeColor(o.imageUrl || '')))) {
              const active = optionItems.find((o) => isOn(o.label));
              return (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3" role={multiple ? 'group' : 'radiogroup'} aria-label={fieldTitle}>
                    {optionItems.map((item) => {
                      const on = isOn(item.label);
                      const swatch = resolveChoiceSwatchColor(item);
                      const swatchLabel = isAr && item.labelAr ? item.labelAr : item.label;
                      return (
                        <HonorColorSwatch
                          key={item.label}
                          hex={swatch}
                          selected={on}
                          label={swatchLabel}
                          onClick={() => toggle(item.label)}
                        />
                      );
                    })}
                  </div>
                  {active ? (
                    <div className="pt-0.5 space-y-1">
                      <div className="text-sm font-bold text-neutral-900">
                        {isAr && active.labelAr ? active.labelAr : active.label}
                      </div>
                      {(Number(active.price) || 0) > 0 ? (
                        <div className="inline-block px-2.5 py-1 rounded-md bg-[#2B7CD3] text-white text-xs font-bold font-sans">
                          {money(Number(active.price) || 0, isAr)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            }

            if (coffee && isImageKind) {
              return (
                <div className="space-y-3" role={multiple ? 'group' : 'radiogroup'} aria-label={fieldTitle}>
                  {optionItems.map((item) => {
                    const on = isOn(item.label);
                    const title = isAr && item.labelAr ? item.labelAr : item.label;
                    const thumb =
                      item.imageUrl || (choiceLooksLikeImage(item.label) ? item.label : '');
                    const price = Number(item.price) || 0;
                    const compare = Number(item.compareAtPrice) || 0;
                    return (
                      <HonorOfferRow
                        key={item.label}
                        selected={on}
                        multiple={multiple}
                        title={title}
                        thumb={thumb || undefined}
                        priceLabel={money(price, isAr)}
                        compareLabel={compare > price ? money(compare, isAr) : undefined}
                        onClick={() => toggle(item.label)}
                      />
                    );
                  })}
                </div>
              );
            }

            if (coffee) {
              return (
                <div
                  className="space-y-3"
                  role={multiple ? 'group' : 'radiogroup'}
                  aria-label={fieldTitle}
                >
                  {optionItems.map((item) => {
                    const on = isOn(item.label);
                    const title = isAr && item.labelAr ? item.labelAr : item.label;
                    const price = Number(item.price) || Number(field.extraPrice) || 0;
                    const compare = Number(item.compareAtPrice) || 0;
                    return (
                      <HonorOfferRow
                        key={item.label}
                        selected={on}
                        multiple={multiple}
                        title={title}
                        priceLabel={price > 0 ? money(price, isAr) : undefined}
                        compareLabel={compare > price ? money(compare, isAr) : undefined}
                        onClick={() => toggle(item.label)}
                      />
                    );
                  })}
                </div>
              );
            }

            // Mecca / non-coffee fallback chips
            return (
              <div className="flex flex-wrap gap-2">
                {optionItems.map((item) => {
                  const on = isOn(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(item.label)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                        on
                          ? 'bg-[#102a1c] text-white border-[#102a1c]'
                          : 'bg-white text-neutral-800 border-[#cfc7b6]'
                      }`}
                    >
                      {isAr && item.labelAr ? item.labelAr : item.label}
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
              data-cf-input="short-text"
            />
          );
        }
      })}
    </div>
  );
};
