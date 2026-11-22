/**
 * Store-scoped Design Studio favorites (My Templates ids).
 * localStorage only — never shared across store_id.
 */

const PREFIX = 'unityteck_canva_favorites_v1:';

function keyFor(storeId: string): string {
  return `${PREFIX}${String(storeId || '').trim()}`;
}

function readSet(storeId: string): Set<string> {
  if (!storeId || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(keyFor(storeId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeSet(storeId: string, ids: Set<string>): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(keyFor(storeId), JSON.stringify([...ids]));
  } catch {
    /* quota / private mode — ignore */
  }
}

export function listCanvaFavoriteIds(storeId: string): string[] {
  return [...readSet(storeId)];
}

export function isCanvaFavorite(storeId: string, templateId: string): boolean {
  if (!storeId || !templateId) return false;
  return readSet(storeId).has(templateId);
}

export function toggleCanvaFavorite(storeId: string, templateId: string): boolean {
  if (!storeId || !templateId) return false;
  const set = readSet(storeId);
  if (set.has(templateId)) {
    set.delete(templateId);
    writeSet(storeId, set);
    return false;
  }
  set.add(templateId);
  writeSet(storeId, set);
  return true;
}

export function setCanvaFavorite(storeId: string, templateId: string, on: boolean): void {
  if (!storeId || !templateId) return;
  const set = readSet(storeId);
  if (on) set.add(templateId);
  else set.delete(templateId);
  writeSet(storeId, set);
}
