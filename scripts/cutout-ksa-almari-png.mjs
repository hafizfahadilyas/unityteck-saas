/**
 * Convert studio-white JPG almari shots → transparent PNG (flood-fill + fringe wipe).
 * Usage: node scripts/cutout-ksa-almari-png.mjs
 * Requires: sharp (dev/local): npm install --no-save sharp
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '../public/images');
const names = [
  'ksa_almari_fluted_oak',
  'ksa_almari_white_marble',
  'ksa_almari_makkah_corner',
  'ksa_almari_najdi_heritage',
  'ksa_almari_dual_door_villa',
];

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const chroma = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);

function nearWhite(r, g, b, lumaMin, chromaMax) {
  return luma(r, g, b) >= lumaMin && chroma(r, g, b) <= chromaMax;
}

async function cutout(name, opts) {
  const src = path.join(dir, `${name}.jpg`);
  const dest = path.join(dir, `${name}.png`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const c = info.channels;
  const N = w * h;
  const visited = new Uint8Array(N);
  const queue = new Int32Array(N);
  let qh = 0;
  let qt = 0;

  const pushSeed = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    const o = i * c;
    if (!nearWhite(data[o], data[o + 1], data[o + 2], opts.seedLuma, opts.seedChroma)) return;
    visited[i] = 1;
    queue[qt++] = i;
  };

  for (let x = 0; x < w; x++) {
    pushSeed(x, 0);
    pushSeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    pushSeed(0, y);
    pushSeed(w - 1, y);
  }

  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w;
    const y = (i / w) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = ny * w + nx;
        if (visited[ni]) continue;
        const no = ni * c;
        const r = data[no];
        const g = data[no + 1];
        const b = data[no + 2];
        const bottom = ny > h * opts.bottomFrac;
        const ok = bottom
          ? nearWhite(r, g, b, opts.bottomLuma, opts.bottomChroma)
          : nearWhite(r, g, b, opts.expandLuma, opts.expandChroma);
        if (!ok) continue;
        visited[ni] = 1;
        queue[qt++] = ni;
      }
    }
  }

  for (let i = 0; i < N; i++) {
    const o = i * c;
    if (visited[i]) {
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 0;
      continue;
    }
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const x = i % w;
    const y = (i / w) | 0;
    let nearBg = false;
    for (let dy = -2; dy <= 2 && !nearBg; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (visited[ny * w + nx]) nearBg = true;
      }
    }
    if (nearBg && nearWhite(r, g, b, 245, 20)) {
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 0;
      continue;
    }
    if (y >= h * 0.86 && nearWhite(r, g, b, 200, 26)) {
      data[o] = 0;
      data[o + 1] = 0;
      data[o + 2] = 0;
      data[o + 3] = 0;
      continue;
    }
    data[o + 3] = 255;
  }

  await sharp(data, { raw: { width: w, height: h, channels: c } }).png({ compressionLevel: 9 }).toFile(dest);
  console.log(name, fs.statSync(dest).size);
}

const wood = {
  seedLuma: 242,
  seedChroma: 20,
  expandLuma: 185,
  expandChroma: 32,
  bottomFrac: 0.78,
  bottomLuma: 185,
  bottomChroma: 32,
};
const marble = {
  seedLuma: 248,
  seedChroma: 14,
  expandLuma: 236,
  expandChroma: 18,
  bottomFrac: 0.82,
  bottomLuma: 205,
  bottomChroma: 24,
};

for (const n of names) {
  await cutout(n, n.includes('white_marble') ? marble : wood);
}
console.log('done');
