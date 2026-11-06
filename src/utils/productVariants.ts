/**
 * Product options → variants helpers (extend existing catalog — no duplicate systems).
 */
import type { ProductOptionDefinition, ProductVariation } from '../types';

function numOrNull(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function optionValuesList(
  values: ProductOptionDefinition['values'],
): Array<{
  id: string;
  label: string;
  colorHex?: string;
  imageUrl?: string;
  videoUrl?: string;
  selected?: boolean;
  labelAr?: string;
  price?: number | null;
  salePrice?: number | null;
  stock?: number | null;
  sku?: string;
  weight?: number | null;
  weightUnit?: string | null;
}> {
  if (!Array.isArray(values)) return [];
  return values.map((v, i) => {
    if (typeof v === 'string') {
      return { id: `v_${i}`, label: v, selected: true };
    }
    return {
      id: v.id || `v_${i}`,
      label: v.label,
      labelAr: v.labelAr,
      colorHex: v.colorHex,
      imageUrl: v.imageUrl,
      videoUrl: v.videoUrl,
      selected: v.selected !== false,
      price: numOrNull(v.price),
      salePrice: numOrNull(v.salePrice),
      stock: numOrNull(v.stock),
      sku: v.sku?.trim() || undefined,
      weight: numOrNull(v.weight),
      weightUnit: v.weightUnit || undefined,
    };
  });
}

/** Cartesian product of selected option values → option maps */
export function generateVariantCombos(
  options: ProductOptionDefinition[],
): Array<Record<string, string>> {
  const active = options
    .map((opt) => ({
      name: opt.name,
      values: optionValuesList(opt.values).filter((v) => v.selected !== false && v.label.trim()),
    }))
    .filter((o) => o.values.length > 0);

  if (active.length === 0) return [];

  let combos: Array<Record<string, string>> = [{}];
  for (const opt of active) {
    const next: Array<Record<string, string>> = [];
    for (const c of combos) {
      for (const v of opt.values) {
        next.push({ ...c, [opt.name]: v.label });
      }
    }
    combos = next;
  }
  return combos;
}

export interface GeneratedVariantInput {
  options: ProductOptionDefinition[];
  previous: ProductVariation[];
  storeId: string;
  productId: string;
  baseSku: string;
  basePrice: number;
  /** MRP. Set only when it is higher than the selling price. */
  baseCompareAt?: number | null;
  baseWeight?: number | null;
  lowStockAlert?: number | null;
  /** Parent stock copied onto new combos. The product total stays the parent stock until a combo is edited. */
  sharedStock?: number | null;
}

/** Rebuild the variant matrix. A value price is an extra added to the product price. Matching combos keep stock, SKU, image, and visibility. */
export function buildGeneratedVariants(input: GeneratedVariantInput): ProductVariation[] {
  const active = input.options
    .map((opt) => ({
      name: String(opt.name || '').trim(),
      values: optionValuesList(opt.values).filter((v) => v.selected !== false && v.label.trim()),
    }))
    .filter((o) => o.name && o.values.length > 0);

  if (active.length === 0) return [];

  let combos: Array<{
    options: Record<string, string>;
    imageUrl: string | null;
    sellExtra: number;
    mrpExtra: number;
    stock: number | null;
    sku: string;
    weight: number | null;
    weightUnit: string | null;
  }> = [{ options: {}, imageUrl: null, sellExtra: 0, mrpExtra: 0, stock: null, sku: '', weight: null, weightUnit: null }];
  for (const opt of active) {
    const next: typeof combos = [];
    for (const c of combos) {
      for (const v of opt.values) {
        const sellBit = v.salePrice != null ? Number(v.salePrice) : v.price != null ? Number(v.price) : 0;
        const mrpBit = v.price != null ? Number(v.price) : v.salePrice != null ? Number(v.salePrice) : 0;
        next.push({
          options: { ...c.options, [opt.name]: v.label },
          imageUrl: v.imageUrl || c.imageUrl,
          sellExtra: c.sellExtra + (Number.isFinite(sellBit) ? sellBit : 0),
          mrpExtra: c.mrpExtra + (Number.isFinite(mrpBit) ? mrpBit : 0),
          stock: v.stock != null ? v.stock : c.stock,
          sku: v.sku || c.sku,
          weight: v.weight != null ? v.weight : c.weight,
          weightUnit: v.weightUnit || c.weightUnit,
        });
      }
    }
    combos = next;
  }

  const prevByFp = new Map<string, ProductVariation>();
  for (const row of input.previous) {
    const fp = optionsFingerprint(row.options || {});
    if (fp && !prevByFp.has(fp)) prevByFp.set(fp, row);
  }

  const prefix = (input.baseSku || 'SKU').trim() || 'SKU';
  return combos.map((combo, idx) => {
    const fp = optionsFingerprint(combo.options);
    const prev = prevByFp.get(fp);
    const abbrs = Object.values(combo.options).map((label) => {
      const clean = String(label).replace(/[^a-zA-Z0-9]/g, '');
      return (clean.slice(0, 4) || 'OPT').toUpperCase();
    });
    const hasExtra = combo.sellExtra !== 0 || combo.mrpExtra !== 0;
    const selling = hasExtra ? input.basePrice + combo.sellExtra : (prev?.price ?? input.basePrice);
    const mrpBase = input.baseCompareAt != null ? input.baseCompareAt : input.basePrice;
    const mrpSum = mrpBase + combo.mrpExtra;
    return {
      id: prev?.id || `var_${input.productId}_${idx}_${fp.slice(0, 12)}`,
      storeId: input.storeId,
      productId: input.productId,
      sku: (combo.sku || prev?.sku || `${prefix}-${abbrs.join('-')}-${idx + 1}`).slice(0, 80),
      barcode: prev?.barcode ?? null,
      options: combo.options,
      price: selling,
      compareAtPrice: mrpSum > selling ? mrpSum : (prev?.compareAtPrice ?? null),
      stock:
        combo.stock != null
          ? combo.stock
          : prev && !prev.unlimitedStock
            ? Number(prev.stock) || 0
            : input.sharedStock != null
              ? input.sharedStock
              : 0,
      weight: combo.weight != null ? combo.weight : (prev?.weight ?? input.baseWeight ?? null),
      weightUnit: combo.weightUnit || prev?.weightUnit || 'kg',
      lowStockAlert: prev?.lowStockAlert ?? input.lowStockAlert ?? null,
      unlimitedStock:
        combo.stock != null ? false : prev ? Boolean(prev.unlimitedStock) : input.sharedStock == null,
      imageUrl: combo.imageUrl || prev?.imageUrl || null,
      isActive: prev ? prev.isActive !== false : true,
    };
  });
}

export function variantPriceParts(v: {
  price?: number | null;
  compareAtPrice?: number | null;
}): { selling: number | null; mrp: number | null; discount: number; percent: number } {
  const selling = v.price == null || !Number.isFinite(Number(v.price)) ? null : Number(v.price);
  const mrpRaw = v.compareAtPrice == null || !Number.isFinite(Number(v.compareAtPrice)) ? null : Number(v.compareAtPrice);
  const mrp = mrpRaw != null && selling != null && mrpRaw > selling ? mrpRaw : null;
  const discount = mrp != null && selling != null ? Math.round((mrp - selling) * 100) / 100 : 0;
  const percent = mrp != null && mrp > 0 ? Math.round((discount / mrp) * 100) : 0;
  return { selling, mrp, discount, percent };
}

export function optionsFingerprint(options: Record<string, string>): string {
  return Object.keys(options)
    .sort()
    .map((k) => `${k.toLowerCase()}=${String(options[k] || '').trim().toLowerCase()}`)
    .join('|');
}

export function findMatchingVariant(
  variations: ProductVariation[] | undefined | null,
  selected: Record<string, string>,
): ProductVariation | null {
  if (!variations?.length) return null;
  const want = optionsFingerprint(selected);
  return variations.find((v) => optionsFingerprint(v.options || {}) === want) || null;
}

export function sumVariantStock(variations: ProductVariation[] | undefined | null): number {
  if (!variations?.length) return 0;
  return variations.reduce((sum, v) => {
    if (!v.isActive) return sum;
    if (v.unlimitedStock) return sum; // unlimited does not inflate a fake total
    return sum + Math.max(0, Number(v.stock) || 0);
  }, 0);
}

export function hasUnlimitedVariant(variations: ProductVariation[] | undefined | null): boolean {
  return Boolean(variations?.some((v) => v.isActive && v.unlimitedStock));
}

export function isVariantPurchasable(v: ProductVariation | null | undefined, qty = 1): boolean {
  if (!v || !v.isActive) return false;
  if (v.unlimitedStock) return true;
  return (Number(v.stock) || 0) >= qty;
}

export function isVariantLowStock(v: ProductVariation): boolean {
  if (v.unlimitedStock) return false;
  const threshold = v.lowStockAlert ?? 5;
  return (Number(v.stock) || 0) > 0 && (Number(v.stock) || 0) <= threshold;
}

export function findDuplicateSkus(variations: ProductVariation[]): string[] {
  const seen = new Map<string, number>();
  for (const v of variations) {
    const sku = String(v.sku || '')
      .trim()
      .toLowerCase();
    if (!sku) continue;
    seen.set(sku, (seen.get(sku) || 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([sku]) => sku);
}

export function findDuplicateBarcodes(variations: ProductVariation[]): string[] {
  const seen = new Map<string, number>();
  for (const v of variations) {
    const code = String(v.barcode || '')
      .trim()
      .toLowerCase();
    if (!code) continue;
    seen.set(code, (seen.get(code) || 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([c]) => c);
}

export function findDuplicateOptionCombos(variations: ProductVariation[]): string[] {
  const seen = new Map<string, number>();
  for (const v of variations) {
    const fp = optionsFingerprint(v.options || {});
    if (!fp) continue;
    seen.set(fp, (seen.get(fp) || 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([fp]) => fp);
}

/** Evaluate custom-field conditional visibility (AND / OR groups). */
export type ConditionalOp =
  | 'equals'
  | 'not_equals'
  | 'is_selected'
  | 'is_not_selected'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty';

export interface FieldCondition {
  fieldId: string;
  operator: ConditionalOp | string;
  value?: string;
}

export function evalFieldCondition(
  operator: string,
  actual: string | string[] | null | undefined,
  expected?: string,
): boolean {
  const a = Array.isArray(actual) ? actual.join(',') : String(actual ?? '');
  const e = String(expected ?? '');
  const aLow = a.toLowerCase();
  const eLow = e.toLowerCase();
  switch (operator) {
    case 'equals':
    case '=':
    case 'is_selected':
      return aLow === eLow || (Array.isArray(actual) && actual.map(String).includes(e));
    case 'not_equals':
    case '!=':
    case 'is_not_selected':
      return aLow !== eLow && !(Array.isArray(actual) && actual.map(String).includes(e));
    case 'contains':
      return aLow.includes(eLow);
    case 'not_contains':
      return !aLow.includes(eLow);
    case 'is_empty':
      return !a.trim();
    case 'is_not_empty':
      return Boolean(a.trim());
    default:
      return true;
  }
}

export function evalConditionGroup(
  conditions: FieldCondition[],
  join: 'AND' | 'OR',
  valuesByFieldId: Record<string, string | string[] | null | undefined>,
): boolean {
  if (!conditions.length) return true;
  const results = conditions.map((c) =>
    evalFieldCondition(c.operator, valuesByFieldId[c.fieldId], c.value),
  );
  return join === 'OR' ? results.some(Boolean) : results.every(Boolean);
}
