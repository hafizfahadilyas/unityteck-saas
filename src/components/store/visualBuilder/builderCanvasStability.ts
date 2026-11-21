/**
 * Keep builder canvas horizontally stable when Layers / Widgets / Inspector swap.
 * Selection flash must use inset outline — never ring-offset (that expands layout).
 */

export const BLOCK_SELECTED_CLASS = 'vb-block-selected';
export const BLOCK_FLASH_CLASS = 'vb-block-flash';

export type ScrollBlockOptions = {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
};

/** Prefer nearest axes so selection never yanks the canvas left/right. */
export function scrollBlockIntoCanvasView(
  el: HTMLElement | null | undefined,
  opts: ScrollBlockOptions = {},
): void {
  if (!el || typeof el.scrollIntoView !== 'function') return;
  el.scrollIntoView({
    behavior: opts.behavior ?? 'smooth',
    block: opts.block ?? 'nearest',
    inline: opts.inline ?? 'nearest',
  });
}

export function flashBlockSelection(el: HTMLElement | null | undefined, ms = 1200): void {
  if (!el) return;
  el.classList.add(BLOCK_FLASH_CLASS);
  const schedule = typeof globalThis.setTimeout === 'function' ? globalThis.setTimeout.bind(globalThis) : null;
  if (!schedule) return;
  schedule(() => {
    el.classList.remove(BLOCK_FLASH_CLASS);
  }, ms);
}

/** Desktop rails overlay the workspace — they must not sit in flex flow (lg:static). */
export function builderRailAsideClass(singleRailStart: boolean): string {
  const dock = singleRailStart
    ? 'start-0 border-e border-slate-200 slide-in-from-start'
    : 'end-0 border-s border-slate-200 slide-in-from-end';
  return `vb-rail-aside fixed inset-y-0 z-50 bg-white shadow-2xl flex flex-col select-none lg:absolute lg:z-30 lg:shadow-xl animate-in duration-200 ${dock}`;
}

export type BuilderCanvasRailInset = { startPx: number; endPx: number };

/**
 * Keep the live preview centered in the *visible* workspace so Themes/Widgets/Inspector
 * never overlap the canvas (absolute rail + matching inline padding).
 */
export function builderCanvasRailInset(opts: {
  leftOpen: boolean;
  rightOpen: boolean;
  leftWidth: number;
  rightWidth: number;
  singleRail: boolean;
  /** lg+ only — below that rails are full drawers with backdrop */
  desktop: boolean;
}): BuilderCanvasRailInset {
  if (!opts.desktop) return { startPx: 0, endPx: 0 };
  const leftW = Math.min(Math.max(0, opts.leftWidth), 400);
  const rightW = Math.min(Math.max(0, opts.rightWidth), 440);
  if (opts.singleRail) {
    if (opts.rightOpen) return { startPx: rightW, endPx: 0 };
    if (opts.leftOpen) return { startPx: leftW, endPx: 0 };
    return { startPx: 0, endPx: 0 };
  }
  return {
    startPx: opts.leftOpen ? leftW : 0,
    endPx: opts.rightOpen ? rightW : 0,
  };
}
