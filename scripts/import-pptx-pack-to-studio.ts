/**
 * Bulk import PPTX → editable Design Studio packs (full layers via canvaPptImport).
 *
 *   npx tsx scripts/import-pptx-pack-to-studio.ts
 *   npx tsx scripts/import-pptx-pack-to-studio.ts --dir=D:/sueman/pptx --seed-db
 *   npx tsx scripts/import-pptx-pack-to-studio.ts --sample=2
 */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { importPptxFile } from '../src/services/canvaPptImport';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
  }),
);

const PPTX_DIR = path.resolve(String(args.dir || 'D:/sueman/pptx'));
const OUT_DIR = path.resolve(ROOT, String(args.out || 'data/pptx-studio-pack'));
const PUBLIC_DIR = path.resolve(ROOT, 'public/pptx-studio-pack');
const SAMPLE_N = args.sample ? Number(args.sample) : 0;
const SEED_DB = args['seed-db'] === 'true' || args['seed-db'] === '';
/** Default off — full packs are huge (~200MB) and must not land in Vite `public/` / deploy. */
const COPY_PUBLIC = args['copy-public'] === 'true';
const STORE_IDS = String(args.stores || 'master-platform,store-1,store-coffee,store-bleco')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MASTER_ID = 'master-platform';

function slugKey(title: string): string {
  return (
    String(title || 'design')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'design'
  );
}

function editorTypeFromCategory(category: string): 'banner' | 'logo' | 'product_card' {
  if (category === 'logo') return 'logo';
  if (category === 'product') return 'product_card';
  return 'banner';
}

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

type PackDesign = {
  packKey: string;
  name: string;
  nameEn: string;
  nameAr: string;
  width: number;
  height: number;
  category: string;
  source: 'pptx';
  layers: unknown[];
  previewDataUrl?: string;
  layerCount: number;
  importedAt: string;
};

async function seedMysql(designs: PackDesign[]) {
  const env = {
    ...loadEnvFile(path.join(ROOT, '.env')),
    ...loadEnvFile(path.join(ROOT, 'apps/api/.env')),
  };
  const host = env.DB_HOST || env.MYSQL_HOST;
  const user = env.DB_USERNAME || env.DB_USER || env.MYSQL_USER;
  const password = env.DB_PASSWORD || env.MYSQL_PASSWORD || '';
  const database = env.DB_DATABASE || env.MYSQL_DATABASE;
  const port = Number(env.DB_PORT || 3306);
  if (!host || !user || !database) {
    throw new Error('DB credentials missing in .env / apps/api/.env');
  }

  let mysql: typeof import('mysql2/promise');
  try {
    mysql = require('mysql2/promise');
  } catch {
    throw new Error('mysql2 not installed — run: npm i mysql2');
  }

  const conn = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
    charset: 'utf8mb4',
  });

  const results: Array<{ storeId: string; id: string; title: string; layers: number }> = [];
  try {
    // Prefer live stores table + always include master-platform
    let targetStores = [...STORE_IDS];
    try {
      const [storeRows] = await conn.query(
        `SELECT id FROM stores WHERE COALESCE(status,'active') IN ('active','live','') OR status IS NULL`,
      );
      const fromDb = (storeRows as Array<{ id: string }>)
        .map((r) => String(r.id || '').trim())
        .filter(Boolean);
      if (fromDb.length) {
        targetStores = [...new Set([MASTER_ID, ...fromDb, ...STORE_IDS])];
      }
    } catch {
      /* stores table optional shape */
    }
    console.log(`DB target stores (${targetStores.length}): ${targetStores.join(', ')}`);

    for (const storeId of targetStores) {
      for (const d of designs) {
        // Short hash — full Arabic packKey truncates at 64 and collides
        let hash = 0;
        for (let i = 0; i < d.packKey.length; i += 1) {
          hash = (hash * 31 + d.packKey.charCodeAt(i)) >>> 0;
        }
        const h = hash.toString(36).padStart(8, '0').slice(0, 8);
        const storePart = storeId.replace(/[^a-z0-9-]/gi, '').slice(0, 18) || 'store';
        const id = `dsd-pptx-${storePart}-${h}`.slice(0, 64);
        const designJson = {
          masterDistributed: storeId !== MASTER_ID,
          masterLibrary: storeId === MASTER_ID,
          fromPptxPack: true,
          packKey: d.packKey,
          layers: d.layers,
          width: d.width,
          height: d.height,
          category: d.category,
          source: 'pptx',
          updatedFromMasterCanva: true,
        };
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
            editorTypeFromCategory(d.category),
            d.category,
            d.name.slice(0, 255),
            d.width,
            d.height,
            JSON.stringify(designJson),
            'master',
          ],
        );
        results.push({ storeId, id, title: d.name, layers: d.layerCount });
      }
    }
  } finally {
    await conn.end();
  }
  return results;
}

async function main() {
  if (!fs.existsSync(PPTX_DIR)) {
    console.error('PPTX dir missing:', PPTX_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let files = fs
    .readdirSync(PPTX_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pptx'))
    .sort((a, b) => a.localeCompare(b, 'ar'));
  if (SAMPLE_N > 0) files = files.slice(0, SAMPLE_N);

  console.log(`Importing ${files.length} PPTX from ${PPTX_DIR}`);
  const designs: PackDesign[] = [];
  const report: Array<Record<string, unknown>> = [];

  for (const file of files) {
    const full = path.join(PPTX_DIR, file);
    const buf = fs.readFileSync(full);
    try {
      const blob = new File([buf], file, {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const imported = await importPptxFile(blob);
      const packKey = slugKey(imported.name);
      const pack: PackDesign = {
        packKey,
        name: imported.name,
        nameEn: imported.name,
        nameAr: imported.name,
        width: imported.width,
        height: imported.height,
        category: imported.categoryHint || 'social',
        source: 'pptx',
        layers: imported.layers,
        previewDataUrl: imported.previewDataUrl,
        layerCount: imported.layers.length,
        importedAt: new Date().toISOString(),
      };
      designs.push(pack);
      fs.writeFileSync(path.join(OUT_DIR, `${packKey}.json`), JSON.stringify(pack));
      const bytes = Buffer.byteLength(JSON.stringify(pack.layers));
      report.push({
        file,
        ok: true,
        layers: pack.layerCount,
        w: pack.width,
        h: pack.height,
        category: pack.category,
        jsonKB: Math.round(bytes / 1024),
      });
      console.log(
        `OK  ${file} → ${pack.layerCount} layers · ${pack.width}x${pack.height} · ${pack.category}`,
      );
    } catch (err) {
      report.push({
        file,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`FAIL ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  const index = {
    version: 1,
    packKeys: designs.map((d) => d.packKey),
    items: designs.map((d) => ({
      packKey: d.packKey,
      nameEn: d.name,
      nameAr: d.name,
      width: d.width,
      height: d.height,
      category: d.category,
      layerCount: d.layerCount,
      file: `${d.packKey}.json`,
    })),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      {
        sourceDir: PPTX_DIR,
        count: designs.length,
        failed: report.filter((r) => !r.ok).length,
        stores: STORE_IDS,
        designs: designs.map((d) => ({
          packKey: d.packKey,
          name: d.name,
          width: d.width,
          height: d.height,
          category: d.category,
          layerCount: d.layerCount,
        })),
        report,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  if (COPY_PUBLIC) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'index.json'), JSON.stringify(index, null, 2));
    for (const d of designs) {
      fs.writeFileSync(path.join(PUBLIC_DIR, `${d.packKey}.json`), JSON.stringify(d));
    }
    console.log(`Public pack copied → ${PUBLIC_DIR}`);
  }

  console.log(`\nPack written: ${OUT_DIR} (${designs.length} ok, ${report.filter((r) => !r.ok).length} fail)`);

  if (SEED_DB) {
    console.log(`Seeding MySQL for stores: ${STORE_IDS.join(', ')}`);
    const seeded = await seedMysql(designs);
    console.log(`DB rows upserted: ${seeded.length}`);
    fs.writeFileSync(path.join(OUT_DIR, 'seed-result.json'), JSON.stringify(seeded, null, 2));
  } else {
    console.log('Skip DB seed (pass --seed-db to write store_studio_designs).');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
