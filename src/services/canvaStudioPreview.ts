/**
 * Fast downscaled previews for Design Studio saves (IndexedDB + Canva home grid).
 * Full-res export stays separate — thumbs stay sharp but small (JPEG preferred).
 */

const DEFAULT_MAX_SIDE = 240;
const HOME_MAX_SIDE = 200;
/** Skip work if payload already small enough (chars ≈ bytes for data URLs) */
const SKIP_IF_SHORTER_THAN = 48_000;

export type ThumbFormat = 'image/jpeg' | 'image/png' | 'image/webp';

function isDataUrl(s: string): boolean {
  return typeof s === 'string' && s.startsWith('data:image/');
}

/**
 * Downscale any image data-URL / http(s) URL to a compact thumb.
 * Defaults to JPEG @ 0.72 — much smaller than PNG for photo-heavy PPTX packs.
 */
export function downscaleDataUrlToPng(dataUrl: string, maxSide = DEFAULT_MAX_SIDE): Promise<string> {
  return optimizeCanvaThumb(dataUrl, { maxSide, format: 'image/png', quality: 0.92 });
}

export function optimizeCanvaThumb(
  src: string,
  opts?: { maxSide?: number; format?: ThumbFormat; quality?: number; forHome?: boolean },
): Promise<string> {
  const maxSide = opts?.maxSide ?? (opts?.forHome ? HOME_MAX_SIDE : DEFAULT_MAX_SIDE);
  const format: ThumbFormat = opts?.format ?? 'image/jpeg';
  const quality = opts?.quality ?? (format === 'image/png' ? 0.92 : 0.72);

  if (!src || typeof document === 'undefined') {
    return Promise.resolve(src);
  }
  // Already a tiny data URL — keep
  if (isDataUrl(src) && src.length < SKIP_IF_SHORTER_THAN && !opts?.forHome) {
    return Promise.resolve(src);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        resolve(src);
        return;
      }
      const scale = Math.min(1, maxSide / Math.max(w, h));
      const tw = Math.max(1, Math.round(w * scale));
      const th = Math.max(1, Math.round(h * scale));
      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      // JPEG has no alpha — fill white under transparent PPTX cuts
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tw, th);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, tw, th);
      try {
        const out =
          format === 'image/png'
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL(format, quality);
        // If encode somehow grew (rare), keep original only when original was already data URL small
        if (isDataUrl(src) && out.length > src.length * 1.15 && src.length < 200_000) {
          resolve(src);
          return;
        }
        resolve(out);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/** Home carousel / Continue grid — aggressive compact thumb */
export function optimizeHomeThumb(src: string | undefined): Promise<string | undefined> {
  if (!src) return Promise.resolve(undefined);
  return optimizeCanvaThumb(src, { forHome: true, maxSide: HOME_MAX_SIDE, format: 'image/jpeg', quality: 0.68 });
}

/**
 * Render a complete composite preview of imported layers (background, shapes, typography)
 * into a fast, crisp home thumbnail.
 */
export async function renderLayersToCompositeThumb(
  layers: Array<{
    type?: string;
    text?: string;
    imageUrl?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontColor?: string;
    bgColor?: string;
    borderRadius?: number;
    isBold?: boolean;
    isItalic?: boolean;
    textAlign?: 'left' | 'center' | 'right';
    opacity?: number;
  }>,
  docWidth: number,
  docHeight: number,
  maxSide = HOME_MAX_SIDE,
): Promise<string | undefined> {
  if (!layers || layers.length === 0) return undefined;
  if (typeof document === 'undefined') {
    return layers.find((l) => l.imageUrl)?.imageUrl;
  }

  const w = docWidth || 1080;
  const h = docHeight || 1080;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) return layers.find((l) => l.imageUrl)?.imageUrl;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, tw, th);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (const l of layers) {
    const lx = Math.round(((l.x ?? 0) - (l.width ?? 0) / 2) * scale);
    const ly = Math.round(((l.y ?? 0) - (l.height ?? 0) / 2) * scale);
    const lw = Math.round((l.width ?? 0) * scale);
    const lh = Math.round((l.height ?? 0) * scale);
    const opacity = l.opacity != null ? l.opacity : 1;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (l.imageUrl) {
      await new Promise<void>((res) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, lx, ly, lw, lh);
          res();
        };
        img.onerror = () => res();
        img.src = l.imageUrl!;
      });
    } else if (l.type === 'shape' && l.bgColor) {
      ctx.fillStyle = l.bgColor;
      if (typeof ctx.roundRect === 'function' && l.borderRadius) {
        ctx.beginPath();
        ctx.roundRect(lx, ly, lw, lh, l.borderRadius * scale);
        ctx.fill();
      } else {
        ctx.fillRect(lx, ly, lw, lh);
      }
    } else if (l.text) {
      if (l.bgColor && l.bgColor !== l.fontColor && l.bgColor !== 'transparent') {
        ctx.fillStyle = l.bgColor;
        if (typeof ctx.roundRect === 'function' && l.borderRadius) {
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, l.borderRadius * scale);
          ctx.fill();
        } else {
          ctx.fillRect(lx, ly, lw, lh);
        }
      }
      const fontSize = Math.max(8, Math.round((l.fontSize || 28) * scale));
      const fontColor = l.fontColor || '#000000';
      const isBold = l.isBold ? 'bold ' : '';
      const isItalic = l.isItalic ? 'italic ' : '';
      ctx.font = `${isItalic}${isBold}${fontSize}px Cairo, Tajawal, Segoe UI, sans-serif`;
      ctx.fillStyle = fontColor;
      ctx.textAlign = l.textAlign === 'left' ? 'left' : l.textAlign === 'right' ? 'right' : 'center';
      ctx.textBaseline = 'middle';

      const lines = String(l.text).split('\n');
      const textX = l.textAlign === 'left' ? lx : l.textAlign === 'right' ? lx + lw : Math.round((l.x ?? 0) * scale);
      const lineHeight = fontSize * 1.25;
      const totalH = lines.length * lineHeight;
      const startY = Math.round((l.y ?? 0) * scale) - totalH / 2 + lineHeight / 2;

      lines.forEach((line, idx) => {
        ctx.fillText(line, textX, startY + idx * lineHeight);
      });
    }

    ctx.restore();
  }

  try {
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return layers.find((l) => l.imageUrl)?.imageUrl;
  }
}
