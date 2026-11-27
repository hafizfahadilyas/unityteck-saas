/**
 * Seed already-imported data/pptx-studio-pack/*.json into store_studio_designs
 * for master-platform + every store (isolated).
 *
 *   npx tsx scripts/seed-pptx-studio-pack-db.ts
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PACK_DIR = path.resolve(ROOT, 'data/pptx-studio-pack');
const MASTER_ID = 'master-platform';
const FALLBACK_STORES = ['master-platform', 'store-1', 'store-coffee', 'store-bleco'];

function loadEnvFile(p: string): Record<string, string> {
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function editorTypeFromCategory(category: string): 'banner' | 'logo' | 'product_card' {
  if (category === 'logo') return 'logo';
  if (category === 'product') return 'product_card';
  return 'banner';
}

/** Stable short id — Arabic packKeys truncate badly at 64 chars and collide. */
function designRowId(storeId: string, packKey: string): string {
  const storePart = storeId.replace(/[^a-z0-9-]/gi, '').slice(0, 18) || 'store';
  let hash = 0;
  const key = String(packKey || 'pack');
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const h = hash.toString(36).padStart(8, '0').slice(0, 8);
  return `dsd-pptx-${storePart}-${h}`.slice(0, 64);
}

function compactDesignJson(pack: Record<string, unknown>) {
  const layers = Array.isArray(pack.layers) ? pack.layers : [];
  return {
    masterDistributed: true,
    masterLibrary: false,
    fromPptxPack: true,
    packKey: pack.packKey,
    previewDataUrl: pack.previewUrl || pack.previewDataUrl,
    layers,
    width: pack.width,
    height: pack.height,
    category: pack.category || 'social',
    source: 'pptx',
    updatedFromMasterCanva: true,
  };
}

async function main() {
  if (!fs.existsSync(path.join(PACK_DIR, 'index.json'))) {
    throw new Error('Pack missing — run: npx tsx scripts/import-pptx-pack-to-studio.ts');
  }
  const index = JSON.parse(fs.readFileSync(path.join(PACK_DIR, 'index.json'), 'utf8')) as {
    items: Array<{ packKey: string; file: string }>;
  };

  const env = {
    ...loadEnvFile(path.join(ROOT, '.env')),
    ...loadEnvFile(path.join(ROOT, 'apps/api/.env')),
  };
  const host = env.DB_HOST || env.MYSQL_HOST;
  const user = env.DB_USERNAME || env.DB_USER || env.MYSQL_USER;
  const password = env.DB_PASSWORD || env.MYSQL_PASSWORD || '';
  const database = env.DB_DATABASE || env.MYSQL_DATABASE;
  const port = Number(env.DB_PORT || 3306);
  if (!host || !user || !database) throw new Error('DB credentials missing');

  const mysql = require('mysql2/promise') as typeof import('mysql2/promise');
  const conn = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
    charset: 'utf8mb4',
    // large layer JSON with embedded images
    maxAllowedPacket: 64 * 1024 * 1024,
  });

  try {
    try {
      await conn.query('SET SESSION max_allowed_packet=67108864');
    } catch {
      /* hosting may lock this */
    }

    let stores = [...FALLBACK_STORES];
    try {
      const [rows] = await conn.query(
        `SELECT id FROM stores WHERE COALESCE(status,'active') IN ('active','live','') OR status IS NULL`,
      );
      const fromDb = (rows as Array<{ id: string }>).map((r) => String(r.id || '').trim()).filter(Boolean);
      if (fromDb.length) stores = [...new Set([MASTER_ID, ...fromDb])];
    } catch (err) {
      console.warn('stores query failed, using fallback', err instanceof Error ? err.message : err);
    }
    console.log(`Seeding ${index.items.length} packs × ${stores.length} stores`);

    // Clear prior colliding truncated ids from first seed attempt
    try {
      const [del] = await conn.query(`DELETE FROM store_studio_designs WHERE id LIKE 'dsd-pptx-%'`);
      console.log('Cleared old dsd-pptx rows', (del as { affectedRows?: number })?.affectedRows ?? del);
    } catch (err) {
      console.warn('clear old rows failed', err instanceof Error ? err.message : err);
    }

    const result: Array<{ storeId: string; id: string; ok: boolean; error?: string; kb?: number }> = [];
    let ok = 0;
    let fail = 0;
    const seenIds = new Set<string>();

    for (const storeId of stores) {
      for (const item of index.items) {
        const full = path.join(PACK_DIR, item.file);
        if (!fs.existsSync(full)) {
          fail += 1;
          result.push({ storeId, id: item.packKey, ok: false, error: 'FILE_MISSING' });
          continue;
        }
        const pack = JSON.parse(fs.readFileSync(full, 'utf8')) as Record<string, unknown>;
        const id = designRowId(storeId, String(pack.packKey || item.packKey));
        if (seenIds.has(id)) {
          fail += 1;
          result.push({ storeId, id, ok: false, error: 'ID_COLLISION' });
          console.error(`FAIL ${storeId} · ${item.packKey}: ID_COLLISION ${id}`);
          continue;
        }
        seenIds.add(id);
        const designJson = compactDesignJson(pack);
        if (storeId === MASTER_ID) {
          designJson.masterLibrary = true;
          designJson.masterDistributed = false;
        }
        const payload = JSON.stringify(designJson);
        const kb = Math.round(Buffer.byteLength(payload) / 1024);
        try {
          await conn.execute(
            `INSERT INTO store_studio_designs
              (id, store_id, editor_type, category, title, width, height, design_json, preview_media_id, source, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE
               title=VALUES(title),
               width=VALUES(width),
               height=VALUES(height),
               design_json=VALUES(design_json),
               category=VALUES(category),
               editor_type=VALUES(editor_type),
               source=VALUES(source),
               updated_at=NOW()`,
            [
              id,
              storeId,
              editorTypeFromCategory(String(pack.category || 'social')),
              String(pack.category || 'social').slice(0, 32),
              String(pack.name || pack.nameEn || pack.packKey || 'Template').slice(0, 255),
              Number(pack.width) || 1080,
              Number(pack.height) || 1080,
              payload,
              'master',
            ],
          );
          ok += 1;
          result.push({ storeId, id, ok: true, kb });
          console.log(`OK  ${storeId} · ${item.packKey} · ${kb}KB`);
        } catch (err) {
          fail += 1;
          const msg = err instanceof Error ? err.message : String(err);
          result.push({ storeId, id, ok: false, error: msg, kb });
          console.error(`FAIL ${storeId} · ${item.packKey}: ${msg}`);
        }
      }
    }

    fs.writeFileSync(
      path.join(PACK_DIR, 'seed-result.json'),
      JSON.stringify({ ok, fail, stores, at: new Date().toISOString(), result }, null, 2),
    );
    console.log(`\nDone. ok=${ok} fail=${fail}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
