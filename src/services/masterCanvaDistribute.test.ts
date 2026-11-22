/**
 * Master Canva distribute — store_id isolation smoke (no vitest).
 * Run: npx tsx src/services/masterCanvaDistribute.test.ts
 */
import {
  convertCanvaDataUrl,
  distributeCanvaToStores,
  MASTER_MEDIA_STORE_ID,
  saveCanvaToMasterMedia,
  saveFullCanvaToMasterAdmin,
} from './masterCanvaDistribute';
import type { MediaAsset } from '../types/media';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function run() {
  const calls: string[] = [];
  const titles: string[] = [];
  const addMediaAsset = (
    asset: Omit<MediaAsset, 'id' | 'storeId' | 'uploadDate' | 'updatedAt' | 'version'>,
    targetStoreId?: string,
  ): MediaAsset => {
    calls.push(String(targetStoreId));
    titles.push(String(asset.title || ''));
    return {
      ...asset,
      id: `med-${targetStoreId}`,
      storeId: targetStoreId || 'missing',
      uploadDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      processingStatus: 'ready',
      optimizationStatus: 'optimized',
      source: 'upload',
    };
  };

  const results = await distributeCanvaToStores({
    storeIds: ['store-a', 'store-b', 'store-a'],
    payload: {
      dataUrl: 'data:image/webp;base64,AAA',
      title: 'KSA Banner',
      width: 1080,
      height: 1080,
      category: 'banner',
      layers: [
        {
          id: 'el-1',
          type: 'headline',
          text: 'Offer',
          x: 100,
          y: 100,
          width: 200,
          height: 40,
          fontSize: 32,
          fontColor: '#0f172a',
        },
      ],
      designJson: { backdrop: 'soft-ivory' },
      source: 'studio',
    },
    addMediaAsset,
    isAr: false,
  });

  assert(calls.length === 2, `expected 2 unique stores, got ${calls.join(',')}`);
  assert(calls[0] === 'store-a' && calls[1] === 'store-b', 'order + isolation');
  assert(results.length === 2, 'deduped results length');
  assert(results.every((r) => r.mediaOk), 'mediaOk for all selected stores');
  assert(titles.every((t) => t === 'KSA Banner'), 'same design title per store copy');
  assert(results[0].storeId === 'store-a' && results[1].storeId === 'store-b', 'result store ids');

  // IndexedDB may be unavailable in Node — templateOk optional here
  console.log(
    'templateOk notes:',
    results.map((r) => `${r.storeId}:${r.templateOk ? 'yes' : r.error || 'skip'}`).join(' '),
  );

  const empty = await distributeCanvaToStores({
    storeIds: ['', ''],
    payload: {
      dataUrl: 'data:image/webp;base64,AAA',
      title: 'Empty',
      width: 100,
      height: 100,
      category: 'social',
      layers: [],
      designJson: {},
    },
    addMediaAsset: () => {
      throw new Error('should not run');
    },
  });
  assert(empty.length === 0, 'empty store ids skipped');

  let masterTarget = '';
  const masterAsset = saveCanvaToMasterMedia({
    payload: {
      dataUrl: 'data:image/webp;base64,AAA',
      title: 'Master Lib',
      width: 800,
      height: 800,
      category: 'logo',
      layers: [],
      designJson: {},
    },
    addMediaAsset: (asset, targetStoreId) => {
      masterTarget = String(targetStoreId);
      return {
        ...asset,
        id: 'med-master',
        storeId: targetStoreId || '',
        uploadDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        processingStatus: 'ready',
        optimizationStatus: 'optimized',
        source: 'upload',
      };
    },
    isAr: true,
  });
  assert(masterTarget === MASTER_MEDIA_STORE_ID, 'master media uses reserved store id');
  assert(masterAsset.storeId === MASTER_MEDIA_STORE_ID, 'asset storeId = master-platform');
  assert(
    Array.isArray(masterAsset.tags) && masterAsset.tags.includes('master-library'),
    'master-library tag',
  );

  const full = await saveFullCanvaToMasterAdmin({
    payload: {
      dataUrl: 'data:image/webp;base64,BBB',
      title: 'Master Full Update',
      width: 1080,
      height: 1080,
      category: 'banner',
      layers: [
        {
          id: 'el-m1',
          type: 'headline',
          text: 'Master',
          x: 50,
          y: 50,
          width: 120,
          height: 40,
          fontSize: 28,
          fontColor: '#111',
        },
      ],
      designJson: { backdrop: 'custom' },
      source: 'studio',
    },
    addMediaAsset: (asset, targetStoreId) => ({
      ...asset,
      id: 'med-master-full',
      storeId: targetStoreId || '',
      uploadDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      processingStatus: 'ready',
      optimizationStatus: 'optimized',
      source: 'upload',
    }),
    isAr: false,
  });
  assert(full.mediaOk === true, 'full master save mediaOk');
  assert(full.mediaId === 'med-master-full', 'full master media id');
  // templateOk depends on IndexedDB — optional in Node
  console.log('full master templateOk:', full.templateOk, full.error || 'ok');

  // Export convert: already-PNG stays PNG (no browser Image needed)
  const pngIn = 'data:image/png;base64,iVBORw0KGgo=';
  const pngOut = await convertCanvaDataUrl(pngIn, 'png');
  assert(pngOut === pngIn, 'PNG export passthrough');
  const webpIn = 'data:image/webp;base64,UklGRg==';
  const webpSame = await convertCanvaDataUrl(webpIn, 'webp');
  assert(webpSame === webpIn, 'WebP export passthrough');

  // PNG payload → store media uses .png mime (import/export parity)
  const mimeCalls: string[] = [];
  await distributeCanvaToStores({
    storeIds: ['store-png'],
    payload: {
      dataUrl: pngIn,
      previewDataUrl: pngIn,
      title: 'PNG Export',
      width: 100,
      height: 100,
      category: 'banner',
      layers: [],
      designJson: {},
    },
    addMediaAsset: (asset, targetStoreId) => {
      mimeCalls.push(`${asset.mimeType}|${asset.fileName}|${targetStoreId}`);
      return {
        ...asset,
        id: 'med-png',
        storeId: targetStoreId || '',
        uploadDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        processingStatus: 'ready',
        optimizationStatus: 'optimized',
        source: 'upload',
      };
    },
  });
  assert(
    mimeCalls[0]?.startsWith('image/png|png-export.png|store-png'),
    `expected png mime/file, got ${mimeCalls[0]}`,
  );

  console.log('masterCanvaDistribute.test.ts OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
