/**
 * Quick PPTX import smoke: node scripts/test-pptx-import.mjs <path.pptx>
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/test-pptx-import.mjs <file.pptx>');
  process.exit(2);
}

const t0 = Date.now();
const timer = setTimeout(() => {
  console.error('TIMEOUT after 25s — import hung');
  process.exit(3);
}, 25000);

try {
  // Dynamic import compiled TS via tsx loader when run as: npx tsx scripts/test-pptx-import.mjs
  const mod = await import('../src/services/canvaPptImport.ts');
  const buf = readFileSync(filePath);
  const name = path.basename(filePath);
  const file = new File([buf], name, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  console.log('file', name, 'bytes', buf.length);
  const design = await mod.importPptxFile(file);
  clearTimeout(timer);
  console.log(
    JSON.stringify(
      {
        ok: true,
        ms: Date.now() - t0,
        width: design.width,
        height: design.height,
        layers: design.layers.length,
        types: design.layers.reduce((acc, l) => {
          acc[l.type] = (acc[l.type] || 0) + 1;
          return acc;
        }, {}),
        sample: design.layers.slice(0, 5).map((l) => ({
          type: l.type,
          text: (l.text || '').slice(0, 40),
          w: l.width,
          h: l.height,
        })),
      },
      null,
      2,
    ),
  );
} catch (e) {
  clearTimeout(timer);
  console.error('FAIL', Date.now() - t0, 'ms', e?.message || e);
  process.exit(1);
}
