/** Coffee canvas gate: storefront blocks, or a compact empty — never a flower fallback. */
export function coffeeCanvasMode(
  isCoffee: boolean,
  blockCount: number,
  type: string | null,
  storefrontTypes: ReadonlySet<string>,
): 'empty' | 'storefront' | 'compact' | 'other' {
  if (!isCoffee) return 'other';
  if (blockCount === 0) return 'empty';
  if (type && storefrontTypes.has(type)) return 'storefront';
  return 'compact';
}

export function showRestoreAllBanner(isCoffee: boolean, blockCount: number): boolean {
  if (isCoffee || blockCount === 0) return false;
  return blockCount < 6;
}
