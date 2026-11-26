/**
 * Honor buy-page selection chrome — custom fields + legacy options.
 * Premium flat UI: visible radio/check, bordered cards, color rings, tall inputs.
 */
import React from 'react';

/** Idle cards already use the focused black rim so borders never depend on mouse focus. */
export const HONOR_IDLE_BORDER = '2px solid #171717';
export const HONOR_ACTIVE_BORDER = '2px solid #171717';
export const HONOR_INVALID_BORDER = '2px solid #e11d48';
export const HONOR_CARD_RADIUS = 14;

export const HONOR_FIELD_INPUT_CLASS =
  'w-full min-h-[52px] px-4 py-3 rounded-xl border-2 border-solid border-neutral-900 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 box-border shadow-none transition-[border-color,box-shadow] duration-150 focus:border-neutral-900 focus:outline-none focus:ring-[3px] focus:ring-neutral-900/12';

export const HONOR_FIELD_TEXTAREA_CLASS =
  'w-full min-h-[112px] px-4 py-3.5 rounded-xl border-2 border-solid border-neutral-900 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 box-border shadow-none resize-y transition-[border-color,box-shadow] duration-150 focus:border-neutral-900 focus:outline-none focus:ring-[3px] focus:ring-neutral-900/12';

export const HONOR_FIELD_INVALID_CLASS =
  'border-rose-600 focus:border-rose-600 focus:ring-rose-600/20';

export function honorCardStyle(selected: boolean, invalid = false): React.CSSProperties {
  return {
    boxShadow: 'none',
    border: invalid ? HONOR_INVALID_BORDER : selected ? HONOR_ACTIVE_BORDER : HONOR_IDLE_BORDER,
    borderRadius: HONOR_CARD_RADIUS,
    background: selected ? '#fafafa' : '#ffffff',
  };
}

export function honorThumbStyle(selected: boolean): React.CSSProperties {
  return {
    boxShadow: 'none',
    border: selected ? HONOR_ACTIVE_BORDER : '1px solid #d4d4d4',
    borderRadius: 12,
    background: '#ffffff',
  };
}

/** Square checkbox (multi) or round radio (single) — always visible on cards. */
export const HonorSelectMark: React.FC<{
  selected: boolean;
  multiple?: boolean;
}> = ({ selected, multiple }) => (
  <span
    data-honor-select-mark="1"
    className={`flex items-center justify-center shrink-0 bg-white box-border transition-colors border-neutral-900 ${
      multiple ? 'w-5 h-5 rounded-[4px]' : 'w-5 h-5 rounded-full'
    }`}
    style={{
      boxShadow: 'none',
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#171717',
    }}
    aria-hidden
  >
    {selected ? (
      <span
        className={`bg-neutral-900 block ${
          multiple ? 'w-2.5 h-2.5 rounded-[2px]' : 'w-2.5 h-2.5 rounded-full'
        }`}
      />
    ) : null}
  </span>
);

/** Color swatch — selected = outer dark ring + optional check. */
export const HonorColorSwatch: React.FC<{
  hex: string;
  selected: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ hex, selected, label, disabled, onClick }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    data-honor-color-swatch="1"
    data-selected={selected ? '1' : '0'}
    className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
      disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
    }`}
    style={{
      width: selected ? 46 : 40,
      height: selected ? 46 : 40,
      padding: selected ? 3 : 2,
      background: '#ffffff',
      boxShadow: selected ? '0 0 0 2px #171717' : '0 0 0 1px #d4d4d4',
    }}
  >
    <span
      className="w-full h-full rounded-full block relative overflow-hidden"
      style={{
        backgroundColor: hex || '#cbd5e1',
      }}
      aria-hidden
    >
      {selected ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M3 7.2L5.8 10 11 4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : null}
    </span>
  </button>
);

/** Text / size option card — horizontal: radio + title + optional price. */
export const HonorMemoryCard: React.FC<{
  selected: boolean;
  title: string;
  subtitle?: string;
  priceLabel?: string;
  compareLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  thumb?: string;
}> = ({ selected, title, subtitle, priceLabel, compareLabel, onClick, disabled, thumb }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    disabled={disabled}
    onClick={onClick}
    data-honor-memory-card="1"
    data-selected={selected ? '1' : '0'}
    className={`w-full min-h-[56px] px-4 py-3.5 text-start transition-all duration-150 box-border ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-500'
    }`}
    style={honorCardStyle(selected)}
  >
    <div className="flex items-center gap-3 w-full">
      <HonorSelectMark selected={selected} multiple={false} />
      {thumb ? (
        <span
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-neutral-50"
          style={{ border: '1px solid #D2D2D7' }}
        >
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
        </span>
      ) : null}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-neutral-900 leading-snug">{title}</span>
        {subtitle ? (
          <span className="block text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{subtitle}</span>
        ) : null}
      </span>
      {(priceLabel || compareLabel) && (
        <span className="shrink-0 text-end">
          {priceLabel ? (
            <span className="block text-sm font-bold text-neutral-900 font-sans tabular-nums">{priceLabel}</span>
          ) : null}
          {compareLabel ? (
            <span className="block text-[11px] text-neutral-400 line-through font-sans tabular-nums">
              {compareLabel}
            </span>
          ) : null}
        </span>
      )}
    </div>
  </button>
);

/** Offer / gift row — radio or checkbox + thumb + prices. */
export const HonorOfferRow: React.FC<{
  selected: boolean;
  multiple?: boolean;
  title: string;
  subtitle?: string;
  thumb?: string;
  priceLabel?: string;
  compareLabel?: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({
  selected,
  multiple,
  title,
  subtitle,
  thumb,
  priceLabel,
  compareLabel,
  onClick,
  disabled,
}) => (
  <button
    type="button"
    role={multiple ? 'checkbox' : 'radio'}
    aria-checked={selected}
    disabled={disabled}
    onClick={onClick}
    data-honor-offer-row="1"
    data-selected={selected ? '1' : '0'}
    className={`w-full min-h-[56px] flex items-center gap-3 px-4 py-3.5 text-start transition-all duration-150 box-border ${
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-500'
    }`}
    style={honorCardStyle(selected)}
  >
    <HonorSelectMark selected={selected} multiple={multiple} />
    {thumb ? (
      <span
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-50"
        style={{ border: '1px solid #D2D2D7' }}
      >
        <img
          src={thumb}
          alt=""
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
      </span>
    ) : null}
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-neutral-900 leading-snug">{title}</span>
      {subtitle ? (
        <span className="block text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{subtitle}</span>
      ) : null}
    </span>
    <span className="shrink-0 text-end">
      {priceLabel ? (
        <span className="block text-sm font-bold text-neutral-900 font-sans tabular-nums">{priceLabel}</span>
      ) : null}
      {compareLabel ? (
        <span className="block text-[11px] text-neutral-400 line-through font-sans tabular-nums">
          {compareLabel}
        </span>
      ) : null}
    </span>
  </button>
);

/** Gallery / image-option thumbnail. */
export const HonorImageThumb: React.FC<{
  src: string;
  selected: boolean;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}> = ({ src, selected, label, onClick, disabled, size = 64 }) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    data-honor-image-thumb="1"
    className={`rounded-xl overflow-hidden bg-white p-1 box-border shrink-0 transition-transform duration-150 ${
      disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
    }`}
    style={{
      ...honorThumbStyle(selected),
      width: size,
      height: size,
    }}
  >
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover object-center pointer-events-none rounded-lg"
      referrerPolicy="no-referrer"
    />
  </button>
);

/** Drag-style upload zone for image / file custom fields. */
export const HonorUploadZone: React.FC<{
  inputId: string;
  isImage: boolean;
  isAr: boolean;
  fileName?: string;
  previewUrl?: string;
  onFile: (file: File) => void;
}> = ({ inputId, isImage, isAr, fileName, previewUrl, onFile }) => (
  <div className="space-y-3" data-honor-upload="1">
    <input
      id={inputId}
      type="file"
      accept={isImage ? 'image/*' : undefined}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFile(file);
      }}
    />
    <label
      htmlFor={inputId}
      data-honor-upload-zone="1"
      className="flex flex-col items-center justify-center gap-2.5 w-full min-h-[132px] px-5 py-6 rounded-xl border-2 border-dashed border-neutral-900 bg-neutral-50/80 cursor-pointer text-center transition-colors duration-150 hover:border-neutral-900 hover:bg-neutral-50"
    >
      <span
        className="w-11 h-11 rounded-full bg-white border border-[#d2d2d7] flex items-center justify-center text-neutral-700"
        aria-hidden
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 16V8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-sm font-bold text-neutral-900">
        {isImage
          ? isAr
            ? 'اضغط لرفع صورة'
            : 'Tap to upload image'
          : isAr
            ? 'اضغط لرفع ملف'
            : 'Tap to upload file'}
      </span>
      <span className="text-[11px] text-neutral-500">
        {isAr ? 'أو اسحب الملف هنا' : 'Or drag a file here'}
      </span>
    </label>
    {previewUrl ? (
      <img
        src={previewUrl}
        alt=""
        className="w-28 h-28 rounded-xl object-cover border border-[#d2d2d7] shadow-none"
      />
    ) : null}
    {fileName ? (
      <p className="text-xs text-neutral-600 break-all font-medium" data-honor-upload-name="1">
        {fileName}
      </p>
    ) : null}
  </div>
);

/** Free color picker — swatch + hex + native picker control. */
export const HonorColorPickerField: React.FC<{
  pickerId: string;
  value: string;
  onChange: (hex: string) => void;
  isAr: boolean;
}> = ({ pickerId, value, onChange, isAr }) => (
  <div
    data-honor-color-picker="1"
    className="flex flex-wrap items-center gap-3 min-h-[56px] w-full px-4 py-3 rounded-xl border-2 border-solid border-neutral-900 bg-white box-border"
  >
    <label htmlFor={pickerId} className="cursor-pointer shrink-0">
      <span
        className="w-12 h-12 rounded-xl border border-[#d2d2d7] block shadow-inner"
        style={{ backgroundColor: value }}
        aria-hidden
      />
      <input
        id={pickerId}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </label>
    <div className="flex-1 min-w-[120px]">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-neutral-500 mb-1">
        {isAr ? 'اللون المختار' : 'Selected color'}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === '') onChange(v || '#64748b');
        }}
        className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-[#d2d2d7] text-xs font-mono uppercase bg-white focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        aria-label={isAr ? 'رمز اللون' : 'Color hex'}
        maxLength={7}
      />
    </div>
    <label
      htmlFor={pickerId}
      className="shrink-0 min-h-[40px] px-4 py-2 rounded-lg border border-neutral-900 bg-neutral-900 text-white text-xs font-bold cursor-pointer"
    >
      {isAr ? 'اختيار لون' : 'Pick color'}
    </label>
  </div>
);