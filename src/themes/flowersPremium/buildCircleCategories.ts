import type { Product } from '../../types';
import type { CircleCategory } from './pack';

export type StorefrontCategoryRow = {
  id: string;
  name?: string;
  name_ar?: string | null;
  slug?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
};

/**
 * Build circle category chips from live storefront categories + product images.
 * Never invent Unsplash / demo filters — empty store → All only (or empty list).
 */
export function buildCircleCategories(
  rows: StorefrontCategoryRow[],
  products: Product[],
  opts?: { includeAll?: boolean; isAr?: boolean },
): CircleCategory[] {
  const includeAll = opts?.includeAll !== false;
  const isAr = opts?.isAr === true;

  const imageByCategoryName = new Map<string, string>();
  for (const p of products) {
    const names = [
      p.category,
      ...(Array.isArray(p.categories) ? p.categories : []),
    ].filter((n): n is string => Boolean(n && String(n).trim()));
    const img = String(p.image || '').trim();
    if (!img) continue;
    for (const name of names) {
      if (!imageByCategoryName.has(name)) imageByCategoryName.set(name, img);
    }
  }

  const out: CircleCategory[] = [];
  if (includeAll) {
    const firstImg =
      products.find((p) => p.image)?.image ||
      rows.find((r) => r.image_url)?.image_url ||
      '';
    out.push({
      id: 'all',
      nameEn: 'All',
      nameAr: 'الكل',
      image: firstImg || '',
      filter: 'All',
    });
  }

  const productNameSet = new Set(
    Array.from(imageByCategoryName.keys()).map((n) => n.toLowerCase()),
  );

  const seen = new Set<string>();
  for (const row of rows) {
    const nameEn = String(row.name || '').trim();
    if (!nameEn) continue;
    const key = nameEn.toLowerCase();
    if (seen.has(key)) continue;
    // Prefer categories that currently have products; still allow imaged taxonomy roots
    const hasProducts = productNameSet.has(key);
    const image =
      String(row.image_url || '').trim() ||
      imageByCategoryName.get(nameEn) ||
      '';
    if (!hasProducts && !image) continue;
    // Skip pure parent groups with no matching product category name when children exist
    if (!hasProducts && row.parent_id == null) {
      const hasChildWithProducts = rows.some((child) => {
        const childName = String(child.name || '').trim().toLowerCase();
        return child.parent_id === row.id && productNameSet.has(childName);
      });
      if (hasChildWithProducts) continue;
    }
    seen.add(key);
    const nameAr = String(row.name_ar || '').trim() || nameEn;
    out.push({
      id: String(row.id || row.slug || nameEn),
      nameEn,
      nameAr,
      image: image || imageByCategoryName.get(nameAr) || '',
      filter: nameEn,
    });
  }

  // If taxonomy empty, derive from product categories so filters still work
  if (out.length <= (includeAll ? 1 : 0)) {
    const derived = new Map<string, CircleCategory>();
    for (const p of products) {
      const names = [
        p.category,
        ...(Array.isArray(p.categories) ? p.categories : []),
      ].filter((n): n is string => Boolean(n && String(n).trim()));
      for (const name of names) {
        const key = name.toLowerCase();
        if (derived.has(key)) continue;
        derived.set(key, {
          id: `prod-cat-${key}`,
          nameEn: name,
          nameAr: (isAr ? p.categoryAr : null) || name,
          image: String(p.image || '').trim(),
          filter: name,
        });
      }
    }
    out.push(...derived.values());
  }

  return out;
}
