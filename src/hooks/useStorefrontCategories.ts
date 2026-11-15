import { useEffect, useMemo, useState } from 'react';
import { fetchWidgetCategories } from '../api/tenantApi';
import {
  buildCircleCategories,
  type StorefrontCategoryRow,
} from '../themes/flowersPremium/buildCircleCategories';
import type { Product } from '../types';

export type LiveCategoryRow = StorefrontCategoryRow & {
  name_ar?: string | null;
  slug?: string | null;
  image_url?: string | null;
  parent_id?: string | null;
};

/**
 * Live storefront categories for ANY store_id — never coffee/flowers mock packs.
 */
export function useStorefrontCategories(
  storeId: string | undefined | null,
  products: Product[] = [],
  opts?: { isAr?: boolean; includeAll?: boolean },
) {
  const [rows, setRows] = useState<LiveCategoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storeId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchWidgetCategories(storeId)
      .then((data) => {
        if (cancelled) return;
        setRows(
          (data || []).map((r) => ({
            id: String(r.id),
            name: r.name,
            name_ar: r.name_ar,
            slug: r.slug,
            image_url: r.image_url,
            parent_id: r.parent_id ?? null,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const circles = useMemo(
    () =>
      buildCircleCategories(rows, products, {
        includeAll: opts?.includeAll === true,
        isAr: opts?.isAr === true,
      }),
    [rows, products, opts?.includeAll, opts?.isAr],
  );

  const childrenOf = (parentId: string) =>
    rows.filter((r) => String(r.parent_id || '') === String(parentId));

  const findByName = (name: string) => {
    const key = String(name || '').trim().toLowerCase();
    if (!key) return null;
    return (
      rows.find(
        (r) =>
          String(r.name || '').toLowerCase() === key ||
          String(r.name_ar || '').toLowerCase() === key ||
          String(r.slug || '').toLowerCase() === key,
      ) || null
    );
  };

  /** Names to match products when a parent (or child) category is selected. */
  const expandCategoryFilter = (selected: string | null): string[] => {
    if (!selected || selected === 'All' || selected === 'الكل') return [];
    const row = findByName(selected);
    if (!row) return [selected];
    const kids = childrenOf(row.id);
    if (kids.length === 0) {
      return [String(row.name || selected), String(row.name_ar || '')].filter(Boolean);
    }
    const names = [String(row.name || ''), String(row.name_ar || '')];
    for (const k of kids) {
      if (k.name) names.push(k.name);
      if (k.name_ar) names.push(k.name_ar);
    }
    return Array.from(new Set(names.filter(Boolean)));
  };

  return { rows, circles, loading, childrenOf, findByName, expandCategoryFilter };
}
