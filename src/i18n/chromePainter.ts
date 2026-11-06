/** Per-store sidebar/header paint hook. Kept out of branding.ts so the import graph stays acyclic. */
let paintStoreChrome: ((root: HTMLElement) => void) | null = null;

export function setChromePainter(fn: (root: HTMLElement) => void): void {
  paintStoreChrome = fn;
}

export function runChromePainter(root: HTMLElement): void {
  paintStoreChrome?.(root);
}
