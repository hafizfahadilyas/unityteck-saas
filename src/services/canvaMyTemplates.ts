/**
 * Store-scoped "My Templates" for Canva studio uploads (PSD / image → layers).
 * IndexedDB primary; never share across store_id.
 */

import type { CanvaTemplateCategory } from '../data/ksaCanvaTemplates';
import type { ImportedStudioLayer } from './canvaPsdImport';

const DB_NAME = 'unityteck_canva_my_templates';
const DB_VERSION = 1;
const STORE = 'templates';
const MAX_PER_STORE = 40;
/** Extra room for Master-distributed PPTX packs (editable, store_id isolated) */
const MAX_PER_STORE_WITH_MASTER_PACKS = 120;
/** Master Admin Canva library (`master-platform`) — higher retention for platform designs */
const MAX_MASTER_LIBRARY = 200;
const MASTER_LIBRARY_STORE_ID = 'master-platform';

export interface CanvaMyTemplate {
  id: string;
  storeId: string;
  category: CanvaTemplateCategory;
  nameEn: string;
  nameAr: string;
  width: number;
  height: number;
  /** studio/psd/image/pptx = merchant; master = pushed from Master Admin */
  source: 'psd' | 'image' | 'pptx' | 'studio' | 'master';
  /** True when Master Admin distributed this design to the store */
  fromMaster?: boolean;
  layers: ImportedStudioLayer[];
  /** Known layer count when layers[] is still empty (lean stub) */
  layerCount?: number;
  previewDataUrl?: string;
  createdAt: string;
  updatedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('INDEXEDDB_UNAVAILABLE'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error || new Error('IDB_OPEN_FAIL'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('storeId', 'storeId', { unique: false });
        os.createIndex('storeId_category', ['storeId', 'category'], { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IDB_TX_FAIL'));
    tx.onabort = () => reject(tx.error || new Error('IDB_TX_ABORT'));
  });
}

export async function getMyCanvaTemplate(
  storeId: string,
  id: string,
): Promise<CanvaMyTemplate | null> {
  if (!storeId || !id) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const os = tx.objectStore(STORE);
    const item = await new Promise<CanvaMyTemplate | undefined>((resolve, reject) => {
      const req = os.get(id);
      req.onsuccess = () => resolve(req.result as CanvaMyTemplate | undefined);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    if (item && item.storeId === storeId) {
      return item;
    }
    return null;
  } catch {
    return null;
  }
}

export async function listMyCanvaTemplates(
  storeId: string,
  category?: CanvaTemplateCategory | 'all',
  opts?: { lean?: boolean },
): Promise<CanvaMyTemplate[]> {
  if (!storeId) return [];
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const os = tx.objectStore(STORE);
    const idx = os.index('storeId');
    const rows = await new Promise<CanvaMyTemplate[]>((resolve, reject) => {
      const req = idx.getAll(storeId);
      req.onsuccess = () => resolve((req.result || []) as CanvaMyTemplate[]);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    let list = rows.filter((r) => r.storeId === storeId);
    if (category && category !== 'all') {
      list = list.filter((r) => r.category === category);
    }
    const isLean = opts?.lean ?? true;
    if (isLean) {
      list = list.map((r) => ({
        ...r,
        layerCount:
          typeof r.layerCount === 'number' && r.layerCount > 0
            ? r.layerCount
            : (r.layers?.length || 0),
        layers: [], // Strip heavy layer JSON from listing so memory stays fast & lean
      }));
    }
    return list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch {
    return [];
  }
}

export async function saveMyCanvaTemplate(
  input: Omit<CanvaMyTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<CanvaMyTemplate> {
  if (!input.storeId) throw new Error('STORE_REQUIRED');

  const existing = await listMyCanvaTemplates(input.storeId);
  const idStr = String(input.id || '');
  const fromMasterPack =
    Boolean(input.fromMaster) ||
    input.source === 'master' ||
    idStr.startsWith('mytpl-pptx-') ||
    idStr.startsWith('dsd-pptx-');
  const limit =
    input.storeId === MASTER_LIBRARY_STORE_ID
      ? MAX_MASTER_LIBRARY
      : fromMasterPack
        ? MAX_PER_STORE_WITH_MASTER_PACKS
        : MAX_PER_STORE;
  // Updating an existing row never counts against create limit
  if (!input.id && existing.length >= limit) {
    throw new Error('TEMPLATE_LIMIT');
  }
  if (input.id && !existing.some((e) => e.id === input.id) && existing.length >= limit) {
    throw new Error('TEMPLATE_LIMIT');
  }

  const now = new Date().toISOString();
  const existingFull = input.id ? await getMyCanvaTemplate(input.storeId, input.id) : null;
  const layers = (input.layers && input.layers.length > 0) ? input.layers : (existingFull?.layers || []);
  const row: CanvaMyTemplate = {
    id: input.id || `mytpl-${input.storeId}-${Date.now()}`,
    storeId: input.storeId,
    category: input.category,
    nameEn: input.nameEn || 'My template',
    nameAr: input.nameAr || 'قالبي',
    width: input.width,
    height: input.height,
    source: input.source,
    fromMaster: Boolean(input.fromMaster) || input.source === 'master',
    layers,
    layerCount:
      typeof input.layerCount === 'number' && input.layerCount > 0
        ? input.layerCount
        : layers.length || undefined,
    previewDataUrl: input.previewDataUrl ?? existingFull?.previewDataUrl,
    createdAt: existing.find((e) => e.id === input.id)?.createdAt || now,
    updatedAt: now,
  };

  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(row);
  await txDone(tx);
  db.close();
  return row;
}

export async function saveManyMyCanvaTemplates(
  storeId: string,
  inputs: Array<Omit<CanvaMyTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id: string }>,
): Promise<void> {
  if (!storeId || inputs.length === 0) return;
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);
  const now = new Date().toISOString();
  for (const input of inputs) {
    const row: CanvaMyTemplate = {
      id: input.id,
      storeId,
      category: input.category,
      nameEn: input.nameEn || 'My template',
      nameAr: input.nameAr || 'قالبي',
      width: input.width,
      height: input.height,
      source: input.source,
      fromMaster: Boolean(input.fromMaster) || input.source === 'master',
      layers: input.layers || [],
      layerCount:
        typeof input.layerCount === 'number' && input.layerCount > 0
          ? input.layerCount
          : (input.layers || []).length || undefined,
      previewDataUrl: input.previewDataUrl,
      createdAt: now,
      updatedAt: now,
    };
    os.put(row);
  }
  await txDone(tx);
  db.close();
}

export async function deleteMyCanvaTemplate(storeId: string, templateId: string): Promise<void> {
  if (!storeId || !templateId) return;
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);
  const existing = await new Promise<CanvaMyTemplate | undefined>((resolve, reject) => {
    const req = os.get(templateId);
    req.onsuccess = () => resolve(req.result as CanvaMyTemplate | undefined);
    req.onerror = () => reject(req.error);
  });
  if (existing && existing.storeId === storeId) {
    os.delete(templateId);
  }
  await txDone(tx);
  db.close();
}

export function myTemplateToDesignPayload(tpl: CanvaMyTemplate): {
  width: number;
  height: number;
  name: string;
  layers: ImportedStudioLayer[];
  previewDataUrl?: string;
} {
  return {
    width: tpl.width,
    height: tpl.height,
    name: tpl.nameEn,
    layers: tpl.layers.map((l, i) => ({
      ...l,
      id: l.id || `el-${Date.now()}-${i}`,
    })),
    previewDataUrl: tpl.previewDataUrl,
  };
}
