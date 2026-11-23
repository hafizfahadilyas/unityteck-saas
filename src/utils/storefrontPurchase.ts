/**
 * Storefront purchase: every saved option (text / color / image) and the
 * custom fields that follow variations. Prices and images come from the
 * product's own variant rows.
 */
import type {
  Product,
  ProductConditionalRuleDefinition,
  ProductCustomField,
  ProductCustomFieldOptionItem,
  ProductOptionDefinition,
  ProductVariation,
} from '../types';
import { customFieldIsFillable, normalizeCustomFieldType } from './customFieldTypes';
import { mergeBilingualProductOptions } from './existingProductCommerce';
import {
  evalConditionGroup,
  evalFieldCondition,
  findMatchingVariant,
  isVariantPurchasable,
  optionValuesList,
  variantPriceParts,
} from './productVariants';

export type FieldValue = string | string[];
export type FieldValueMap = Record<string, FieldValue>;

export function visibleProductOptions(
  raw: Product['productOptions'] | null | undefined,
): ProductOptionDefinition[] {
  if (!Array.isArray(raw)) return [];
  return mergeBilingualProductOptions(
    raw.filter((opt) => opt && opt.visible !== false && String(opt.name || '').trim()),
  );
}

export function optionKind(opt: ProductOptionDefinition): 'color' | 'image' | 'text' {
  const t = String(opt.type || '').toLowerCase();
  if (t === 'color' || t.includes('color')) return 'color';
  if (t === 'image' || t === 'video' || t.includes('image')) return 'image';
  return 'text';
}

export function initialOptionSelection(
  options: ProductOptionDefinition[] | undefined,
  variations: ProductVariation[] | undefined,
): Record<string, string> {
  const visible = visibleProductOptions(options);
  const active =
    variations?.find((v) => v.isActive !== false && (v.unlimitedStock || Number(v.stock) > 0)) ||
    variations?.find((v) => v.isActive !== false);
  const pick: Record<string, string> = {};
  for (const opt of visible) {
    const fromVariant = active?.options?.[opt.name];
    if (fromVariant) {
      pick[opt.name] = fromVariant;
      continue;
    }
    const first = optionValuesList(opt.values).find((v) => v.selected !== false && v.label.trim());
    if (first) pick[opt.name] = first.label;
  }
  return pick;
}

export function resolveSelectionPrice(
  base: number,
  options: ProductOptionDefinition[],
  selected: Record<string, string>,
  variations: ProductVariation[] | undefined,
): {
  selling: number;
  mrp: number | null;
  image: string | null;
  variant: ProductVariation | null;
  purchasable: boolean | null;
} {
  const variant = findMatchingVariant(variations, selected);
  let image: string | null = variant?.imageUrl || null;
  for (const opt of options) {
    const label = selected[opt.name];
    const val = optionValuesList(opt.values).find((v) => v.label === label);
    if (val?.imageUrl) image = val.imageUrl;
  }
  if (variant && variant.price != null && Number.isFinite(Number(variant.price))) {
    const parts = variantPriceParts(variant);
    return {
      selling: parts.selling ?? base,
      mrp: parts.mrp,
      image: variant.imageUrl || image,
      variant,
      purchasable: variant.isActive === false ? false : isVariantPurchasable(variant, 1),
    };
  }
  let sellExtra = 0;
  let mrpExtra = 0;
  for (const opt of options) {
    const val = optionValuesList(opt.values).find((v) => v.label === selected[opt.name]);
    if (!val) continue;
    const sellBit = val.salePrice != null ? Number(val.salePrice) : val.price != null ? Number(val.price) : 0;
    const mrpBit = val.price != null ? Number(val.price) : val.salePrice != null ? Number(val.salePrice) : 0;
    if (Number.isFinite(sellBit)) sellExtra += sellBit;
    if (Number.isFinite(mrpBit)) mrpExtra += mrpBit;
  }
  const selling = base + sellExtra;
  const mrp = mrpExtra > sellExtra ? base + mrpExtra : null;
  return { selling, mrp, image, variant: null, purchasable: null };
}

function hasAnswer(value: FieldValue | undefined): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return String(value ?? '').trim() !== '';
}

/** Normalize string / object custom-field options for Honor-style cards. */
export function normalizeCustomFieldOptions(
  options: ProductCustomField['options'] | undefined,
): ProductCustomFieldOptionItem[] {
  if (!Array.isArray(options)) return [];
  return options
    .map((opt) => {
      if (typeof opt === 'string') {
        const label = opt.trim();
        if (!label) return null;
        // "Name (+SAR 99)" / "Name (99)" → label + price hint
        const priced = label.match(/^(.*?)\s*\(\+?\s*(?:SAR|⃁|ر\.?\s*س\.?)?\s*([\d.,]+)\s*\)$/i);
        if (priced) {
          const price = Number(String(priced[2]).replace(/,/g, ''));
          return {
            label: priced[1].trim() || label,
            ...(Number.isFinite(price) ? { price } : {}),
          };
        }
        if (choiceLooksLikeImage(label)) {
          return { label, imageUrl: label };
        }
        return { label };
      }
      if (opt && typeof opt === 'object') {
        const label = String(opt.label || '').trim();
        if (!label) return null;
        return {
          label,
          labelAr: opt.labelAr ? String(opt.labelAr) : undefined,
          imageUrl: opt.imageUrl ? String(opt.imageUrl) : undefined,
          price: opt.price != null && Number.isFinite(Number(opt.price)) ? Number(opt.price) : undefined,
          compareAtPrice:
            opt.compareAtPrice != null && Number.isFinite(Number(opt.compareAtPrice))
              ? Number(opt.compareAtPrice)
              : undefined,
        };
      }
      return null;
    })
    .filter((row): row is ProductCustomFieldOptionItem => !!row);
}

export function isCustomFieldVisible(
  field: ProductCustomField,
  values: FieldValueMap,
  rules: ProductConditionalRuleDefinition[] | undefined,
  selected: Record<string, string>,
): boolean {
  if (field.hidden) return false;
  const targeted = (rules || []).filter((rule) =>
    (rule.targetFieldNames || []).includes(field.name),
  );
  for (const rule of targeted) {
    const match = evalFieldCondition(rule.operator, selected[rule.optionName] || '', rule.value);
    if (rule.action === 'hide' && match) return false;
    if (rule.action === 'show' && !match) return false;
  }
  const conditions = field.conditions || [];
  if (!conditions.length) return true;
  return evalConditionGroup(conditions, field.conditionJoin === 'OR' ? 'OR' : 'AND', values);
}

export function customFieldsExtra(
  fields: ProductCustomField[] | undefined,
  values: FieldValueMap,
  rules: ProductConditionalRuleDefinition[] | undefined,
  selected: Record<string, string>,
): number {
  if (!fields?.length) return 0;
  return fields.reduce((sum, field) => {
    if (!customFieldIsFillable(field.type)) return sum;
    if (!isCustomFieldVisible(field, values, rules, selected)) return sum;
    if (!hasAnswer(values[field.id])) return sum;
    const value = values[field.id];
    const picked = Array.isArray(value) ? value : [String(value)];
    const items = normalizeCustomFieldOptions(field.options);
    let optionSum = 0;
    for (const label of picked) {
      const row = items.find((item) => item.label === label);
      const p = Number(row?.price) || 0;
      if (p > 0) optionSum += p;
    }
    if (optionSum > 0) return sum + optionSum;
    const extra = Number(field.extraPrice) || 0;
    return sum + (extra > 0 ? extra : 0);
  }, 0);
}

export function missingRequiredField(
  fields: ProductCustomField[] | undefined,
  values: FieldValueMap,
  rules: ProductConditionalRuleDefinition[] | undefined,
  selected: Record<string, string>,
  isAr: boolean,
): string | null {
  if (!fields?.length) return null;
  for (const field of fields) {
    if (!field.required || !customFieldIsFillable(field.type)) continue;
    if (!isCustomFieldVisible(field, values, rules, selected)) continue;
    if (!hasAnswer(values[field.id])) {
      return isAr ? `الحقل «${field.name}» مطلوب` : `${field.name} is required`;
    }
  }
  return null;
}

export function purchaseNotes(
  fields: ProductCustomField[] | undefined,
  values: FieldValueMap,
  rules: ProductConditionalRuleDefinition[] | undefined,
  selected: Record<string, string>,
  isAr = false,
): string[] {
  if (!fields?.length) return [];
  const notes: string[] = [];
  for (const field of fields) {
    if (!customFieldIsFillable(field.type)) continue;
    if (!isCustomFieldVisible(field, values, rules, selected)) continue;
    const value = values[field.id];
    if (!hasAnswer(value)) continue;
    const fieldLabel = isAr && field.nameAr ? field.nameAr : field.name;
    const items = normalizeCustomFieldOptions(field.options);
    const labels = (Array.isArray(value) ? value : [String(value)]).map((raw) => {
      const row = items.find((item) => item.label === raw);
      if (!row) return String(raw);
      return isAr && row.labelAr ? row.labelAr : row.label;
    });
    notes.push(`${fieldLabel}: ${labels.join(', ')}`);
  }
  return notes;
}

/**
 * Flatten cart line selections into order_items.selected_options so admin + invoices
 * show every choice the customer made (options, add-ons, care, color, bundles…).
 */
export function buildCartLineSelectedOptions(item: {
  selectedOptions?: Record<string, string> | null;
  optionSummary?: string;
  purchaseNotes?: string[];
  selectedColor?: { name?: string; nameAr?: string } | null;
  selectedStorage?: { capacity?: string; capacityAr?: string } | null;
  selectedWarranty?: { name?: string; nameAr?: string } | null;
  selectedBundles?: Array<{ name?: string; nameAr?: string; price?: number }> | null;
  customCornerSpecs?: unknown;
}, isAr = false): Record<string, string> {
  const out: Record<string, string> = {};
  const fromOpts = item.selectedOptions;
  if (fromOpts && typeof fromOpts === 'object') {
    for (const [k, v] of Object.entries(fromOpts)) {
      if (k.startsWith('_')) continue;
      if (v == null || String(v).trim() === '') continue;
      out[k] = Array.isArray(v) ? v.join(', ') : String(v);
    }
  }
  if (item.optionSummary && String(item.optionSummary).trim()) {
    out[isAr ? 'الخيارات' : 'Options'] = String(item.optionSummary).trim();
  }
  const colorName = isAr
    ? (item.selectedColor?.nameAr || item.selectedColor?.name || '')
    : (item.selectedColor?.name || item.selectedColor?.nameAr || '');
  if (colorName.trim()) out[isAr ? 'اللون' : 'Color'] = colorName.trim();

  const edition = isAr
    ? (item.selectedStorage?.capacityAr || item.selectedStorage?.capacity || '')
    : (item.selectedStorage?.capacity || item.selectedStorage?.capacityAr || '');
  if (edition.trim()) out[isAr ? 'الإصدار' : 'Edition'] = edition.trim();

  const warranty = isAr
    ? (item.selectedWarranty?.nameAr || item.selectedWarranty?.name || '')
    : (item.selectedWarranty?.name || item.selectedWarranty?.nameAr || '');
  if (warranty.trim()) out[isAr ? 'الضمان' : 'Warranty'] = warranty.trim();

  const bundles = (item.selectedBundles || [])
    .map((b) => {
      const label = isAr ? (b.nameAr || b.name || '') : (b.name || b.nameAr || '');
      return label.trim();
    })
    .filter(Boolean);
  if (bundles.length) out[isAr ? 'الإضافات' : 'Bundles'] = bundles.join(', ');

  for (const note of item.purchaseNotes || []) {
    const raw = String(note || '').trim();
    if (!raw) continue;
    const idx = raw.indexOf(':');
    if (idx > 0) {
      const k = raw.slice(0, idx).trim();
      const v = raw.slice(idx + 1).trim();
      if (k && v) out[k] = v;
    } else {
      out[raw] = isAr ? 'نعم' : 'Yes';
    }
  }

  if (item.customCornerSpecs) {
    out[isAr ? 'ركن مخصص' : 'Custom corner'] = isAr ? 'نعم' : 'Yes';
  }

  return out;
}

export function choiceLooksLikeImage(value: string): boolean {
  return /^(https?:|data:image|\/)/i.test(value.trim());
}

export function choiceLooksLikeColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export function fieldControlKind(type: string | undefined): string {
  return normalizeCustomFieldType(type);
}
