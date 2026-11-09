/**
 * Seed Saudi default policy pages onto live Hostinger SQLite gateway.
 * Usage: node scripts/seed-live-store-pages.mjs [storeId] [baseUrl]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const storeId = process.argv[2] || 'store-coffee';
const baseUrl = (process.argv[3] || 'https://mieraf-ksa.com/api').replace(/\/$/, '');

const src = fs.readFileSync(path.join(root, 'src/services/storePagesService.ts'), 'utf8');
const marker = 'export const MASTER_DEFAULT_PAGES';
const start = src.indexOf(marker);
if (start < 0) throw new Error('MASTER_DEFAULT_PAGES not found');
const arrStart = src.indexOf('= [', start);
if (arrStart < 0) throw new Error('MASTER_DEFAULT_PAGES array not found');
const openBracket = arrStart + 2; // points at '['
let depth = 0;
let end = openBracket;
for (let i = openBracket; i < src.length; i++) {
  const ch = src[i];
  if (ch === '[') depth += 1;
  else if (ch === ']') {
    depth -= 1;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

const literal = src.slice(openBracket, end);
// Evaluate as JS array (template strings + unquoted keys).
const pages = Function(`"use strict"; return (${literal});`)();

async function upsert(page) {
  const payload = {
    id: page.id,
    slug: page.slug,
    titleEn: page.titleEn,
    titleAr: page.titleAr,
    contentEn: page.contentEn,
    contentAr: page.contentAr,
    category: page.category,
    isSystemDefault: Boolean(page.isSystemDefault),
    isPublished: Boolean(page.isPublished),
    metaDescriptionEn: page.metaDescriptionEn || '',
    metaDescriptionAr: page.metaDescriptionAr || '',
  };
  const res = await fetch(`${baseUrl}/stores/${storeId}/pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Store-Id': storeId,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${page.slug} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return page.slug;
}

const listBefore = await fetch(`${baseUrl}/stores/${storeId}/pages`, {
  headers: { 'X-Store-Id': storeId },
}).then((r) => r.json());
console.log(`Before: ${(listBefore.data || []).length} pages @ ${baseUrl} store=${storeId}`);

for (const page of pages) {
  const slug = await upsert(page);
  console.log(`seeded ${slug}`);
}

const listAfter = await fetch(`${baseUrl}/stores/${storeId}/pages`, {
  headers: { 'X-Store-Id': storeId },
}).then((r) => r.json());
console.log(`After: ${(listAfter.data || []).length} pages`);
console.log(
  'slugs:',
  (listAfter.data || []).map((p) => p.slug || p.id).join(', '),
);
