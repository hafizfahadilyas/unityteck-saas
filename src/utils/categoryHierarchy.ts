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

  return categories
    .filter((c) => !blocked.has(c.id))
    .map((c) => ({
      id: c.id,
      depth: getCategoryDepth(categories, c.id),
      label: isAr ? (c.nameAr || c.name) : (c.name || c.nameAr || c.slug),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}
