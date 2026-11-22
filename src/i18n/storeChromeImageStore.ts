/**
 * Durable per-store chrome wallpaper / sidebar bg images (IndexedDB).
 * Blob URLs die on reload/revoke — chrome-idb:// refs stay and rehydrate.
 * Keys always include store_id. Never share across tenants.
 */

export type ChromeImageField = 'shellWallpaper' | 'bgImage';

const DB_NAME = 'unityteck_store_chrome_images';
const DB_VERSION = 1;
const STORE = 'images';
const IDB_SCHEME = 'chrome-idb://';

type ChromeImageRow = {
  id: string;
  storeId: string;
  field: ChromeImageField;
  blob: Blob;
  mime: string;
  updatedAt: string;
};

/** Live object URLs resolved from IDB (sync paint). */
const liveObjectUrls = new Map<string, string>();

function rowId(storeId: string, field: ChromeImageField): string {
  return `${storeId}::${field}`;
}

export function isChromeIdbUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().startsWith(IDB_SCHEME);
}

export function chromeIdbUrl(storeId: string, field: ChromeImageField, version?: number | string): string {
  const v = version ?? Date.now();
  return `${IDB_SCHEME}${encodeURIComponent(storeId)}/${field}?v=${v}`;
}

export function parseChromeIdbUrl(
  url: string,
): { storeId: string; field: ChromeImageField } | null {
  const trimmed = url.trim();
  if (!trimmed.startsWith(IDB_SCHEME)) return null;
  const rest = trimmed.slice(IDB_SCHEME.length);
  const [path] = rest.split('?');
  const slash = path.indexOf('/');
  if (slash <= 0) return null;
  const storeId = decodeURIComponent(path.slice(0, slash));
  const field = path.slice(slash + 1) as ChromeImageField;
  if (field !== 'shellWallpaper' && field !== 'bgImage') return null;
  if (!storeId) return null;
  return { storeId, field };
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

/** Delay revoke so CSS can switch away from the old blob before it dies (stops flicker/remove). */
function scheduleRevokeObjectUrl(url: string): void {
  if (typeof window === 'undefined') {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    return;
  }
  // Longer delay so CSS/paint can switch off the old blob before revoke (stops BG flash-off)
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, 4000);
}

function rememberLiveUrl(idbUrl: string, objectUrl: string): void {
  const prev = liveObjectUrls.get(idbUrl);
  if (prev && prev !== objectUrl) {
    scheduleRevokeObjectUrl(prev);
  }
  // Also clear older versions of the same store/field
  const parsed = parseChromeIdbUrl(idbUrl);
  if (parsed) {
    for (const [key, val] of liveObjectUrls) {
      if (key === idbUrl) continue;
      const other = parseChromeIdbUrl(key);
      if (other && other.storeId === parsed.storeId && other.field === parsed.field) {
        liveObjectUrls.delete(key);
        scheduleRevokeObjectUrl(val);
      }
    }
  }
  liveObjectUrls.set(idbUrl, objectUrl);
}

/** Sync resolve for CSS paint — returns object URL if already hydrated. */
export function resolveChromeImageUrlSync(url: string): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (!isChromeIdbUrl(trimmed)) return trimmed;
  return liveObjectUrls.get(trimmed) || '';
}

/** Raw blob for API sync (chrome-idb → Hostinger media). */
export async function getChromeImageBlob(
  storeId: string,
  field: ChromeImageField,
): Promise<Blob | null> {
  if (!storeId) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const row = await new Promise<ChromeImageRow | undefined>((resolve, reject) => {
      const req = tx.objectStore(STORE).get(rowId(storeId, field));
      req.onsuccess = () => resolve(req.result as ChromeImageRow | undefined);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    return row?.blob || null;
  } catch {
    return null;
  }
}

export async function putChromeImage(
  storeId: string,
  field: ChromeImageField,
  blob: Blob,
): Promise<string> {
  if (!storeId || !blob) return '';
  const id = rowId(storeId, field);
  const updatedAt = new Date().toISOString();
  const row: ChromeImageRow = {
    id,
    storeId,
    field,
    blob,
    mime: blob.type || 'image/webp',
    updatedAt,
  };
  const db = await openDb();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put(row);
  await txDone(tx);
  db.close();

  const idbUrl = chromeIdbUrl(storeId, field, Date.parse(updatedAt) || Date.now());
  const objectUrl = URL.createObjectURL(blob);
  rememberLiveUrl(idbUrl, objectUrl);
  return idbUrl;
}

export async function deleteChromeImage(storeId: string, field: ChromeImageField): Promise<void> {
  if (!storeId) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(rowId(storeId, field));
    await txDone(tx);
    db.close();
  } catch {
    /* ignore */
  }
  for (const [key, val] of [...liveObjectUrls.entries()]) {
    const parsed = parseChromeIdbUrl(key);
    if (parsed && parsed.storeId === storeId && parsed.field === field) {
      liveObjectUrls.delete(key);
      scheduleRevokeObjectUrl(val);
    }
  }
}

/** Hydrate IDB blob → object URL for a chrome-idb:// ref (or latest row for field). */
export async function hydrateChromeImageUrl(
  storeId: string,
  field: ChromeImageField,
  preferredUrl?: string,
): Promise<string> {
  if (!storeId) return '';
  try {
    if (preferredUrl && isChromeIdbUrl(preferredUrl)) {
      const cached = liveObjectUrls.get(preferredUrl.trim());
      if (cached) return preferredUrl.trim();
    }
    const db = await openDb();
    const tx = db.transaction(STORE, 'readonly');
    const row = await new Promise<ChromeImageRow | undefined>((resolve, reject) => {
      const req = tx.objectStore(STORE).get(rowId(storeId, field));
      req.onsuccess = () => resolve(req.result as ChromeImageRow | undefined);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    db.close();
    if (!row?.blob) return '';
    const idbUrl =
      preferredUrl && isChromeIdbUrl(preferredUrl)
        ? preferredUrl.trim()
        : chromeIdbUrl(storeId, field, Date.parse(row.updatedAt) || Date.now());
    const objectUrl = URL.createObjectURL(row.blob);
    rememberLiveUrl(idbUrl, objectUrl);
    return idbUrl;
  } catch {
    return '';
  }
}

/**
 * Ensure chrome-idb:// refs are live-paintable.
 * When `restoreMissingShell` is true and URL is empty, restore latest IDB shell / sidebar images
 * (used after cache wipe races — not after an intentional clear).
 */
export async function hydrateStoreChromeImages(
  storeId: string,
  chrome: { shellWallpaper?: string; bgImage?: string },
  opts?: { restoreMissingShell?: boolean },
): Promise<{ shellWallpaper: string; bgImage: string }> {
  let shellWallpaper = (chrome.shellWallpaper || '').trim();
  let bgImage = (chrome.bgImage || '').trim();

  if (isChromeIdbUrl(shellWallpaper)) {
    const hydrated = await hydrateChromeImageUrl(storeId, 'shellWallpaper', shellWallpaper);
    if (hydrated) shellWallpaper = hydrated;
  } else if (!shellWallpaper && opts?.restoreMissingShell) {
    const hydrated = await hydrateChromeImageUrl(storeId, 'shellWallpaper');
    if (hydrated) shellWallpaper = hydrated;
  }

  if (isChromeIdbUrl(bgImage)) {
    const hydrated = await hydrateChromeImageUrl(storeId, 'bgImage', bgImage);
    if (hydrated) bgImage = hydrated;
  } else if (!bgImage && opts?.restoreMissingShell) {
    const hydrated = await hydrateChromeImageUrl(storeId, 'bgImage');
    if (hydrated) bgImage = hydrated;
  }

  return { shellWallpaper, bgImage };
}
