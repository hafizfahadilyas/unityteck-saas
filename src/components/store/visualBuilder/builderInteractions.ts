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

export function applyDrop<T>(items: T[], from: number, to: number): { items: T[]; accepted: boolean } {
  if (from < 0 || to < 0 || from >= items.length || to >= items.length || from === to) {
    return { items, accepted: false };
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return { items: next, accepted: true };
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

export function moveBlock<T extends { id: string }>(blocks: T[], id: string, direction: -1 | 1): T[] {
  const index = blocks.findIndex((block) => block.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= blocks.length) return blocks;
  const next = blocks.slice();
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

export function removeBlock<T extends { id: string }>(blocks: T[], id: string): T[] {
  return blocks.filter((block) => block.id !== id);
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
