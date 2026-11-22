/**
 * Canvas snap + temporary alignment guides for Design Studio drag.
 * Snaps to canvas center/edges and other element centers/edges (~8px).
 */

export const SNAP_THRESHOLD_PX = 8;

export type SnapGuide = { v?: number; h?: number };

export type SnapAabb = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type SnapElementRef = {
  id?: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
};

function dist(a: number, b: number): number {
  return Math.abs(a - b);
}

function pickBest(
  moving: number,
  candidates: number[],
  threshold: number,
): { value: number; guide: number; d: number } | null {
  let best: { value: number; guide: number; d: number } | null = null;
  for (const c of candidates) {
    const d = dist(moving, c);
    if (d <= threshold && (!best || d < best.d)) {
      best = { value: c, guide: c, d };
    }
  }
  return best;
}

export function aabbFromCenter(cx: number, cy: number, w: number, h: number): SnapAabb {
  const halfW = Math.max(1, w) / 2;
  const halfH = Math.max(1, h) / 2;
  return {
    left: cx - halfW,
    top: cy - halfH,
    right: cx + halfW,
    bottom: cy + halfH,
  };
}

export function aabbFromRect(rect: { x: number; y: number; w: number; h: number }): SnapAabb {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.w,
    bottom: rect.y + rect.h,
  };
}

export function computeSnapGuides(
  moving: SnapAabb,
  others: SnapAabb[],
  canvasW: number,
  canvasH: number,
  threshold = SNAP_THRESHOLD_PX,
): { dx: number; dy: number; guides: SnapGuide[] } {
  const mx = (moving.left + moving.right) / 2;
  const my = (moving.top + moving.bottom) / 2;

  const xTargets: number[] = [0, canvasW / 2, canvasW];
  const yTargets: number[] = [0, canvasH / 2, canvasH];
  for (const o of others) {
    xTargets.push(o.left, (o.left + o.right) / 2, o.right);
    yTargets.push(o.top, (o.top + o.bottom) / 2, o.bottom);
  }

  type Cand = { delta: number; guide: number; d: number };
  const xCands: Cand[] = [];
  const leftSnap = pickBest(moving.left, xTargets, threshold);
  const rightSnap = pickBest(moving.right, xTargets, threshold);
  const cxSnap = pickBest(mx, xTargets, threshold);
  if (leftSnap) xCands.push({ delta: leftSnap.value - moving.left, guide: leftSnap.guide, d: leftSnap.d });
  if (rightSnap) {
    xCands.push({ delta: rightSnap.value - moving.right, guide: rightSnap.guide, d: rightSnap.d });
  }
  if (cxSnap) xCands.push({ delta: cxSnap.value - mx, guide: cxSnap.guide, d: cxSnap.d });
  xCands.sort((a, b) => a.d - b.d);

  const yCands: Cand[] = [];
  const topSnap = pickBest(moving.top, yTargets, threshold);
  const bottomSnap = pickBest(moving.bottom, yTargets, threshold);
  const cySnap = pickBest(my, yTargets, threshold);
  if (topSnap) yCands.push({ delta: topSnap.value - moving.top, guide: topSnap.guide, d: topSnap.d });
  if (bottomSnap) {
    yCands.push({ delta: bottomSnap.value - moving.bottom, guide: bottomSnap.guide, d: bottomSnap.d });
  }
  if (cySnap) yCands.push({ delta: cySnap.value - my, guide: cySnap.guide, d: cySnap.d });
  yCands.sort((a, b) => a.d - b.d);

  const guides: SnapGuide[] = [];
  const dx = xCands[0]?.delta ?? 0;
  const dy = yCands[0]?.delta ?? 0;
  if (xCands[0]) guides.push({ v: xCands[0].guide });
  if (yCands[0]) guides.push({ h: yCands[0].guide });
  return { dx, dy, guides };
}

/** Primary drag helper used by CanvaImageStudioModal. */
export function snapElementCenter(args: {
  cx: number;
  cy: number;
  w: number;
  h: number;
  canvasW: number;
  canvasH: number;
  others: SnapElementRef[];
  threshold?: number;
}): { cx: number; cy: number; guides: SnapGuide[] } {
  const box = aabbFromCenter(args.cx, args.cy, args.w, args.h);
  const otherBoxes = args.others.map((o) => aabbFromCenter(o.cx, o.cy, o.w, o.h));
  const res = computeSnapGuides(
    box,
    otherBoxes,
    args.canvasW,
    args.canvasH,
    args.threshold ?? SNAP_THRESHOLD_PX,
  );
  return {
    cx: args.cx + res.dx,
    cy: args.cy + res.dy,
    guides: res.guides,
  };
}

export function snapCenterPosition(
  cx: number,
  cy: number,
  w: number,
  h: number,
  others: SnapAabb[],
  canvasW: number,
  canvasH: number,
  threshold = SNAP_THRESHOLD_PX,
): { x: number; y: number; guides: SnapGuide[] } {
  const box = aabbFromCenter(cx, cy, w, h);
  const res = computeSnapGuides(box, others, canvasW, canvasH, threshold);
  return { x: cx + res.dx, y: cy + res.dy, guides: res.guides };
}
