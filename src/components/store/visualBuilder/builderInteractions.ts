export type RowPreset = '1' | '2' | '3' | '4' | '25-25-50';

export type RowColumn = { id: string; width: string; widgets: unknown[] };

export type RowSection = {
  id: string;
  type: 'columns_container';
  layoutColumns: RowPreset;
  columns: RowColumn[];
  columnGap: number;
};

const PRESET_WIDTHS: Record<RowPreset, string[]> = {
  '1': ['100%'],
  '2': ['50%', '50%'],
  '3': ['33.33%', '33.33%', '33.34%'],
  '4': ['25%', '25%', '25%', '25%'],
  '25-25-50': ['25%', '25%', '50%'],
};

export function rowSection(preset: RowPreset, id: string): RowSection {
  const widths = PRESET_WIDTHS[preset];
  return {
    id,
    type: 'columns_container',
    layoutColumns: preset,
    columnGap: 16,
    columns: widths.map((width, index) => ({
      id: `${id}-c${index}`,
      width,
      widgets: [],
    })),
  };
}

export function columnTemplate(preset: string, viewport: number): string {
  if (viewport <= 390) return '1fr';
  if (preset === '25-25-50') return '25% 25% 50%';
  if (preset === '2') return 'repeat(2, 1fr)';
  if (preset === '3') return 'repeat(3, 1fr)';
  if (preset === '4') return 'repeat(4, 1fr)';
  return '1fr';
}

export function widgetPosition(widget: { overlap?: boolean }): 'absolute' | 'relative' {
  return widget.overlap === true ? 'absolute' : 'relative';
}

/** Global chrome — top bar, navbar/header, footer. Editable but never reorderable. */
const FIXED_CHROME_TYPES = new Set([
  'announcement',
  'announcement_bar',
  'header',
  'navbar',
  'main-menu',
  'main_menu',
  'footer',
]);

const FIXED_CHROME_IDS = new Set([
  'announcement',
  'announcement_bar',
  'header',
  'navbar',
  'main-menu',
  'main_menu',
  'footer',
]);

export function isFixedChromeBlock(block: { type?: string; id?: string } | null | undefined): boolean {
  if (!block) return false;
  const type = String(block.type || '').toLowerCase().trim();
  const id = String(block.id || '').toLowerCase().trim();
  if (FIXED_CHROME_TYPES.has(type)) return true;
  if (FIXED_CHROME_IDS.has(id)) return true;
  // id prefixes: header_*, footer_*, announcement_*
  if (/^(announcement|header|navbar|main[-_]?menu|footer)(_|$)/i.test(id)) return true;
  return false;
}

export function applyDrop<T>(items: T[], from: number, to: number): { items: T[]; accepted: boolean } {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return { items, accepted: false };
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { items: next, accepted: true };
}

/**
 * Reorder only movable body widgets. Top bar / navbar / footer stay pinned.
 * Rejects dragging chrome, dropping onto chrome, or leaving chrome out of order.
 */
export function applyChromeSafeDrop<T extends { type?: string; id?: string }>(
  items: T[],
  from: number,
  to: number,
): { items: T[]; accepted: boolean; reason?: 'chrome-locked' | 'invalid' } {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return { items, accepted: false, reason: 'invalid' };
  }
  if (isFixedChromeBlock(items[from]) || isFixedChromeBlock(items[to])) {
    return { items, accepted: false, reason: 'chrome-locked' };
  }
  const dropped = applyDrop(items, from, to);
  if (!dropped.accepted) return { items, accepted: false, reason: 'invalid' };
  if (!chromeOrderIntact(dropped.items)) {
    return { items, accepted: false, reason: 'chrome-locked' };
  }
  return { items: dropped.items, accepted: true };
}

export function chromeOrderIntact<T extends { type?: string; id?: string }>(items: T[]): boolean {
  let seenBody = false;
  let seenFooter = false;
  for (const block of items) {
    const chrome = isFixedChromeBlock(block);
    const type = String(block.type || '').toLowerCase();
    const id = String(block.id || '').toLowerCase();
    const isFooter = type === 'footer' || id === 'footer' || /^footer(_|$)/i.test(id);
    const isTopChrome = chrome && !isFooter;
    if (isTopChrome) {
      if (seenBody || seenFooter) return false;
      continue;
    }
    if (isFooter) {
      seenFooter = true;
      continue;
    }
    if (seenFooter) return false;
    seenBody = true;
  }
  return true;
}

/** Insert index must stay between top chrome and footer. */
export function clampInsertIndexForChrome<T extends { type?: string; id?: string }>(
  items: T[],
  targetIndex: number,
): number {
  let firstBody = 0;
  while (firstBody < items.length) {
    const b = items[firstBody];
    const type = String(b.type || '').toLowerCase();
    const id = String(b.id || '').toLowerCase();
    const isFooter = type === 'footer' || id === 'footer' || /^footer(_|$)/i.test(id);
    const isTopChrome = isFixedChromeBlock(b) && !isFooter;
    if (!isTopChrome) break;
    firstBody += 1;
  }
  let footerIdx = items.findIndex((b) => {
    const type = String(b.type || '').toLowerCase();
    const id = String(b.id || '').toLowerCase();
    return type === 'footer' || id === 'footer' || /^footer(_|$)/i.test(id);
  });
  if (footerIdx < 0) footerIdx = items.length;
  const min = firstBody;
  const max = footerIdx;
  return Math.max(min, Math.min(max, targetIndex));
}

export function nestIntoColumns<T>(
  columnsData: Record<number, T[]>,
  columnCount: number,
  columnIndex: number,
  widget: T,
): { columnsData: Record<number, T[]>; accepted: boolean } {
  if (columnIndex < 0 || columnIndex >= columnCount) {
    return { columnsData, accepted: false };
  }
  const list = columnsData[columnIndex] || [];
  return {
    accepted: true,
    columnsData: { ...columnsData, [columnIndex]: [...list, widget] },
  };
}

export function duplicateBlock<T extends { id: string }>(blocks: T[], id: string, newId: string): T[] {
  const index = blocks.findIndex((block) => block.id === id);
  if (index < 0 || newId === id) return blocks;
  const clone = { ...blocks[index], id: newId };
  const next = blocks.slice();
  next.splice(index + 1, 0, clone);
  return next;
}

/** Top bar / navbar / footer cannot be duplicated. */
export function duplicateBlockChromeSafe<T extends { id: string; type?: string }>(
  blocks: T[],
  id: string,
  newId: string,
): T[] {
  const block = blocks.find((item) => item.id === id);
  if (isFixedChromeBlock(block)) return blocks;
  return duplicateBlock(blocks, id, newId);
}

export function moveBlock<T extends { id: string }>(blocks: T[], id: string, direction: -1 | 1): T[] {
  const index = blocks.findIndex((block) => block.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= blocks.length) return blocks;
  const next = blocks.slice();
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Body widgets only; chrome and swaps that break chrome order are no-ops. */
export function moveBlockChromeSafe<T extends { id: string; type?: string }>(
  blocks: T[],
  id: string,
  direction: -1 | 1,
): T[] {
  const index = blocks.findIndex((block) => block.id === id);
  if (index < 0) return blocks;
  if (isFixedChromeBlock(blocks[index])) return blocks;
  const target = index + direction;
  if (target < 0 || target >= blocks.length) return blocks;
  if (isFixedChromeBlock(blocks[target])) return blocks;
  const next = moveBlock(blocks, id, direction);
  return chromeOrderIntact(next) ? next : blocks;
}

export function removeBlock<T extends { id: string }>(blocks: T[], id: string): T[] {
  return blocks.filter((block) => block.id !== id);
}

/** Top bar / navbar / footer cannot be deleted from the tree. */
export function removeBlockChromeSafe<T extends { id: string; type?: string }>(
  blocks: T[],
  id: string,
): T[] {
  const block = blocks.find((item) => item.id === id);
  if (isFixedChromeBlock(block)) return blocks;
  return removeBlock(blocks, id);
}

export function withVisibility<T extends { visible?: boolean }>(
  block: T,
  patch: { visible?: boolean; visibleDesktop?: boolean; visibleTablet?: boolean; visibleMobile?: boolean },
): T {
  return { ...block, ...patch };
}

export function blocksForPublish<T extends { visible?: boolean }>(blocks: T[]): T[] {
  return blocks.filter((block) => block.visible !== false);
}

export function countVisibleH1(nodes: unknown): number {
  if (Array.isArray(nodes)) {
    return nodes.reduce<number>((sum, item) => sum + countVisibleH1(item), 0);
  }
  if (!nodes || typeof nodes !== 'object') return 0;
  const node = nodes as Record<string, unknown>;
  if (node.visible === false) return 0;
  const type = node.type;
  const isHeading = type === 'heading' || type === 'w_heading';
  const settings = (isHeading && node.settings && typeof node.settings === 'object'
    ? node.settings
    : node) as Record<string, unknown>;
  const raw = String(settings.tag || settings.htmlTag || settings.level || '').toLowerCase();
  const self = (isHeading || typeof node.tag === 'string') && raw === 'h1' ? 1 : 0;
  let nested = 0;
  for (const [key, value] of Object.entries(node)) {
    if (isHeading && key === 'settings') continue;
    nested += countVisibleH1(value);
  }
  return self + nested;
}

export function createCoalescedSaver(waitMs: number, put: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let puts = 0;
  return {
    push() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        puts += 1;
        put();
      }, waitMs);
    },
    get puts() {
      return puts;
    },
  };
}
