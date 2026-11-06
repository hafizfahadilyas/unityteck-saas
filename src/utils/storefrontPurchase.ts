/**
 * Storefront purchase: every saved option (text / color / image) and the
 * custom fields that follow variations. Prices and images come from the
 * product's own variant rows.
 */
import type {
  Product,
  ProductConditionalRuleDefinition,
  ProductCustomField,
  ProductOptionDefinition,
  ProductVariation,
} from '../types';
import { customFieldIsFillable, normalizeCustomFieldType } from './customFieldTypes';
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
  return raw.filter((opt) => opt && opt.visible !== false && String(opt.name || '').trim());
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
): string[] {
  if (!fields?.length) return [];
  const notes: string[] = [];
  for (const field of fields) {
    if (!customFieldIsFillable(field.type)) continue;
    if (!isCustomFieldVisible(field, values, rules, selected)) continue;
    const value = values[field.id];
    if (!hasAnswer(value)) continue;
    const text = Array.isArray(value) ? value.join(', ') : String(value);
    notes.push(`${field.name}: ${text}`);
  }
  return notes;
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
