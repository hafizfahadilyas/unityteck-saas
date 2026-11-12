/**
 * Product options → variants helpers (extend existing catalog — no duplicate systems).
 */
import type { ProductOptionDefinition, ProductVariation } from '../types';
import { collapseOptionMap } from './localeLabel';

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

/** Short SKU token from an option label (Latin + Arabic digits/letters). */
function skuToken(label: string, fallback: string): string {
  const raw = String(label || '').trim();
  const latin = raw.replace(/[^a-zA-Z0-9]/g, '');
  if (latin.length > 0) return latin.slice(0, 4).toUpperCase();
  // Keep Arabic / unicode letters so AR option values stay distinguishable.
  const uni = [...raw.replace(/\s+/g, '')]
    .filter((ch) => /[\u0600-\u06FFa-zA-Z0-9]/u.test(ch))
    .slice(0, 3)
    .join('');
  return uni || fallback;
}

/** Drop duplicate labels inside one option (case-insensitive) so the matrix cannot emit twin combos. */
function uniqueSelectedValues(
  values: ReturnType<typeof optionValuesList>,
): ReturnType<typeof optionValuesList> {
  const seen = new Set<string>();
  const out: ReturnType<typeof optionValuesList> = [];
  for (const v of values) {
    if (v.selected === false) continue;
    const label = String(v.label || '').trim();
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Cartesian product of selected option values → option maps */
export function generateVariantCombos(
  options: ProductOptionDefinition[],
): Array<Record<string, string>> {
  const active = options
    .map((opt) => ({
      name: opt.name,
      values: uniqueSelectedValues(optionValuesList(opt.values)),
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

/** Make variant SKUs unique within the product (suffix -2, -3…). */
export function ensureUniqueVariantSkus(variations: ProductVariation[]): ProductVariation[] {
  const used = new Set<string>();
  let changed = false;
  const next = variations.map((row, idx) => {
    let sku = String(row.sku || '').trim();
    if (!sku) {
      sku = `VAR-${idx + 1}`;
      changed = true;
    }
    const base = sku.slice(0, 70);
    let candidate = sku.slice(0, 80);
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      candidate = `${base}-${n++}`.slice(0, 80);
      changed = true;
    }
    used.add(candidate.toLowerCase());
    return candidate === row.sku ? row : { ...row, sku: candidate };
  });
  return changed ? next : variations;
}

/** Keep the first barcode; clear later duplicates (barcode must stay unique per store). */
export function ensureUniqueVariantBarcodes(variations: ProductVariation[]): ProductVariation[] {
  const used = new Set<string>();
  let changed = false;
  const next = variations.map((row) => {
    const code = String(row.barcode || '').trim();
    if (!code) return row;
    const key = code.toLowerCase();
    if (used.has(key)) {
      changed = true;
      return { ...row, barcode: null };
    }
    used.add(key);
    return row;
  });
  return changed ? next : variations;
}

/** Keep the first row per option fingerprint; drop later twins. */
export function dedupeVariationsByOptionCombo(variations: ProductVariation[]): ProductVariation[] {
  const seen = new Set<string>();
  const out: ProductVariation[] = [];
  let dropped = false;
  for (const row of variations) {
    const fp = optionsFingerprint(row.options || {});
    if (fp) {
      if (seen.has(fp)) {
        dropped = true;
        continue;
      }
      seen.add(fp);
    }
    out.push(row);
  }
  return dropped ? out : variations;
}

/** Heal SKU / barcode / twin-option collisions so a valid matrix can save. */
export function normalizeVariantUniqueness(variations: ProductVariation[]): ProductVariation[] {
  return ensureUniqueVariantSkus(
    ensureUniqueVariantBarcodes(dedupeVariationsByOptionCombo(variations)),
  );
}

/** Rebuild the variant matrix. A value price is an extra added to the product price. Matching combos keep stock, SKU, image, and visibility. */
export function buildGeneratedVariants(input: GeneratedVariantInput): ProductVariation[] {
  const active = input.options
    .map((opt) => ({
      name: String(opt.name || '').trim(),
      values: uniqueSelectedValues(optionValuesList(opt.values)),
    }))
    .filter((o) => o.name && o.values.length > 0);

  if (active.length === 0) return [];

  let combos: Array<{
    options: Record<string, string>;
    imageUrl: string | null;
    sellExtra: number;
    mrpExtra: number;
    stock: number | null;
    skuParts: string[];
    weight: number | null;
    weightUnit: string | null;
  }> = [
    {
      options: {},
      imageUrl: null,
      sellExtra: 0,
      mrpExtra: 0,
      stock: null,
      skuParts: [],
      weight: null,
      weightUnit: null,
    },
  ];
  for (const opt of active) {
    const next: typeof combos = [];
    for (const c of combos) {
      for (const v of opt.values) {
        const sellBit = v.salePrice != null ? Number(v.salePrice) : v.price != null ? Number(v.price) : 0;
        const mrpBit = v.price != null ? Number(v.price) : v.salePrice != null ? Number(v.salePrice) : 0;
        const part = String(v.sku || '').trim();
        next.push({
          options: { ...c.options, [opt.name]: v.label },
          imageUrl: v.imageUrl || c.imageUrl,
          sellExtra: c.sellExtra + (Number.isFinite(sellBit) ? sellBit : 0),
          mrpExtra: c.mrpExtra + (Number.isFinite(mrpBit) ? mrpBit : 0),
          stock: v.stock != null ? v.stock : c.stock,
          // Collect per-value SKU pieces — never reuse one value SKU alone across Size×Color.
          skuParts: part ? [...c.skuParts, part] : c.skuParts,
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
  const rows = combos.map((combo, idx) => {
    const optionMap = collapseOptionMap(combo.options);
    const fp = optionsFingerprint(optionMap);
    const prev = prevByFp.get(fp);
    const abbrs = Object.values(optionMap).map((label, i) => skuToken(label, `O${i + 1}`));
    const fromParts = combo.skuParts.length > 0 ? combo.skuParts.join('-') : '';
    // Prefer a previous unique SKU only when it is not the bare product SKU shared by every row.
    const prevSku = String(prev?.sku || '').trim();
    const prevLooksShared = !prevSku || prevSku.toLowerCase() === prefix.toLowerCase();
    const autoSku = `${prefix}-${abbrs.join('-')}-${idx + 1}`;
    const candidate = fromParts || (!prevLooksShared ? prevSku : '') || autoSku;
    const hasExtra = combo.sellExtra !== 0 || combo.mrpExtra !== 0;
    const selling = hasExtra ? input.basePrice + combo.sellExtra : (prev?.price ?? input.basePrice);
    const mrpBase = input.baseCompareAt != null ? input.baseCompareAt : input.basePrice;
    const mrpSum = mrpBase + combo.mrpExtra;
    return {
      id: prev?.id || `var_${input.productId}_${idx}_${fp.slice(0, 12)}`,
      storeId: input.storeId,
      productId: input.productId,
      sku: candidate.slice(0, 80),
      barcode: prev?.barcode ?? null,
      options: optionMap,
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

  return normalizeVariantUniqueness(rows);
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
  const collapsed = collapseOptionMap(options || {});
  return Object.keys(collapsed)
    .sort()
    .map((k) => `${k.toLowerCase()}=${String(collapsed[k] || '').trim().toLowerCase()}`)
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

/**
 * True when at least one active variant can still match if this option value is chosen
 * (given the rest of the current selection). Used to disable impossible / OOS choices.
 */
export function isOptionValueAvailable(
  variations: ProductVariation[] | undefined | null,
  selected: Record<string, string>,
  optionName: string,
  value: string,
  qty = 1,
): boolean {
  if (!variations?.length) return true;
  const probe = { ...selected, [optionName]: value };
  const active = variations.filter((v) => v.isActive !== false);
  if (active.length === 0) return false;

  const matches = active.filter((v) => {
    const opts = v.options || {};
    return Object.entries(probe).every(([k, val]) => {
      if (val == null || String(val).trim() === '') return true;
      const have = opts[k];
      if (have == null || have === '') return true;
      return String(have).trim().toLowerCase() === String(val).trim().toLowerCase();
    });
  });
  if (matches.length === 0) return false;
  return matches.some((v) => isVariantPurchasable(v, qty));
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

/** Human-readable option summary from a variant options map. */
export function variationOptionsLabel(
  options: Record<string, string> | undefined | null,
  isAr = false,
): string {
  if (!options) return '';
  const keyLabel = (k: string) => {
    if (!isAr) return k;
    const map: Record<string, string> = {
      size: 'المقاس',
      color: 'اللون',
      weight: 'الوزن',
      material: 'المادة',
      custom: 'مخصص',
    };
    return map[k.toLowerCase()] || k;
  };
  return Object.entries(options)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${keyLabel(k)}: ${v}`)
    .join(' · ');
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
