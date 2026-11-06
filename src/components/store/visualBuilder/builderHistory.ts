export type HistoryState<T> = { stack: T[]; index: number };

export function seedHistory<T>(value: T): HistoryState<T> {
  return { stack: [value], index: 0 };
}

export function pushHistory<T>(
  state: HistoryState<T>,
  value: T,
  same: (a: T, b: T) => boolean,
): HistoryState<T> {
  const current = state.index >= 0 ? state.stack[state.index] : undefined;
  if (current !== undefined && same(current, value)) return state;
  const base = state.index >= 0 ? state.stack.slice(0, state.index + 1) : [];
  const stack = [...base, value].slice(-40);
  return { stack, index: stack.length - 1 };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.index <= 0) return state;
  return { stack: state.stack, index: state.index - 1 };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.index >= state.stack.length - 1) return state;
  return { stack: state.stack, index: state.index + 1 };
}

export function isHistoryShortcut(e: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}): 'undo' | 'redo' | null {
  if (e.altKey || !(e.ctrlKey || e.metaKey)) return null;
  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) return 'undo';
  if (key === 'y' || (key === 'z' && e.shiftKey)) return 'redo';
  return null;
}
