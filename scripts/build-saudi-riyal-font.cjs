#!/usr/bin/env node
/**
 * Build a single-glyph TTF for U+20C1 from the official SAMA SVG paths.
 * Output: src/assets/fonts/saudi-riyal-sign.ttf (+ copies for bold/woff fallbacks as TTF).
 */
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const SVG = path.join(ROOT, 'public', 'currency', 'saudi-riyal-symbol.svg');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'fonts');
const PUB_DIR = path.join(ROOT, 'public', 'currency');

const UPM = 1000;
const VB_W = 1124.14;
const VB_H = 1256.39;
const SCALE = UPM / VB_H;

function extractPaths(svg) {
  const re = /d="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(svg))) out.push(m[1]);
  return out;
}

/** SVG Y-down → font Y-up, scaled into UPM. */
function svgPathToFontPath(d) {
  const raw = opentype.Path.fromSVG(d);
  const cmds = raw.commands.map((c) => {
    const next = { ...c };
    for (const k of Object.keys(next)) {
      if (k === 'type') continue;
      const v = next[k];
      if (typeof v !== 'number') continue;
      if (k.startsWith('y') || k === 'y1' || k === 'y2') {
        next[k] = (VB_H - v) * SCALE;
      } else if (k.startsWith('x') || k === 'x1' || k === 'x2') {
        next[k] = v * SCALE;
      }
    }
    return next;
  });
  const p = new opentype.Path();
  p.commands = cmds;
  return p;
}

function build() {
  const svg = fs.readFileSync(SVG, 'utf8');
  const ds = extractPaths(svg);
  if (ds.length < 1) throw new Error('No path data in SVG');

  const merged = new opentype.Path();
  for (const d of ds) {
    const part = svgPathToFontPath(d);
    merged.commands.push(...part.commands);
  }

  const advance = Math.round(VB_W * SCALE);
  const glyph = new opentype.Glyph({
    name: 'saudiRiyal',
    unicode: 0x20c1,
    advanceWidth: advance,
    path: merged,
  });

  // Also map legacy PUA used by some icon classes
  const glyphPua = new opentype.Glyph({
    name: 'saudiRiyalPua',
    unicode: 0xe900,
    advanceWidth: advance,
    path: merged,
  });

  const notdef = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: UPM / 2,
    path: new opentype.Path(),
  });

  const space = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: UPM / 3,
    path: new opentype.Path(),
  });

  const font = new opentype.Font({
    familyName: 'SaudiRiyalSign',
    styleName: 'Regular',
    unitsPerEm: UPM,
    ascender: UPM,
    descender: 0,
    glyphs: [notdef, space, glyph, glyphPua],
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ttf = path.join(OUT_DIR, 'saudi-riyal-sign.ttf');
  const ttfBold = path.join(OUT_DIR, 'saudi-riyal-sign-bold.ttf');
  font.download = undefined;
  const buf = Buffer.from(font.toArrayBuffer());
  fs.writeFileSync(ttf, buf);
  fs.writeFileSync(ttfBold, buf);
  fs.mkdirSync(PUB_DIR, { recursive: true });
  fs.writeFileSync(path.join(PUB_DIR, 'saudi-riyal-sign.ttf'), buf);
  fs.writeFileSync(path.join(PUB_DIR, 'saudi-riyal-sign-bold.ttf'), buf);

  console.log('OK', ttf, 'bytes=', buf.length, 'advance=', advance);
}

build();
