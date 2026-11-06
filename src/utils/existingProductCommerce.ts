/**
 * Load the options, values, and spec fields a product already has.
 * Saved rows win. Empty rows are filled from real variation maps, then from
 * the coffee catalog that the storefront already sells. Nothing is invented.
 */
import type { Product, ProductCustomField, ProductOptionDefinition, ProductVariation } from '../types';
import { PRODUCTS } from '../themes/coffeeRoasters/data/products';

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

function optionsFromVariations(variations: ProductVariation[]): ProductOptionDefinition[] {
  const grouped = new Map<string, string[]>();
  for (const row of variations) {
    for (const [key, value] of Object.entries(row.options || {})) {
      const label = String(value || '').trim();
      if (!key || !label) continue;
      const list = grouped.get(key) || [];
      if (!list.some((item) => item.toLowerCase() === label.toLowerCase())) list.push(label);
      grouped.set(key, list);
    }
  }
  const options: ProductOptionDefinition[] = [];
  for (const [key, labels] of grouped) {
    const lower = key.toLowerCase();
    options.push({
      id: slug(key),
      name: key,
      nameAr: OPTION_NAME_AR[lower],
      type: lower.includes('color') || key.includes('لون') ? 'color' : 'select',
      visible: true,
      values: labels.map((label) => ({
        id: slug(label),
        label,
        selected: true,
      })),
    });
  }
  return options;
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
  const used = new Set<string>();
  const options: ProductOptionDefinition[] = [];
  for (const opt of product.productOptions) {
    const name = String(opt?.name || '').trim();
    if (!name || used.has(name.toLowerCase())) continue;
    const values = dedupeByLabel(
      (Array.isArray(opt.values) ? opt.values : []).map((value, index) => {
        if (typeof value === 'string') return { id: slug(value), label: value, selected: true };
        return {
          id: value.id || slug(value.label) || `v_${index}`,
          label: value.label,
          labelAr: value.labelAr,
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
    used.add(name.toLowerCase());
    options.push({
      id: opt.id || slug(name),
      name,
      nameAr: opt.nameAr,
      type: opt.type,
      visible: opt.visible !== false,
      values,
    });
  }
  return options;
}

export function seedExistingCommerce(product: Product, storeId: string): {
  options: ProductOptionDefinition[];
  fields: ProductCustomField[];
  variations: ProductVariation[];
} {
  const saved = savedOptions(product);
  const catalog = optionsFromCatalog(product, storeId);
  const fromRows = optionsFromVariations(product.variations || []);
  const options = saved.length > 0 ? saved : fromRows.length > 0 ? fromRows : catalog.options;
  const fields =
    Array.isArray(product.customFields) && product.customFields.length > 0
      ? product.customFields
      : catalog.fields;
  const variations = Array.isArray(product.variations) ? product.variations : [];
  return { options, fields, variations };
}
