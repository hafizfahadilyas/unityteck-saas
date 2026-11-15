/**
 * Master Admin → push Canva design into selected stores' Media + Canva library.
 * Each target gets its own store_id row (never shared cross-tenant blobs).
 */

import type { MediaAsset } from '../types/media';
import type { CanvaTemplateCategory } from '../data/ksaCanvaTemplates';
import type { ImportedStudioLayer } from './canvaPsdImport';
import { saveMyCanvaTemplate } from './canvaMyTemplates';
import { saveStudioDesign, type StudioEditorType } from './storeStudioDesigns';
import { isApiEnabled } from '../api/client';

export type MasterCanvaDistributePayload = {
  dataUrl: string;
  title: string;
  width: number;
  height: number;
  category: CanvaTemplateCategory;
  layers: ImportedStudioLayer[];
  designJson: Record<string, unknown>;
  source?: 'psd' | 'image' | 'studio' | 'master';
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
      addMediaAsset(
        {
          fileName: `${fileBase}.webp`,
          originalUrl: payload.dataUrl,
          optimizedUrl: payload.dataUrl,
          webpUrl: payload.dataUrl,
          thumbnailUrl: payload.dataUrl,
          fileType: 'image',
          mimeType: 'image/webp',
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
        previewDataUrl: payload.dataUrl,
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
