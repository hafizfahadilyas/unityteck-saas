/**
 * Load the options, values, and spec fields a product already has.
 * Saved productOptions win. Else rebuild from real variation rows.
 * Never borrow another store’s / static coffee catalog pack (full store isolation).
 * Missing Arabic labels are enriched from known bilingual map (locale rule).
 */
import type { Product, ProductCustomField, ProductOptionDefinition, ProductOptionValueItem, ProductVariation } from '../types';
import {
  arabicOptionNameFor,
  canonicalOptionName,
  collapseOptionMap,
  hasArabicScript,
  isArabicOptionNameTwin,
  resolveOptionNameAr,
  resolveOptionValueAr,
} from './localeLabel';

function slug(raw: string): string {
  const s = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return s || 'value';
}

function dedupeByLabel<T extends { label: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = row.label.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

const OPTION_NAME_AR: Record<string, string> = {
  color: 'اللون',
  size: 'المقاس',
  material: 'الخامة',
  edition: 'الإصدار',
};

function enrichValueAr(
  value: ProductOptionValueItem,
  catalogByLabel: Map<string, string>,
): ProductOptionValueItem {
  const label = String(value.label || '').trim();
  const fromCatalog = catalogByLabel.get(label.toLowerCase());
  const labelAr = resolveOptionValueAr(label, value.labelAr || fromCatalog);
  return { ...value, labelAr: labelAr || value.labelAr };
}

function catalogLabelArMap(catalog: ProductOptionDefinition[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const opt of catalog) {
    const vals = Array.isArray(opt.values) ? opt.values : [];
    for (const raw of vals) {
      if (typeof raw === 'string') continue;
      const label = String(raw.label || '').trim().toLowerCase();
      const ar = String(raw.labelAr || '').trim();
      if (label && ar) map.set(label, ar);
    }
  }
  return map;
}

function enrichOptionsAr(
  options: ProductOptionDefinition[],
  catalog: ProductOptionDefinition[],
): ProductOptionDefinition[] {
  const byLabel = catalogLabelArMap(catalog);
  return options.map((opt) => {
    const nameAr = resolveOptionNameAr(opt.name, opt.nameAr) || OPTION_NAME_AR[String(opt.name || '').toLowerCase()];
    const values = (Array.isArray(opt.values) ? opt.values : []).map((raw) => {
      if (typeof raw === 'string') {
        return enrichValueAr({ id: slug(raw), label: raw, selected: true }, byLabel);
      }
      return enrichValueAr(raw, byLabel);
    });
    return { ...opt, nameAr: opt.nameAr || nameAr, values };
  });
}

type ValuePair = { label: string; labelAr?: string };

function optionsFromVariations(variations: ProductVariation[]): ProductOptionDefinition[] {
  /** canonical EN name → ordered value pairs */
  const grouped = new Map<string, ValuePair[]>();
  for (const row of variations) {
    const collapsed = collapseOptionMap(row.options || {});
    const raw = row.options || {};
    for (const [canon, enLabel] of Object.entries(collapsed)) {
      const arTwin = arabicOptionNameFor(canon);
      const arLabel = arTwin ? String(raw[arTwin] || '').trim() : '';
      const list = grouped.get(canon) || [];
      const exists = list.some(
        (item) => item.label.toLowerCase() === enLabel.toLowerCase() || (arLabel && item.labelAr === arLabel),
      );
      if (!exists) {
        list.push({
          label: enLabel,
          labelAr: arLabel || resolveOptionValueAr(enLabel),
        });
      } else {
        const hit = list.find((item) => item.label.toLowerCase() === enLabel.toLowerCase());
        if (hit && arLabel && !hit.labelAr) hit.labelAr = arLabel;
      }
      grouped.set(canon, list);
    }
  }
  const options: ProductOptionDefinition[] = [];
  for (const [key, pairs] of grouped) {
    const lower = key.toLowerCase();
    options.push({
      id: slug(key),
      name: key,
      nameAr: OPTION_NAME_AR[lower] || resolveOptionNameAr(key) || arabicOptionNameFor(key),
      type: lower.includes('color') || key.includes('لون') ? 'color' : 'select',
      visible: true,
      values: pairs.map((pair) => ({
        id: slug(pair.label),
        label: pair.label,
        labelAr: pair.labelAr || resolveOptionValueAr(pair.label),
        selected: true,
      })),
    });
  }
  return options;
}

/** Merge Color + اللون (and other twins) into one bilingual option row. */
export function mergeBilingualProductOptions(
  options: ProductOptionDefinition[],
): ProductOptionDefinition[] {
  const buckets = new Map<string, ProductOptionDefinition[]>();
  for (const opt of options) {
    const name = String(opt?.name || '').trim();
    if (!name) continue;
    const canon = canonicalOptionName(name).toLowerCase();
    const list = buckets.get(canon) || [];
    list.push(opt);
    buckets.set(canon, list);
  }
  const out: ProductOptionDefinition[] = [];
  for (const [, group] of buckets) {
    const enRow =
      group.find((o) => !isArabicOptionNameTwin(o.name) && !hasArabicScript(o.name)) || group[0];
    const arRow = group.find((o) => isArabicOptionNameTwin(o.name) || (o !== enRow && hasArabicScript(o.name)));
    const canonName = canonicalOptionName(enRow.name) || String(enRow.name || '').trim();
    const nameAr =
      resolveOptionNameAr(canonName, enRow.nameAr || arRow?.nameAr || arRow?.name) ||
      arabicOptionNameFor(canonName);
    const enVals = Array.isArray(enRow.values) ? enRow.values : [];
    const arVals = arRow && arRow !== enRow && Array.isArray(arRow.values) ? arRow.values : [];
    const mergedVals: ProductOptionValueItem[] = [];
    const seen = new Set<string>();
    const pushVal = (raw: ProductOptionValueItem | string, arHint?: string) => {
      const base =
        typeof raw === 'string'
          ? ({ id: slug(raw), label: raw, selected: true } as ProductOptionValueItem)
          : raw;
      const label = String(base.label || '').trim();
      if (!label) return;
      const key = label.toLowerCase();
      if (seen.has(key)) {
        const hit = mergedVals.find((v) => v.label.toLowerCase() === key);
        if (hit && !hit.labelAr && (arHint || base.labelAr)) {
          hit.labelAr = resolveOptionValueAr(label, arHint || base.labelAr);
        }
        return;
      }
      seen.add(key);
      mergedVals.push({
        ...base,
        id: base.id || slug(label),
        label,
        labelAr: resolveOptionValueAr(label, arHint || base.labelAr),
        selected: base.selected !== false,
      });
    };
    enVals.forEach((v, i) => {
      const twin =
        typeof arVals[i] === 'string'
          ? String(arVals[i])
          : arVals[i] && typeof arVals[i] !== 'string'
            ? String((arVals[i] as ProductOptionValueItem).label || '')
            : undefined;
      pushVal(v, twin);
    });
    arVals.forEach((v) => {
      if (typeof v === 'string') {
        const enFromKnown = resolveOptionValueAr(v) === v ? undefined : undefined;
        // Arabic-only row: keep label as Arabic only when no EN twin matched.
        if (!mergedVals.some((m) => m.labelAr === v || m.label === v)) {
          pushVal({ id: slug(v), label: v, labelAr: v, selected: true });
        }
        void enFromKnown;
      } else {
        const lab = String(v.label || '').trim();
        if (!mergedVals.some((m) => m.labelAr === lab || m.label === lab)) {
          pushVal({ ...v, label: lab, labelAr: lab });
        }
      }
    });
    if (mergedVals.length === 0) continue;
    out.push({
      ...enRow,
      id: enRow.id || slug(canonName),
      name: canonName,
      nameAr,
      type:
        enRow.type ||
        arRow?.type ||
        (canonName.toLowerCase().includes('color') ? 'color' : 'select'),
      visible: enRow.visible !== false && (arRow ? arRow.visible !== false : true),
      values: mergedVals,
    });
  }
  return out;
}

/** No static coffee pack follow — commerce comes only from this product’s saved rows. */
function optionsFromCatalog(_product: Product, _storeId: string): {
  options: ProductOptionDefinition[];
  fields: ProductCustomField[];
} {
  return { options: [], fields: [] };
}

/** Rebuild option definitions from variation option maps (Color Black/Silver → Color option). */
export function optionsFromVariationRows(
  variations: ProductVariation[] | null | undefined,
): ProductOptionDefinition[] {
  return mergeBilingualProductOptions(optionsFromVariations(variations || []));
}

function savedOptions(product: Product): ProductOptionDefinition[] {
  if (!Array.isArray(product.productOptions)) return [];
  const options: ProductOptionDefinition[] = [];
  for (const opt of product.productOptions) {
    const name = String(opt?.name || '').trim();
    if (!name) continue;
    const values = dedupeByLabel(
      (Array.isArray(opt.values) ? opt.values : []).map((value, index) => {
        if (typeof value === 'string') {
          return {
            id: slug(value),
            label: value,
            labelAr: resolveOptionValueAr(value),
            selected: true,
          };
        }
        return {
          id: value.id || slug(value.label) || `v_${index}`,
          label: value.label,
          labelAr: resolveOptionValueAr(value.label, value.labelAr),
          colorHex: value.colorHex,
          imageUrl: value.imageUrl,
          videoUrl: value.videoUrl,
          selected: value.selected !== false,
          price: value.price ?? null,
          salePrice: value.salePrice ?? null,
          stock: value.stock ?? null,
          sku: value.sku,
          weight: value.weight ?? null,
          weightUnit: value.weightUnit,
        };
      }),
    );
    if (values.length === 0) continue;
    const canon = canonicalOptionName(name);
    options.push({
      id: opt.id || slug(canon || name),
      name: isArabicOptionNameTwin(name) ? canon : name,
      nameAr: resolveOptionNameAr(canon || name, opt.nameAr || (isArabicOptionNameTwin(name) ? name : undefined)),
      type: opt.type,
      visible: opt.visible !== false,
      values,
    });
  }
  return mergeBilingualProductOptions(options);
}

export function normalizeCommerceVariations(variations: ProductVariation[]): ProductVariation[] {
  return (variations || []).map((row) => ({
    ...row,
    options: collapseOptionMap(row.options || {}),
  }));
}

export function seedExistingCommerce(product: Product, storeId: string): {
  options: ProductOptionDefinition[];
  fields: ProductCustomField[];
  variations: ProductVariation[];
} {
  void storeId;
  const catalog = optionsFromCatalog(product, storeId);
  const saved = savedOptions(product);
  const fromRows = optionsFromVariationRows(product.variations || []);
  // Saved options first; else auto-show every option found on real variation rows.
  const base = saved.length > 0 ? saved : fromRows;
  const options = mergeBilingualProductOptions(enrichOptionsAr(base, catalog.options));
  const fields =
    Array.isArray(product.customFields) && product.customFields.length > 0
      ? product.customFields
      : [];
  const variations = normalizeCommerceVariations(
    Array.isArray(product.variations) ? product.variations : [],
  );
  return { options, fields, variations };
}
