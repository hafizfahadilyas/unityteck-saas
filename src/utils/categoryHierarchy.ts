import type { StoreCategory } from '../types';

export function getDescendantIds(
  categories: StoreCategory[],
  rootId: string,
): Set<string> {
  const byParent = new Map<string | null, StoreCategory[]>();
  categories.forEach((c) => {
    const key = c.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  });

  const out = new Set<string>();
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const node = stack.pop()!;
    out.add(node.id);
    stack.push(...(byParent.get(node.id) ?? []));
  }
  return out;
}

export function getCategoryDepth(categories: StoreCategory[], id: string): number {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let depth = 0;
  let current = byId.get(id)?.parentId ?? null;
  let guard = 0;
  while (current && guard < 50) {
    depth++;
    current = byId.get(current)?.parentId ?? null;
    guard++;
  }
  return depth;
}

/** DFS tree order: each parent followed by its subcategories (sort_order within siblings). */
export function flattenCategoryTree(
  categories: StoreCategory[],
  isAr = false,
): StoreCategory[] {
  const byParent = new Map<string | null, StoreCategory[]>();
  categories.forEach((c) => {
    const key = c.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(c);
    byParent.set(key, list);
  });

  const sortSiblings = (list: StoreCategory[]) =>
    [...list].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      const la = isAr ? (a.nameAr || a.name) : (a.name || a.nameAr || '');
      const lb = isAr ? (b.nameAr || b.name) : (b.name || b.nameAr || '');
      return la.localeCompare(lb, undefined, { sensitivity: 'base' });
    });

  const ordered: StoreCategory[] = [];
  const walk = (parentId: string | null, depth: number) => {
    sortSiblings(byParent.get(parentId) ?? []).forEach((node) => {
      ordered.push(node);
      if (depth < 8) walk(node.id, depth + 1);
    });
  };
  walk(null, 0);

  // Orphans (broken parent_id) still appear at the end
  if (ordered.length < categories.length) {
    const seen = new Set(ordered.map((c) => c.id));
    categories.forEach((c) => {
      if (!seen.has(c.id)) ordered.push(c);
    });
  }
  return ordered;
}

export function parentPickerOptions(
  categories: StoreCategory[],
  editingId: string | null,
  isAr: boolean,
): { id: string; label: string; depth: number }[] {
  const blocked = new Set<string>();
  if (editingId) {
    blocked.add(editingId);
    getDescendantIds(categories, editingId).forEach((id) => blocked.add(id));
  }

  return flattenCategoryTree(categories, isAr)
    .filter((c) => !blocked.has(c.id))
    .map((c) => ({
      id: c.id,
      depth: getCategoryDepth(categories, c.id),
      label: isAr ? (c.nameAr || c.name) : (c.name || c.nameAr || c.slug),
    }));
}

/** Flat product-picker list: roots + subcategories with indented labels (EN/AR). */
export function productCategoryPickerOptions(
  categories: StoreCategory[],
  isAr: boolean,
): { value: string; label: string; depth: number; id: string }[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const active = categories.filter((c) => c.isActive !== false);
  const ordered = flattenCategoryTree(active, isAr);

  return ordered.map((c) => {
    const depth = getCategoryDepth(categories, c.id);
    const own = isAr ? (c.nameAr || c.name) : (c.name || c.nameAr || c.slug);
    let label = own;
    if (c.parentId && byId.has(c.parentId)) {
      const parent = byId.get(c.parentId)!;
      const parentName = isAr
        ? (parent.nameAr || parent.name)
        : (parent.name || parent.nameAr || parent.slug);
      label = `${parentName} › ${own}`;
    }
    return {
      id: c.id,
      value: own,
      label: depth > 0 ? `${'— '.repeat(depth)}${label}` : label,
      depth,
    };
  });
}
