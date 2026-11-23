/**
 * Custom Fields — supported field types (Product Customization §5)
 * Values are stable English keys stored on products; labels are locale-aware.
 */

export const CUSTOM_FIELD_TYPES = [
  'Short Text',
  'Long Text',
  'Number',
  'Single Choice',
  'Single Choice Image',
  'Single Choice Color',
  'Multiple Choice',
  'Multiple Choice Image',
  'Multiple Choice Color',
  'Image Upload',
  'File Upload',
  'Date',
  'Time',
  'Date and Time',
  'Location',
  'Color Selector',
  'Size Selector',
  'Divider',
  'Content',
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

const LABEL_EN: Record<CustomFieldType, string> = {
  'Short Text': 'Short Text',
  'Long Text': 'Long Text',
  Number: 'Number',
  'Single Choice': 'Single Choice – Text',
  'Single Choice Image': 'Single Choice – Image',
  'Single Choice Color': 'Single Choice – Color',
  'Multiple Choice': 'Multiple Choice – Text',
  'Multiple Choice Image': 'Multiple Choice – Image',
  'Multiple Choice Color': 'Multiple Choice – Color',
  'Image Upload': 'Image Upload',
  'File Upload': 'File Upload',
  Date: 'Date',
  Time: 'Time',
  'Date and Time': 'Date and Time',
  Location: 'Location',
  'Color Selector': 'Color Picker',
  'Size Selector': 'Size Selector',
  Divider: 'Divider',
  Content: 'Content',
};

const LABEL_AR: Record<CustomFieldType, string> = {
  'Short Text': 'نص قصير',
  'Long Text': 'نص طويل',
  Number: 'رقم',
  'Single Choice': 'اختيار واحد – نص',
  'Single Choice Image': 'اختيار واحد – صورة',
  'Single Choice Color': 'اختيار واحد – لون',
  'Multiple Choice': 'اختيار متعدد – نص',
  'Multiple Choice Image': 'اختيار متعدد – صورة',
  'Multiple Choice Color': 'اختيار متعدد – لون',
  'Image Upload': 'رفع صورة',
  'File Upload': 'رفع ملف',
  Date: 'تاريخ',
  Time: 'وقت',
  'Date and Time': 'تاريخ ووقت',
  Location: 'موقع',
  'Color Selector': 'محدد اللون',
  'Size Selector': 'محدد المقاس',
  Divider: 'فاصل',
  Content: 'محتوى',
};

/** Map legacy type strings to the canonical set */
const LEGACY_TYPE_MAP: Record<string, CustomFieldType> = {
  Text: 'Short Text',
  text: 'Short Text',
  Textarea: 'Long Text',
  textarea: 'Long Text',
  Dropdown: 'Single Choice',
  dropdown: 'Single Choice',
  'Single Select': 'Single Choice',
  Checkbox: 'Multiple Choice',
  checkbox: 'Multiple Choice',
  File: 'File Upload',
  file: 'File Upload',
  Color: 'Color Selector',
  color: 'Color Selector',
  Datetime: 'Date and Time',
  DateTime: 'Date and Time',
  datetime: 'Date and Time',
  Size: 'Size Selector',
  size: 'Size Selector',
};

export const CONDITIONAL_OPERATORS = [
  { id: 'equals', labelEn: 'Equals', labelAr: 'يساوي' },
  { id: 'not_equals', labelEn: 'Does Not Equal', labelAr: 'لا يساوي' },
  { id: 'is_selected', labelEn: 'Is Selected', labelAr: 'محدد' },
  { id: 'is_not_selected', labelEn: 'Is Not Selected', labelAr: 'غير محدد' },
  { id: 'contains', labelEn: 'Contains', labelAr: 'يحتوي' },
  { id: 'not_contains', labelEn: 'Does Not Contain', labelAr: 'لا يحتوي' },
  { id: 'is_empty', labelEn: 'Is Empty', labelAr: 'فارغ' },
  { id: 'is_not_empty', labelEn: 'Is Not Empty', labelAr: 'غير فارغ' },
] as const;

export function normalizeCustomFieldType(raw?: string | null): CustomFieldType {
  if (!raw) return 'Short Text';
  if ((CUSTOM_FIELD_TYPES as readonly string[]).includes(raw)) {
    return raw as CustomFieldType;
  }
  return LEGACY_TYPE_MAP[raw] || 'Short Text';
}

export function getCustomFieldTypeLabel(type: string | undefined | null, isAr: boolean): string {
  const normalized = normalizeCustomFieldType(type);
  return isAr ? LABEL_AR[normalized] : LABEL_EN[normalized];
}

export function customFieldNeedsOptions(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return (
    t === 'Single Choice' ||
    t === 'Single Choice Image' ||
    t === 'Single Choice Color' ||
    t === 'Multiple Choice' ||
    t === 'Multiple Choice Image' ||
    t === 'Multiple Choice Color' ||
    t === 'Color Selector' ||
    t === 'Size Selector'
  );
}

/** Explicit Image choice types — option rows show Upload / Media library. */
export function customFieldNeedsOptionImages(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return t === 'Single Choice Image' || t === 'Multiple Choice Image';
}

/**
 * Option thumbnails only for Image choice types.
 * Single/Multiple Choice (Text) and Size Selector stay text (+ price) only.
 */
export function customFieldAllowsOptionImages(type: string | undefined | null): boolean {
  return customFieldNeedsOptionImages(type);
}

/** True when an option carries a real image URL (not a color hex). */
export function customFieldOptionHasImage(
  opt: string | { imageUrl?: string | null; label?: string | null } | null | undefined,
): boolean {
  if (opt == null) return false;
  const looksLikeImage = (raw: string) => {
    const value = raw.trim();
    if (!value || /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return false;
    if (/^(https?:|data:image|blob:|\/)/i.test(value)) return true;
    if (/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(value)) return true;
    // Media library / R2 relative keys e.g. stores/{id}/media/...
    if (value.includes('/') && !/\s/.test(value)) return true;
    return false;
  };
  if (typeof opt === 'string') return looksLikeImage(opt);
  const url = String(opt.imageUrl || '').trim();
  if (looksLikeImage(url)) return true;
  return looksLikeImage(String(opt.label || ''));
}

/**
 * Upgrade legacy Text choice fields that already store option images
 * → Single/Multiple Choice Image (keeps thumbs; matches field-type rules).
 */
export function coerceCustomFieldTypeForOptions(
  type: string | undefined | null,
  options?: Array<string | { imageUrl?: string | null; label?: string | null }> | null,
): CustomFieldType {
  const t = normalizeCustomFieldType(type);
  const rows = Array.isArray(options) ? options : [];
  if (!rows.some((row) => customFieldOptionHasImage(row))) return t;
  if (t === 'Single Choice') return 'Single Choice Image';
  if (t === 'Multiple Choice') return 'Multiple Choice Image';
  return t;
}

/** Choice rows that use a color swatch / HEX. */
export function customFieldNeedsOptionColors(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return (
    t === 'Single Choice Color' ||
    t === 'Multiple Choice Color' ||
    t === 'Color Selector'
  );
}

/** Customer uploads on the product page — merchant does not add choice options. */
export function customFieldIsCustomerUpload(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return t === 'Image Upload' || t === 'File Upload';
}

/** Multiple Choice* = customer can pick several options (checkboxes). */
export function customFieldAllowsMultiSelect(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return t.startsWith('Multiple Choice');
}

export function customFieldIsFillable(type: string | undefined | null): boolean {
  const kind = normalizeCustomFieldType(type);
  return kind !== 'Divider' && kind !== 'Content';
}

/**
 * Per-option Price / Compare-at — only on commerce choice rows (not Size/Color swatches).
 */
export function customFieldAllowsOptionPrices(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return (
    t === 'Single Choice' ||
    t === 'Single Choice Image' ||
    t === 'Single Choice Color' ||
    t === 'Multiple Choice' ||
    t === 'Multiple Choice Image' ||
    t === 'Multiple Choice Color'
  );
}

/**
 * Field-level Extra Price — only freeform fill fields that can add a surcharge.
 * Choice types use per-option prices; uploads / content / divider never show price.
 */
export function customFieldAllowsFieldExtraPrice(type: string | undefined | null): boolean {
  const t = normalizeCustomFieldType(type);
  return (
    t === 'Short Text' ||
    t === 'Long Text' ||
    t === 'Number' ||
    t === 'Location' ||
    t === 'Date' ||
    t === 'Time' ||
    t === 'Date and Time'
  );
}
