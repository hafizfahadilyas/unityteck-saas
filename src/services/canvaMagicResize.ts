/**
 * Honest design resize — scale layers by width/height ratios (not AI).
 * Presets: Story 1080×1920, Post 1080×1080, Banner 1600×600.
 */

export type MagicResizePresetId = 'story' | 'post' | 'banner';

export type MagicResizePreset = {
  id: MagicResizePresetId;
  labelEn: string;
  labelAr: string;
  width: number;
  height: number;
};

export const MAGIC_RESIZE_PRESETS: MagicResizePreset[] = [
  { id: 'story', labelEn: 'Story', labelAr: 'ستوري', width: 1080, height: 1920 },
  { id: 'post', labelEn: 'Post', labelAr: 'منشور', width: 1080, height: 1080 },
  { id: 'banner', labelEn: 'Banner', labelAr: 'بنر', width: 1600, height: 600 },
];

export type MagicResizeLayer = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  strokeWidth?: number;
  letterSpacing?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  bgPadding?: number;
};

export type MagicResizeResult<T extends MagicResizeLayer> = {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  elements: T[];
};

/** Scale element geometry from fromW×fromH → toW×toH. */
export function scaleElementsForResize<T extends MagicResizeLayer>(
  elements: T[],
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
): MagicResizeResult<T> {
  const fw = Math.max(1, fromW);
  const fh = Math.max(1, fromH);
  const tw = Math.max(1, toW);
  const th = Math.max(1, toH);
  const scaleX = tw / fw;
  const scaleY = th / fh;
  const scaleFont = (scaleX + scaleY) / 2;

  const next = elements.map((el) => {
    const copy = { ...el };
    copy.x = Math.round(el.x * scaleX);
    copy.y = Math.round(el.y * scaleY);
    if (el.width != null) copy.width = Math.max(8, Math.round(el.width * scaleX));
    if (el.height != null) copy.height = Math.max(8, Math.round(el.height * scaleY));
    copy.fontSize = Math.max(8, Math.round(el.fontSize * scaleFont));
    if (el.strokeWidth != null) {
      copy.strokeWidth = Math.max(0, Math.round(el.strokeWidth * scaleFont));
    }
    if (el.letterSpacing != null) {
      copy.letterSpacing = Math.round(el.letterSpacing * scaleX * 10) / 10;
    }
    if (el.shadowBlur != null) {
      copy.shadowBlur = Math.round(el.shadowBlur * scaleFont);
    }
    if (el.shadowOffsetX != null) {
      copy.shadowOffsetX = Math.round(el.shadowOffsetX * scaleX);
    }
    if (el.shadowOffsetY != null) {
      copy.shadowOffsetY = Math.round(el.shadowOffsetY * scaleY);
    }
    if (el.bgPadding != null) {
      copy.bgPadding = Math.max(0, Math.round(el.bgPadding * scaleFont));
    }
    return copy;
  });

  return { width: tw, height: th, scaleX, scaleY, elements: next };
}

/** Alias used by CanvaImageStudioModal — returns scaled layers only. */
export function magicResizeLayers<T extends MagicResizeLayer>(
  elements: T[],
  fromW: number,
  fromH: number,
  toW: number,
  toH: number,
): T[] {
  return scaleElementsForResize(elements, fromW, fromH, toW, toH).elements;
}

export function findMagicResizePreset(id: MagicResizePresetId): MagicResizePreset | undefined {
  return MAGIC_RESIZE_PRESETS.find((p) => p.id === id);
}

/** Derive 3 palette swatches from a hex accent (Brand Kit). */
export function deriveBrandPalette(accentHex: string): string[] {
  const hex = String(accentHex || '').trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [];
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (rr: number, gg: number, bb: number) =>
    `#${[rr, gg, bb].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
  const light = toHex(r + (255 - r) * 0.55, g + (255 - g) * 0.55, b + (255 - b) * 0.55);
  const base = toHex(r, g, b);
  const dark = toHex(r * 0.45, g * 0.45, b * 0.45);
  return [light, base, dark];
}
