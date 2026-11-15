/**
 * Master Canva distribute — store_id isolation smoke (no vitest).
 * Run: npx tsx src/services/masterCanvaDistribute.test.ts
 */
import {
  distributeCanvaToStores,
  MASTER_MEDIA_STORE_ID,
  saveCanvaToMasterMedia,
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

  console.log('masterCanvaDistribute.test.ts OK');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
