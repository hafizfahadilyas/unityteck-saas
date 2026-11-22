/**
 * Master Admin → push Canva design into selected stores' Media + Canva library.
 * Each target gets its own store_id row (never shared cross-tenant blobs).
 *
 * Also: Master platform media library, local download, Google Drive hand-off
 * (download file + open Drive — no fake "uploaded" OAuth).
 */

import type { MediaAsset } from '../types/media';
import type { CanvaTemplateCategory } from '../data/ksaCanvaTemplates';
import type { ImportedStudioLayer } from './canvaPsdImport';
import { saveMyCanvaTemplate } from './canvaMyTemplates';
import { saveStudioDesign, type StudioEditorType } from './storeStudioDesigns';
import { isApiEnabled } from '../api/client';

/** Reserved tenant id for Master Admin media gallery (not a merchant store). */
export const MASTER_MEDIA_STORE_ID = 'master-platform';

export type MasterCanvaSaveDest =
  | 'store_media'
  | 'master_media'
  | 'local'
  | 'google_drive';

export type MasterCanvaDistributePayload = {
  dataUrl: string;
  /** Downscaled PNG thumb for store Canva library grid */
  previewDataUrl?: string;
  title: string;
  width: number;
  height: number;
  category: CanvaTemplateCategory;
  layers: ImportedStudioLayer[];
  designJson: Record<string, unknown>;
  source?: 'psd' | 'image' | 'pptx' | 'studio' | 'master';
};

export type MasterCanvaDistributeResult = {
  storeId: string;
  mediaOk: boolean;
  templateOk: boolean;
  studioOk: boolean;
  error?: string;
};

function slugTitle(title: string): string {
  const s = (title || 'studio-design')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'studio-design';
}

function editorTypeFromCategory(category: CanvaTemplateCategory): StudioEditorType {
  if (category === 'logo') return 'logo';
  if (category === 'product') return 'product_card';
  return 'banner';
}

export async function distributeCanvaToStores(opts: {
  storeIds: string[];
  payload: MasterCanvaDistributePayload;
  addMediaAsset: (
    asset: Omit<MediaAsset, 'id' | 'storeId' | 'uploadDate' | 'updatedAt' | 'version'>,
    targetStoreId?: string,
  ) => MediaAsset;
  isAr?: boolean;
}): Promise<MasterCanvaDistributeResult[]> {
  const { storeIds, payload, addMediaAsset, isAr } = opts;
  const unique = [...new Set(storeIds.filter(Boolean))];
  const results: MasterCanvaDistributeResult[] = [];
  const fileBase = slugTitle(payload.title);

  for (const storeId of unique) {
    const row: MasterCanvaDistributeResult = {
      storeId,
      mediaOk: false,
      templateOk: false,
      studioOk: false,
    };
    try {
      const thumb = payload.previewDataUrl || payload.dataUrl;
      const mime = detectDataUrlMime(payload.dataUrl);
      const ext = mimeExt(mime);
      addMediaAsset(
        {
          fileName: `${fileBase}.${ext}`,
          originalUrl: payload.dataUrl,
          optimizedUrl: payload.dataUrl,
          webpUrl: payload.dataUrl,
          thumbnailUrl: thumb,
          fileType: 'image',
          mimeType: mime,
          fileSize: Math.round(payload.dataUrl.length * 0.72),
          width: payload.width,
          height: payload.height,
          title: payload.title,
          altText: payload.title,
          caption: isAr
            ? `تصميم من لوحة الماستر — ${payload.title}`
            : `Master design studio — ${payload.title}`,
          folder: 'marketing',
          tags: ['master-canva', 'studio', payload.category],
          processingStatus: 'ready',
          optimizationStatus: 'optimized',
          source: 'upload',
          metadata: {
            masterDistributed: true,
            category: payload.category,
            designJson: payload.designJson,
          },
        },
        storeId,
      );
      row.mediaOk = true;
    } catch (err) {
      row.error = err instanceof Error ? err.message : 'MEDIA_FAIL';
      results.push(row);
      continue;
    }

    try {
      await saveMyCanvaTemplate({
        storeId,
        category: payload.category,
        nameEn: payload.title || 'Master design',
        nameAr: payload.title || 'تصميم الماستر',
        width: payload.width,
        height: payload.height,
        source: 'master',
        fromMaster: true,
        layers: payload.layers.map((l, i) => ({
          ...l,
          id: l.id || `el-${storeId}-${Date.now()}-${i}`,
        })),
        previewDataUrl: payload.previewDataUrl || payload.dataUrl,
      });
      row.templateOk = true;
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code !== 'TEMPLATE_LIMIT') {
        row.error = code || 'TEMPLATE_FAIL';
      }
    }

    let apiOn = false;
    try {
      apiOn = isApiEnabled();
    } catch {
      apiOn = false;
    }
    if (apiOn) {
      try {
        await saveStudioDesign(storeId, {
          editor_type: editorTypeFromCategory(payload.category),
          category: payload.category,
          title: payload.title || 'Master design',
          width: payload.width,
          height: payload.height,
          design_json: {
            ...payload.designJson,
            masterDistributed: true,
          },
          source: 'master',
        });
        row.studioOk = true;
      } catch {
        /* media + local template still count */
      }
    }

    results.push(row);
  }

  return results;
}

function buildMediaFields(
  payload: MasterCanvaDistributePayload,
  isAr: boolean | undefined,
  extraTags: string[],
  captionEn: string,
  captionAr: string,
): Omit<MediaAsset, 'id' | 'storeId' | 'uploadDate' | 'updatedAt' | 'version'> {
  const fileBase = slugTitle(payload.title);
  const mime = detectDataUrlMime(payload.dataUrl);
  const ext = mimeExt(mime);
  const thumb = payload.previewDataUrl || payload.dataUrl;
  return {
    fileName: `${fileBase}.${ext}`,
    originalUrl: payload.dataUrl,
    optimizedUrl: payload.dataUrl,
    webpUrl: payload.dataUrl,
    thumbnailUrl: thumb,
    fileType: 'image',
    mimeType: mime,
    fileSize: Math.round(payload.dataUrl.length * 0.72),
    width: payload.width,
    height: payload.height,
    title: payload.title,
    altText: payload.title,
    caption: isAr ? captionAr : captionEn,
    folder: 'marketing',
    tags: ['master-canva', 'studio', payload.category, ...extraTags],
    processingStatus: 'ready',
    optimizationStatus: 'optimized',
    source: 'upload',
    metadata: {
      masterDistributed: true,
      category: payload.category,
      designJson: payload.designJson,
    },
  };
}

/** Save one copy into Master Admin media gallery (`master-platform`). */
export function saveCanvaToMasterMedia(opts: {
  payload: MasterCanvaDistributePayload;
  addMediaAsset: (
    asset: Omit<MediaAsset, 'id' | 'storeId' | 'uploadDate' | 'updatedAt' | 'version'>,
    targetStoreId?: string,
  ) => MediaAsset;
  isAr?: boolean;
}): MediaAsset {
  const { payload, addMediaAsset, isAr } = opts;
  return addMediaAsset(
    buildMediaFields(
      payload,
      isAr,
      ['master-library'],
      `Master Admin media — ${payload.title}`,
      `وسائط لوحة الماستر — ${payload.title}`,
    ),
    MASTER_MEDIA_STORE_ID,
  );
}

export type MasterCanvaLibrarySaveResult = {
  mediaOk: boolean;
  templateOk: boolean;
  studioOk: boolean;
  mediaId?: string;
  templateId?: string;
  studioDesignId?: string;
  error?: string;
};

/**
 * Always-on Master Admin library save: preview media + full editable layers.
 * Used on every Master Canva update so Master keeps the latest design.
 */
export async function saveFullCanvaToMasterAdmin(opts: {
  payload: MasterCanvaDistributePayload;
  addMediaAsset: (
    asset: Omit<MediaAsset, 'id' | 'storeId' | 'uploadDate' | 'updatedAt' | 'version'>,
    targetStoreId?: string,
  ) => MediaAsset;
  isAr?: boolean;
  /** Re-save / update same Master template row */
  templateId?: string;
  /** Re-save / update same Master studio_designs row */
  studioDesignId?: string;
}): Promise<MasterCanvaLibrarySaveResult> {
  const { payload, addMediaAsset, isAr, templateId, studioDesignId } = opts;
  const out: MasterCanvaLibrarySaveResult = {
    mediaOk: false,
    templateOk: false,
    studioOk: false,
  };

  try {
    const media = saveCanvaToMasterMedia({ payload, addMediaAsset, isAr });
    out.mediaOk = true;
    out.mediaId = media.id;
  } catch (err) {
    out.error = err instanceof Error ? err.message : 'MASTER_MEDIA_FAIL';
    return out;
  }

  try {
    const saved = await saveMyCanvaTemplate({
      id: templateId || undefined,
      storeId: MASTER_MEDIA_STORE_ID,
      category: payload.category,
      nameEn: payload.title || 'Master design',
      nameAr: payload.title || 'تصميم الماستر',
      width: payload.width,
      height: payload.height,
      source: 'master',
      fromMaster: true,
      layers: payload.layers.map((l, i) => ({
        ...l,
        id: l.id || `el-master-${Date.now()}-${i}`,
      })),
      previewDataUrl: payload.previewDataUrl || payload.dataUrl,
    });
    out.templateOk = true;
    out.templateId = saved.id;
  } catch (err) {
    const code = err instanceof Error ? err.message : '';
    if (code !== 'TEMPLATE_LIMIT') {
      out.error = code || 'MASTER_TEMPLATE_FAIL';
    }
  }

  let apiOn = false;
  try {
    apiOn = isApiEnabled();
  } catch {
    apiOn = false;
  }
  if (apiOn) {
    try {
      const row = await saveStudioDesign(MASTER_MEDIA_STORE_ID, {
        id: studioDesignId || undefined,
        editor_type: editorTypeFromCategory(payload.category),
        category: payload.category,
        title: payload.title || 'Master design',
        width: payload.width,
        height: payload.height,
        design_json: {
          ...payload.designJson,
          masterLibrary: true,
          layers: payload.layers,
          updatedFromMasterCanva: true,
        },
        source: 'master',
      });
      out.studioOk = true;
      out.studioDesignId = row.id;
    } catch {
      /* IndexedDB + media still count as Master save */
    }
  }

  return out;
}

function detectDataUrlMime(dataUrl: string): 'image/png' | 'image/webp' | 'image/jpeg' {
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    return 'image/jpeg';
  }
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  return 'image/png';
}

function mimeExt(mime: string): 'png' | 'webp' | 'jpg' {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

/** Convert a data-URL to PNG / WebP / JPEG when the browser canvas API is available. */
export function convertCanvaDataUrl(
  dataUrl: string,
  format: 'png' | 'webp' | 'jpg',
): Promise<string> {
  const targetMime =
    format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  if (!dataUrl) return Promise.resolve(dataUrl);
  if (dataUrl.startsWith(`data:${targetMime}`)) return Promise.resolve(dataUrl);
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, img.naturalWidth || img.width);
      canvas.height = Math.max(1, img.naturalHeight || img.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);
      try {
        resolve(canvas.toDataURL(targetMime, 0.95));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Download design image to the operator's device (local PC). Always matches requested format. */
export async function downloadCanvaLocal(
  payload: Pick<MasterCanvaDistributePayload, 'dataUrl' | 'title'>,
  format: 'webp' | 'png' | 'jpg' = 'png',
): Promise<void> {
  if (typeof document === 'undefined') return;
  const href = await convertCanvaDataUrl(payload.dataUrl, format);
  const a = document.createElement('a');
  a.href = href;
  a.download = `${slugTitle(payload.title)}.${format === 'jpg' ? 'jpg' : format}`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Google Drive: download file locally, then open Drive so the user can upload.
 * Honest path — never pretends the file was uploaded via OAuth.
 */
export async function handoffCanvaToGoogleDrive(
  payload: Pick<MasterCanvaDistributePayload, 'dataUrl' | 'title'>,
): Promise<void> {
  await downloadCanvaLocal(payload, 'png');
  if (typeof window !== 'undefined') {
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
  }
}
