export interface StudioRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type BoundsElement = {
  type: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  textAlign?: 'left' | 'center' | 'right';
  bgPadding?: number;
};

/** Fallback bounds when layout cache is not ready yet. */
export function estimateElementBounds(el: BoundsElement): StudioRect {
  if (el.type === 'image') {
    const w = el.width || 180;
    const h = el.height || 180;
    return { x: el.x - w / 2, y: el.y - h / 2, w, h };
  }
  if (el.type === 'shape' || el.type === 'icon') {
    const w = el.width || 120;
    const h = el.height || 120;
    if (el.type === 'icon') {
      const side = Math.max(32, el.fontSize * 1.4);
      return { x: el.x - side / 2, y: el.y - side / 2, w: side, h: side };
    }
    return { x: el.x - w / 2, y: el.y - h / 2, w, h };
  }

  const lines = (el.text || '').split('\n');
  const lineH = el.fontSize * 1.35;
  const totalH = lines.length * lineH;
  const maxLen = Math.max(1, ...lines.map((l) => l.length));
  const pad = el.bgPadding ?? 14;
  const boxW = Math.max(el.width || 0, maxLen * (el.fontSize * 0.58) + pad * 2.2);
  const boxH = Math.max(el.height || 0, totalH + pad * 1.2);

  let x = el.x;
  if (el.textAlign === 'center') x = el.x - boxW / 2;
  else if (el.textAlign === 'right') x = el.x - boxW;
  const y = el.y - boxH / 2;
  return { x, y, w: boxW, h: boxH };
}

export function rectContainsPoint(
  rect: StudioRect,
  x: number,
  y: number,
  padding = 10,
): boolean {
  return (
    x >= rect.x - padding &&
    x <= rect.x + rect.w + padding &&
    y >= rect.y - padding &&
    y <= rect.y + rect.h + padding
  );
}

export function rectToPercentStyle(
  rect: StudioRect,
  canvasW: number,
  canvasH: number,
): { left: string; top: string; width: string; height: string } {
  return {
    left: `${(rect.x / canvasW) * 100}%`,
    top: `${(rect.y / canvasH) * 100}%`,
    width: `${(rect.w / canvasW) * 100}%`,
    height: `${(rect.h / canvasH) * 100}%`,
  };
}
