/**
 * Canva / Photoshop PSD + image → editable studio layers.
 * Real Canva web app: Download as PSD (Pro) or PNG, then upload here.
 * Per-store isolation happens in callers (My Templates + Media Library).
 */

import { readPsd, type Layer, type LayerTextData } from 'ag-psd';
import type { CanvaTemplateCategory } from '../data/ksaCanvaTemplates';

export type ImportedStudioLayerType =
  | 'headline'
  | 'subtitle'
  | 'price'
  | 'badge'
  | 'custom_text'
  | 'sticker'
  | 'watermark'
  | 'shape'
  | 'icon'
  | 'image';

export interface ImportedStudioLayer {
  id: string;
  type: ImportedStudioLayerType;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  imageUrl?: string;
  locked?: boolean;
}

export interface ImportedStudioDesign {
  width: number;
  height: number;
  name: string;
  source: 'psd' | 'image';
  layers: ImportedStudioLayer[];
  previewDataUrl?: string;
  categoryHint?: CanvaTemplateCategory;
}

export const CANVA_UPLOAD_CATEGORIES: Array<{
  id: CanvaTemplateCategory;
  labelEn: string;
  labelAr: string;
}> = [
  { id: 'banner', labelEn: 'Banner', labelAr: 'بنر' },
  { id: 'social', labelEn: 'Post / Social', labelAr: 'منشور / تواصل' },
  { id: 'ads', labelEn: 'Ads', labelAr: 'إعلان' },
  { id: 'logo', labelEn: 'Logo', labelAr: 'شعار' },
  { id: 'product', labelEn: 'Product', labelAr: 'منتج' },
  { id: 'category', labelEn: 'Category', labelAr: 'تصنيف' },
];

const MAX_PSD_BYTES = 45 * 1024 * 1024;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_LAYERS = 80;

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function channelTo255(n: number): number {
  // ag-psd may expose 0–1 floats or 0–255 ints
  if (n >= 0 && n <= 1) return Math.round(n * 255);
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbaToHex(color: { r?: number; g?: number; b?: number } | undefined, fallback = '#0f172a'): string {
  if (!color || color.r == null || color.g == null || color.b == null) return fallback;
  const h = (n: number) => channelTo255(n).toString(16).padStart(2, '0');
  return `#${h(color.r)}${h(color.g)}${h(color.b)}`;
}

function flattenLayers(layers: Layer[] | undefined, out: Layer[] = []): Layer[] {
  if (!layers?.length) return out;
  for (const layer of layers) {
    if (layer.children?.length) {
      flattenLayers(layer.children, out);
      continue;
    }
    // Skip folder markers / empty section dividers
    if (layer.sectionDivider != null && !layer.canvas && !layer.text) continue;
    out.push(layer);
  }
  return out;
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement | undefined,
  quality = 0.92,
): string | undefined {
  if (!canvas || canvas.width < 1 || canvas.height < 1) return undefined;
  try {
    return canvas.toDataURL('image/png');
  } catch {
    try {
      return canvas.toDataURL('image/webp', quality);
    } catch {
      return undefined;
    }
  }
}

function extractTextPayload(text: LayerTextData | undefined): {
  content: string;
  fontSize: number;
  fontColor: string;
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
} | null {
  if (!text) return null;
  const content = (text.text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!content) return null;

  const style = text.style || {};
  const fill = style.fillColor as { r?: number; g?: number; b?: number } | undefined;
  const just = text.paragraphStyle?.justification;
  let textAlign: 'left' | 'center' | 'right' = 'center';
  if (just === 'left') textAlign = 'left';
  else if (just === 'right') textAlign = 'right';
  else if (just === 'center') textAlign = 'center';

  return {
    content,
    fontSize: Math.max(12, Math.round(style.fontSize || 28)),
    fontColor: rgbaToHex(fill, '#0f172a'),
    isBold: Boolean(style.fauxBold),
    isItalic: Boolean(style.fauxItalic),
    textAlign,
  };
}

function layerBounds(layer: Layer): { left: number; top: number; width: number; height: number } {
  const left = layer.left ?? 0;
  const top = layer.top ?? 0;
  const right = layer.right ?? left;
  const bottom = layer.bottom ?? top;
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  return { left, top, width, height };
}

function guessCategoryFromSize(width: number, height: number): CanvaTemplateCategory {
  const ratio = width / Math.max(1, height);
  if (width >= 1400 && height <= 700) return 'banner';
  if (ratio > 1.6 && width >= 1000) return 'ads';
  if (height > width * 1.4) return 'social';
  if (width <= 600 && height <= 600) return 'logo';
  return 'product';
}

/**
 * Parse a Photoshop / Canva-exported PSD into editable studio layers.
 */
export async function importPsdFile(file: File): Promise<ImportedStudioDesign> {
  if (file.size > MAX_PSD_BYTES) {
    throw new Error('PSD_TOO_LARGE');
  }

  const buffer = await file.arrayBuffer();
  const psd = readPsd(buffer, {
    skipThumbnail: false,
    useImageData: true,
  });

  const docW = Math.max(1, psd.width || 1080);
  const docH = Math.max(1, psd.height || 1080);
  const flat = flattenLayers(psd.children).filter((l) => !l.hidden);
  const layers: ImportedStudioLayer[] = [];

  for (const layer of flat) {
    if (layers.length >= MAX_LAYERS) break;

    const bounds = layerBounds(layer);
    if (bounds.width < 2 && bounds.height < 2 && !layer.text) continue;

    const textInfo = extractTextPayload(layer.text);
    if (textInfo) {
      layers.push({
        id: uid('txt'),
        type: textInfo.fontSize >= 40 ? 'headline' : 'custom_text',
        text: textInfo.content,
        x: Math.round(bounds.left + bounds.width / 2),
        y: Math.round(bounds.top + bounds.height / 2),
        width: Math.max(80, bounds.width),
        height: Math.max(40, bounds.height),
        fontSize: textInfo.fontSize,
        fontColor: textInfo.fontColor,
        isBold: textInfo.isBold,
        isItalic: textInfo.isItalic,
        textAlign: textInfo.textAlign,
        opacity: typeof layer.opacity === 'number' ? layer.opacity : 1,
      });
      continue;
    }

    const dataUrl = canvasToDataUrl(layer.canvas as HTMLCanvasElement | undefined);
    if (!dataUrl) continue;

    layers.push({
      id: uid('img'),
      type: 'image',
      text: (layer.name || 'Layer').slice(0, 48),
      imageUrl: dataUrl,
      x: Math.round(bounds.left + bounds.width / 2),
      y: Math.round(bounds.top + bounds.height / 2),
      width: bounds.width,
      height: bounds.height,
      fontSize: 16,
      fontColor: '#0f172a',
      opacity: typeof layer.opacity === 'number' ? layer.opacity : 1,
    });
  }

  // Fallback: if no child layers, use composite canvas
  if (layers.length === 0) {
    const composite = canvasToDataUrl(psd.canvas as HTMLCanvasElement | undefined);
    if (composite) {
      layers.push({
        id: uid('img'),
        type: 'image',
        text: file.name.replace(/\.[^.]+$/, '') || 'Design',
        imageUrl: composite,
        x: Math.round(docW / 2),
        y: Math.round(docH / 2),
        width: docW,
        height: docH,
        fontSize: 16,
        fontColor: '#0f172a',
        opacity: 1,
      });
    }
  }

  if (layers.length === 0) {
    throw new Error('PSD_NO_LAYERS');
  }

  const preview =
    canvasToDataUrl(psd.canvas as HTMLCanvasElement | undefined) ||
    layers.find((l) => l.imageUrl)?.imageUrl;

  return {
    width: docW,
    height: docH,
    name: file.name.replace(/\.[^.]+$/, '') || 'Imported PSD',
    source: 'psd',
    layers,
    previewDataUrl: preview,
    categoryHint: guessCategoryFromSize(docW, docH),
  };
}

/**
 * Import PNG/JPG/WebP as a single full-canvas editable image layer.
 */
export async function importImageAsDesign(file: File): Promise<ImportedStudioDesign> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_TOO_LARGE');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('IMAGE_READ_FAIL'));
    reader.readAsDataURL(file);
  });

  const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1080, h: img.naturalHeight || 1080 });
    img.onerror = () => reject(new Error('IMAGE_READ_FAIL'));
    img.src = dataUrl;
  });

  const width = Math.max(1, dims.w);
  const height = Math.max(1, dims.h);
  const name = file.name.replace(/\.[^.]+$/, '') || 'Imported Image';

  return {
    width,
    height,
    name,
    source: 'image',
    previewDataUrl: dataUrl,
    categoryHint: guessCategoryFromSize(width, height),
    layers: [
      {
        id: uid('img'),
        type: 'image',
        text: name,
        imageUrl: dataUrl,
        x: Math.round(width / 2),
        y: Math.round(height / 2),
        width,
        height,
        fontSize: 16,
        fontColor: '#0f172a',
        opacity: 1,
      },
    ],
  };
}

export function isPsdFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.psd') ||
    file.type === 'image/vnd.adobe.photoshop' ||
    file.type === 'application/x-photoshop' ||
    file.type === 'application/photoshop'
  );
}

export function isRasterImageFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith('.psd')) return false;
  return (
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif)$/i.test(name)
  );
}

export async function importDesignFile(file: File): Promise<ImportedStudioDesign> {
  if (isPsdFile(file)) return importPsdFile(file);
  if (isRasterImageFile(file)) return importImageAsDesign(file);
  throw new Error('UNSUPPORTED_FILE');
}
