/**
 * Load the options, values, and spec fields a product already has.
 * Saved rows win. Empty rows are filled from real variation maps, then from
 * the coffee catalog that the storefront already sells. Nothing is invented.
 * Missing Arabic labels are enriched from catalog / known bilingual map (locale rule).
 */
import type { Product, ProductCustomField, ProductOptionDefinition, ProductOptionValueItem, ProductVariation } from '../types';
import { PRODUCTS } from '../themes/coffeeRoasters/data/products';
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

function extraOrNull(n: number | undefined): number | null {
  if (n == null || !Number.isFinite(n) || n === 0) return null;
  return n;
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

function optionsFromCatalog(product: Product, storeId: string): {
  options: ProductOptionDefinition[];
  fields: ProductCustomField[];
} {
  if (storeId !== 'store-coffee') return { options: [], fields: [] };
  const match = PRODUCTS.find(
    (row) => row.id === product.id || row.id.toLowerCase() === String(product.sku || '').toLowerCase(),
  );
  if (!match) return { options: [], fields: [] };

  const options: ProductOptionDefinition[] = [];
  const colors = dedupeByLabel(
    (match.colors || []).map((color) => ({
      id: slug(color.name),
      label: color.name,
      labelAr: color.nameAr,
      colorHex: color.hex,
      imageUrl: color.image,
      selected: true,
      price: extraOrNull(color.priceDelta),
      salePrice: extraOrNull(color.priceDelta),
    })),
  );
  if (colors.length > 0) {
    options.push({
      id: 'color',
      name: 'Color',
      nameAr: 'اللون',
      type: 'color',
      visible: true,
      values: colors,
    });
  }

  const editions = dedupeByLabel(
    (match.storageOptions || []).map((row) => ({
      id: slug(row.capacity),
      label: row.capacity,
      labelAr: row.capacityAr,
      selected: true,
      price: extraOrNull(row.priceDelta),
      salePrice: extraOrNull(row.priceDelta),
    })),
  );
  if (editions.length > 0) {
    options.push({
      id: 'edition',
      name: 'Edition',
      nameAr: 'الإصدار',
      type: 'select',
      visible: true,
      values: editions,
    });
  }

  const fields: ProductCustomField[] = [];
  const seenFields = new Set<string>();
  for (const spec of match.specs || []) {
    const name = String(spec.label || '').trim();
    const key = name.toLowerCase();
    if (!name || seenFields.has(key)) continue;
    seenFields.add(key);
    fields.push({
      id: `catalog-spec-${slug(name)}`,
      name,
      nameAr: spec.labelAr,
      type: 'Content',
      required: false,
      contentEn: spec.value,
      contentAr: spec.valueAr || spec.value,
      extraPrice: 0,
      options: [],
    });
  }
  return { options, fields };
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
  const catalog = optionsFromCatalog(product, storeId);
  const saved = savedOptions(product);
  const fromRows = optionsFromVariations(product.variations || []);
  const base = saved.length > 0 ? saved : fromRows.length > 0 ? fromRows : catalog.options;
  const options = mergeBilingualProductOptions(enrichOptionsAr(base, catalog.options));
  const fields =
    Array.isArray(product.customFields) && product.customFields.length > 0
      ? product.customFields
      : catalog.fields;
  const variations = normalizeCommerceVariations(
    Array.isArray(product.variations) ? product.variations : [],
  );
  return { options, fields, variations };
}
