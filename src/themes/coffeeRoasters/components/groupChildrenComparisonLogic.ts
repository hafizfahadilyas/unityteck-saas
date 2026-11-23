/** Pure helpers for HiBrew grouped-parent child comparison — node-test safe. */

import type { Product } from '../types';
import { effectiveProductPricing } from '../../../utils/productSaleSchedule';

export type GroupCompareChild = Product;

export type GroupCompareSpecRow = {
  key: string;
  labelEn: string;
  labelAr: string;
  values: Record<string, string>;
  /** When true, UI can emphasize differing cells. */
  emphasizeDiff?: boolean;
};

export function formatCompareSar(isAr: boolean, amount: number): string {
  const n = amount.toLocaleString(isAr ? 'ar-SA' : 'en-US');
  return isAr ? `${n} ⃁` : `⃁ ${n}`;
}

/**
 * Prefer theme `basePrice` (already the selling amount from mapApiChild).
 * Fall back to effectiveProductPricing for raw API-shaped rows.
 */
export function childComparePricing(child: GroupCompareChild): {
  price: number;
  compareAt: number | null;
} {
  const base = Number(child.basePrice);
  if (Number.isFinite(base) && base > 0) {
    const original = Number(child.originalPrice) || 0;
    return {
      price: base,
      compareAt: original > base ? original : null,
    };
  }
  return effectiveProductPricing({
    price: Number(child.price) || 0,
    discountedPrice: child.discountedPrice,
    originalPrice: child.originalPrice,
    discountStartAt: child.discountStartAt,
    discountEndAt: child.discountEndAt,
  });
}

function trimText(value: unknown, max = 160): string {
  const t = String(value || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function optionSummary(child: GroupCompareChild, isAr: boolean): string {
  const opts = Array.isArray(child.productOptions) ? child.productOptions : [];
  const parts: string[] = [];
  for (const opt of opts) {
    if (!opt || opt.visible === false) continue;
    const name = String(opt.name || '').trim();
    if (!name) continue;
    const values = Array.isArray(opt.values) ? opt.values : [];
    const labels = values
      .map((v) => {
        if (typeof v === 'string') return v.trim();
        if (!v || typeof v !== 'object') return '';
        const row = v as { label?: string; labelAr?: string; selected?: boolean };
        if (row.selected === false) return '';
        return (isAr ? row.labelAr || row.label : row.label || row.labelAr || '').trim();
      })
      .filter(Boolean);
    if (!labels.length) {
      parts.push(name);
      continue;
    }
    parts.push(`${name}: ${labels.slice(0, 4).join(isAr ? '، ' : ', ')}${labels.length > 4 ? '…' : ''}`);
  }
  return parts.join(isAr ? ' · ' : ' · ');
}

function pushRowIfAny(
  rows: GroupCompareSpecRow[],
  kids: GroupCompareChild[],
  row: Omit<GroupCompareSpecRow, 'values'> & { values: Record<string, string> },
): void {
  const hasContent = kids.some((c) => {
    const v = (row.values[c.id] || '').trim();
    return v && v !== '—';
  });
  if (!hasContent) return;
  for (const child of kids) {
    if (!(row.values[child.id] || '').trim()) row.values[child.id] = '—';
  }
  const unique = new Set(kids.map((c) => (row.values[c.id] || '').trim()));
  rows.push({
    ...row,
    emphasizeDiff: unique.size > 1,
  });
}

/** Build comparison rows from real child fields + union of catalog specs (no fake values). */
export function buildGroupCompareRows(
  kids: GroupCompareChild[],
  isAr: boolean,
): GroupCompareSpecRow[] {
  if (!kids.length) return [];

  const rows: GroupCompareSpecRow[] = [];

  const priceValues: Record<string, string> = {};
  const saveValues: Record<string, string> = {};
  const stockValues: Record<string, string> = {};
  const skuValues: Record<string, string> = {};
  const brandValues: Record<string, string> = {};
  const categoryValues: Record<string, string> = {};
  const badgeValues: Record<string, string> = {};
  const ratingValues: Record<string, string> = {};
  const taglineValues: Record<string, string> = {};
  const overviewValues: Record<string, string> = {};
  const optionsValues: Record<string, string> = {};

  for (const child of kids) {
    const pricing = childComparePricing(child);
    priceValues[child.id] = formatCompareSar(isAr, pricing.price);

    if (pricing.compareAt != null && pricing.compareAt > pricing.price) {
      const save = pricing.compareAt - pricing.price;
      saveValues[child.id] = isAr
        ? `وفر ${formatCompareSar(true, save)}`
        : `Save ${formatCompareSar(false, save)}`;
    } else {
      saveValues[child.id] = '—';
    }

    if (typeof child.stock === 'number') {
      stockValues[child.id] =
        child.stock > 0
          ? isAr
            ? `${child.stock.toLocaleString('ar-SA')} متوفر`
            : `${child.stock.toLocaleString('en-US')} in stock`
          : isAr
            ? 'غير متوفر'
            : 'Out of stock';
    } else {
      stockValues[child.id] = '—';
    }

    skuValues[child.id] = (child.sku || '').trim() || '—';
    brandValues[child.id] = (child.brand || '').trim() || '—';

    const cat = isAr
      ? String(child.categoryAr || child.category || '').trim()
      : String(child.category || child.categoryAr || '').trim();
    categoryValues[child.id] = cat || '—';

    const badge = isAr
      ? String(child.badgeAr || child.badge || '').trim()
      : String(child.badge || child.badgeAr || '').trim();
    badgeValues[child.id] = badge || '—';

    const rating = Number(child.rating) || 0;
    const reviews = Number(child.reviewCount) || 0;
    if (rating > 0 || reviews > 0) {
      ratingValues[child.id] = isAr
        ? `${rating.toFixed(1)} من 5${reviews ? ` · ${reviews.toLocaleString('ar-SA')} تقييم` : ''}`
        : `${rating.toFixed(1)} / 5${reviews ? ` · ${reviews.toLocaleString('en-US')} reviews` : ''}`;
    } else {
      ratingValues[child.id] = '—';
    }

    const tagline = isAr
      ? trimText(child.taglineAr || child.tagline, 120)
      : trimText(child.tagline || child.taglineAr, 120);
    taglineValues[child.id] = tagline || '—';

    const overview = isAr
      ? trimText(child.overviewAr || child.overview, 180)
      : trimText(child.overview || child.overviewAr, 180);
    overviewValues[child.id] = overview || '—';

    optionsValues[child.id] = optionSummary(child, isAr) || '—';
  }

  pushRowIfAny(rows, kids, {
    key: 'price',
    labelEn: 'Price',
    labelAr: 'السعر',
    values: priceValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'save',
    labelEn: 'You save',
    labelAr: 'التوفير',
    values: saveValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'stock',
    labelEn: 'Availability',
    labelAr: 'التوفر',
    values: stockValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'sku',
    labelEn: 'Product code',
    labelAr: 'رمز المنتج',
    values: skuValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'brand',
    labelEn: 'Brand',
    labelAr: 'العلامة',
    values: brandValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'category',
    labelEn: 'Category',
    labelAr: 'التصنيف',
    values: categoryValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'badge',
    labelEn: 'Badge',
    labelAr: 'الشارة',
    values: badgeValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'rating',
    labelEn: 'Rating',
    labelAr: 'التقييم',
    values: ratingValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'tagline',
    labelEn: 'Tagline',
    labelAr: 'الوصف المختصر',
    values: taglineValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'overview',
    labelEn: 'Details',
    labelAr: 'التفاصيل',
    values: overviewValues,
  });
  pushRowIfAny(rows, kids, {
    key: 'options',
    labelEn: 'Purchase options',
    labelAr: 'خيارات الشراء',
    values: optionsValues,
  });

  const labelOrder: string[] = [];
  const labelMeta = new Map<string, { labelEn: string; labelAr: string }>();
  const cellMap = new Map<string, Record<string, string>>();

  for (const child of kids) {
    const specs = Array.isArray(child.specs) ? child.specs : [];
    for (const spec of specs) {
      if (!spec) continue;
      const labelEn = String(spec.label || '').trim();
      const labelAr = String(spec.labelAr || spec.label || '').trim();
      const canon = (labelEn || labelAr).toLowerCase();
      if (!canon) continue;
      if (!labelMeta.has(canon)) {
        labelOrder.push(canon);
        labelMeta.set(canon, {
          labelEn: labelEn || labelAr,
          labelAr: labelAr || labelEn,
        });
        cellMap.set(canon, {});
      }
      const valueEn = String(spec.value || '').trim();
      const valueAr = String(spec.valueAr || spec.value || '').trim();
      const cell = cellMap.get(canon)!;
      cell[child.id] = (isAr ? valueAr || valueEn : valueEn || valueAr) || '—';
    }
  }

  for (const canon of labelOrder) {
    const meta = labelMeta.get(canon)!;
    const values = cellMap.get(canon) || {};
    pushRowIfAny(rows, kids, {
      key: `spec:${canon}`,
      labelEn: meta.labelEn,
      labelAr: meta.labelAr,
      values,
    });
  }

  return rows;
}

export function rowValuesDiffer(row: GroupCompareSpecRow, childIds: string[]): boolean {
  if (row.emphasizeDiff != null) return row.emphasizeDiff;
  const unique = new Set(childIds.map((id) => (row.values[id] || '').trim()));
  return unique.size > 1;
}
