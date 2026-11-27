/**
 * PowerPoint / Canva PPTX → editable Design Studio layers.
 * Master + Store share this via `importDesignFile` / CanvaImageStudioModal.
 *
 * PPTX = ZIP of OOXML. We parse slide 1 shapes + pictures into studio layers.
 * Canva “Download → PPTX” nests most content in `p:grpSp` — groups are flattened
 * with child→parent coordinate transforms so text/images stay editable.
 * Legacy binary `.ppt` is not supported — ask merchant to Save As `.pptx`.
 */

import type { ImportedStudioDesign, ImportedStudioLayer } from './canvaPsdImport';
import { optimizeHomeThumb, renderLayersToCompositeThumb } from './canvaStudioPreview';

const MAX_PPTX_BYTES = 45 * 1024 * 1024;
const MAX_LAYERS = 120;
/** EMU (English Metric Unit): 914400 per inch · studio uses ~96 CSS px/inch */
const EMU_PER_PX = 914400 / 96;

type ZipLike = {
  file: (path: string) => {
    async: (type: 'string' | 'arraybuffer' | 'uint8array') => Promise<string | ArrayBuffer | Uint8Array>;
  } | null;
  files: Record<string, { dir?: boolean; name: string }>;
};

type BoxPx = { x: number; y: number; w: number; h: number };

type GroupXfrm = {
  offX: number;
  offY: number;
  extCx: number;
  extCy: number;
  chOffX: number;
  chOffY: number;
  chExtCx: number;
  chExtCy: number;
};

async function loadJSZip(): Promise<{ loadAsync: (data: ArrayBuffer) => Promise<ZipLike> }> {
  const mod = (await import('jszip')) as {
    default?: new () => { loadAsync: (data: ArrayBuffer) => Promise<ZipLike> };
    loadAsync?: (data: ArrayBuffer) => Promise<ZipLike>;
  };
  if (typeof mod.loadAsync === 'function') {
    return { loadAsync: mod.loadAsync.bind(mod) };
  }
  const Ctor = mod.default;
  if (typeof Ctor === 'function') {
    return new Ctor();
  }
  throw new Error('PPTX_LOADER_FAIL');
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emuToPx(emu: number): number {
  return Math.max(1, Math.round(emu / EMU_PER_PX));
}

function guessCategoryFromSize(width: number, height: number): ImportedStudioDesign['categoryHint'] {
  const ratio = width / Math.max(1, height);
  if (width >= 1400 && height <= 700) return 'banner';
  if (ratio > 1.6 && width >= 1000) return 'ads';
  if (height > width * 1.4) return 'social';
  if (width <= 600 && height <= 600) return 'logo';
  return 'product';
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`\\b${name}="([^"]*)"`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Preserve paragraph breaks (Canva multi-line text boxes). */
function extractAllText(xmlChunk: string): string {
  const paragraphs: string[] = [];
  const pRe = /<a:p\b[\s\S]*?<\/a:p>/gi;
  let pMatch: RegExpExecArray | null;
  let foundP = false;
  while ((pMatch = pRe.exec(xmlChunk))) {
    foundP = true;
    const parts: string[] = [];
    const tRe = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRe.exec(pMatch[0]))) {
      parts.push(decodeXmlEntities(tMatch[1] || ''));
    }
    const line = parts.join('').replace(/\s+/g, ' ').trim();
    if (line) paragraphs.push(line);
  }
  if (foundP) return paragraphs.join('\n').trim();

  const parts: string[] = [];
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xmlChunk))) {
    const t = decodeXmlEntities(m[1] || '').trim();
    if (t) parts.push(t);
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function extractFontSizePt(xmlChunk: string): number {
  // a:sz is in hundredths of a point
  const m = xmlChunk.match(/<a:sz[^>]*\bval="(\d+)"/i) || xmlChunk.match(/\bsz="(\d+)"/i);
  if (!m) return 24;
  const hundredths = Number(m[1]);
  if (!Number.isFinite(hundredths) || hundredths <= 0) return 24;
  return Math.max(10, Math.round(hundredths / 100));
}

function extractColor(xmlChunk: string, fallback = '#0f172a'): string {
  const srgb = xmlChunk.match(/<a:srgbClr[^>]*\bval="([0-9A-Fa-f]{6})"/i);
  if (srgb) return `#${srgb[1].toLowerCase()}`;
  // Scheme colors — map common Canva/PPT theme tokens to usable ink
  const scheme = xmlChunk.match(/<a:schemeClr[^>]*\bval="([^"]+)"/i)?.[1]?.toLowerCase();
  if (scheme) {
    const map: Record<string, string> = {
      dk1: '#0f172a',
      lt1: '#ffffff',
      dk2: '#1e293b',
      lt2: '#f1f5f9',
      accent1: '#7c3aed',
      accent2: '#db2777',
      accent3: '#059669',
      accent4: '#d97706',
      accent5: '#0284c7',
      accent6: '#4f46e5',
      hlink: '#2563eb',
      folhlink: '#7c3aed',
      tx1: '#0f172a',
      tx2: '#334155',
      bg1: '#ffffff',
      bg2: '#f8fafc',
    };
    if (map[scheme]) return map[scheme];
  }
  return fallback;
}

function extractAlign(xmlChunk: string): 'left' | 'center' | 'right' {
  const m = xmlChunk.match(/<a:pPr[^>]*\balgn="(l|ctr|r|just)"/i);
  if (!m) return 'center';
  if (m[1] === 'l') return 'left';
  if (m[1] === 'r') return 'right';
  return 'center';
}

function isBold(xmlChunk: string): boolean {
  return /<a:b\b|b="1"|<a:latin[^>]*\bb="1"/i.test(xmlChunk);
}

function isItalic(xmlChunk: string): boolean {
  return /<a:i\b|i="1"/i.test(xmlChunk);
}

function parseXfrmBlock(xmlChunk: string): GroupXfrm | null {
  const xfrm = xmlChunk.match(/<a:xfrm\b[\s\S]*?<\/a:xfrm>/i)?.[0];
  if (!xfrm) {
    // self-closing off/ext only
    const offTag = xmlChunk.match(/<a:off\b[^>]*\/?>/i)?.[0];
    const extTag = xmlChunk.match(/<a:ext\b[^>]*\/?>/i)?.[0];
    if (!offTag || !extTag) return null;
    const xEmu = Number(attr(offTag, 'x'));
    const yEmu = Number(attr(offTag, 'y'));
    const cx = Number(attr(extTag, 'cx'));
    const cy = Number(attr(extTag, 'cy'));
    if (![xEmu, yEmu, cx, cy].every((n) => Number.isFinite(n))) return null;
    return {
      offX: xEmu,
      offY: yEmu,
      extCx: cx,
      extCy: cy,
      chOffX: xEmu,
      chOffY: yEmu,
      chExtCx: cx,
      chExtCy: cy,
    };
  }
  const offTag = xfrm.match(/<a:off\b[^>]*\/?>/i)?.[0];
  const extTag = xfrm.match(/<a:ext\b[^>]*\/?>/i)?.[0];
  if (!offTag || !extTag) return null;
  const xEmu = Number(attr(offTag, 'x'));
  const yEmu = Number(attr(offTag, 'y'));
  const cx = Number(attr(extTag, 'cx'));
  const cy = Number(attr(extTag, 'cy'));
  if (![xEmu, yEmu, cx, cy].every((n) => Number.isFinite(n))) return null;

  const chOffTag = xfrm.match(/<a:chOff\b[^>]*\/?>/i)?.[0];
  const chExtTag = xfrm.match(/<a:chExt\b[^>]*\/?>/i)?.[0];
  const chOffX = chOffTag ? Number(attr(chOffTag, 'x')) : xEmu;
  const chOffY = chOffTag ? Number(attr(chOffTag, 'y')) : yEmu;
  const chExtCx = chExtTag ? Number(attr(chExtTag, 'cx')) : cx;
  const chExtCy = chExtTag ? Number(attr(chExtTag, 'cy')) : cy;

  return {
    offX: xEmu,
    offY: yEmu,
    extCx: cx,
    extCy: cy,
    chOffX: Number.isFinite(chOffX) ? chOffX : xEmu,
    chOffY: Number.isFinite(chOffY) ? chOffY : yEmu,
    chExtCx: Number.isFinite(chExtCx) && chExtCx > 0 ? chExtCx : cx,
    chExtCy: Number.isFinite(chExtCy) && chExtCy > 0 ? chExtCy : cy,
  };
}

function parseXfrm(xmlChunk: string): BoxPx | null {
  const g = parseXfrmBlock(xmlChunk);
  if (!g) return null;
  return {
    x: emuToPx(g.offX),
    y: emuToPx(g.offY),
    w: emuToPx(g.extCx),
    h: emuToPx(g.extCy),
  };
}

/** Map child EMU box into absolute slide px using parent group transform. */
function mapChildBoxThroughGroup(child: GroupXfrm, parent: GroupXfrm): BoxPx {
  const sx = parent.extCx / Math.max(1, parent.chExtCx);
  const sy = parent.extCy / Math.max(1, parent.chExtCy);
  const absX = parent.offX + (child.offX - parent.chOffX) * sx;
  const absY = parent.offY + (child.offY - parent.chOffY) * sy;
  const absW = child.extCx * sx;
  const absH = child.extCy * sy;
  return {
    x: emuToPx(absX),
    y: emuToPx(absY),
    w: Math.max(1, emuToPx(absW)),
    h: Math.max(1, emuToPx(absH)),
  };
}

function parseRels(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /<Relationship\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml))) {
    const tag = m[0];
    const id = attr(tag, 'Id');
    const target = attr(tag, 'Target');
    if (id && target) map.set(id, target.replace(/\\/g, '/'));
  }
  return map;
}

function resolveMediaPath(slideDir: string, target: string): string {
  if (target.startsWith('/')) return target.replace(/^\//, '');
  if (target.startsWith('../')) {
    const base = slideDir.replace(/\/?$/, '/');
    const parts = (base + target).split('/');
    const out: string[] = [];
    for (const p of parts) {
      if (!p || p === '.') continue;
      if (p === '..') out.pop();
      else out.push(p);
    }
    return out.join('/');
  }
  return `${slideDir.replace(/\/?$/, '/')}${target}`;
}

function mimeFromPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.emf') || lower.endsWith('.wmf')) return '';
  return 'image/png';
}

function uint8ToBase64(bytes: Uint8Array): string {
  // Node test / Buffer path
  const Buf = (globalThis as { Buffer?: { from: (b: Uint8Array) => { toString: (e: string) => string } } }).Buffer;
  if (Buf) return Buf.from(bytes).toString('base64');

  // Browser — chunked apply (no spread) so large Canva images don't hang
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

async function readZipText(zip: ZipLike, path: string): Promise<string | null> {
  const f = zip.file(path);
  if (!f) return null;
  const data = await f.async('string');
  return typeof data === 'string' ? data : null;
}

async function readZipBytes(zip: ZipLike, path: string): Promise<Uint8Array | null> {
  const f = zip.file(path);
  if (!f) return null;
  const data = await f.async('uint8array');
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return null;
}

function findFirstSlidePath(presentationXml: string, zip: ZipLike): string | null {
  const candidates = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n) && !zip.files[n]?.dir)
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/i)?.[1] || 0);
      const nb = Number(b.match(/slide(\d+)/i)?.[1] || 0);
      return na - nb;
    });
  if (candidates[0]) return candidates[0];
  void presentationXml;
  return null;
}

function parseSlideSize(presentationXml: string): { width: number; height: number } {
  const tag = presentationXml.match(/<p:sldSz\b[^>]*\/?>/i)?.[0];
  if (!tag) return { width: 1920, height: 1080 };
  const cx = Number(attr(tag, 'cx'));
  const cy = Number(attr(tag, 'cy'));
  if (![cx, cy].every((n) => Number.isFinite(n) && n > 0)) {
    return { width: 1920, height: 1080 };
  }
  return {
    width: Math.max(320, emuToPx(cx)),
    height: Math.max(240, emuToPx(cy)),
  };
}

type ShapeTag = 'p:sp' | 'p:pic' | 'p:cxnSp' | 'p:grpSp';

function matchShapeOpenAt(xml: string, i: number): ShapeTag | null {
  if (xml.charCodeAt(i) !== 60) return null;
  const head = xml.slice(i, i + 10).toLowerCase();
  if (head.startsWith('<p:grpsp') && !/[a-z0-9]/i.test(xml[i + 8] || ' ')) return 'p:grpSp';
  if (head.startsWith('<p:cxnsp') && !/[a-z0-9]/i.test(xml[i + 8] || ' ')) return 'p:cxnSp';
  if (head.startsWith('<p:pic') && !/[a-z0-9]/i.test(xml[i + 6] || ' ')) return 'p:pic';
  if (head.startsWith('<p:sp') && !/[a-z0-9]/i.test(xml[i + 5] || ' ')) {
    // exclude p:spTree / p:spLocks etc. — next char after p:sp must be space, >, or /
    const c = xml[i + 5];
    if (c === ' ' || c === '>' || c === '/' || c === '\n' || c === '\r' || c === '\t') return 'p:sp';
  }
  return null;
}

function isOpenTagAt(xml: string, i: number, tag: string): boolean {
  const lit = `<${tag}`;
  if (xml.slice(i, i + lit.length).toLowerCase() !== lit.toLowerCase()) return false;
  const c = xml[i + lit.length];
  return c === ' ' || c === '>' || c === '/' || c === '\n' || c === '\r' || c === '\t';
}

function isCloseTagAt(xml: string, i: number, tag: string): boolean {
  const lit = `</${tag}>`;
  return xml.slice(i, i + lit.length).toLowerCase() === lit.toLowerCase();
}

/**
 * Linear scanner — never use nested /[\s\S]*?<\/\1>/ (Canva PPTX hangs on deep groups).
 * Finds balanced top-level p:sp / p:pic / p:cxnSp / p:grpSp elements only.
 */
function splitTopLevelShapes(xml: string): string[] {
  const chunks: string[] = [];
  const n = xml.length;
  let i = 0;
  while (i < n) {
    const tag = matchShapeOpenAt(xml, i);
    if (!tag) {
      i += 1;
      continue;
    }
    let depth = 0;
    let j = i;
    let found = false;
    while (j < n) {
      if (xml.charCodeAt(j) !== 60) {
        j += 1;
        continue;
      }
      if (isCloseTagAt(xml, j, tag)) {
        depth -= 1;
        j += tag.length + 3; // </tag>
        if (depth === 0) {
          chunks.push(xml.slice(i, j));
          i = j;
          found = true;
          break;
        }
        continue;
      }
      if (isOpenTagAt(xml, j, tag)) {
        const gt = xml.indexOf('>', j);
        if (gt > j && xml[gt - 1] === '/') {
          j = gt + 1;
          continue;
        }
        depth += 1;
        j = gt > j ? gt + 1 : j + 1;
        continue;
      }
      j += 1;
    }
    if (!found) i += 1;
  }
  return chunks;
}

/** Children inside a group — strip the group's own property wrappers first. */
function splitGroupChildren(grpXml: string): string[] {
  let inner = grpXml.trim();
  // Remove outer <p:grpSp ...> ... </p:grpSp>
  const openEnd = inner.indexOf('>');
  if (openEnd > 0) inner = inner.slice(openEnd + 1);
  const closeIdx = inner.toLowerCase().lastIndexOf('</p:grpsp>');
  if (closeIdx >= 0) inner = inner.slice(0, closeIdx);

  // Strip nvGrpSpPr + grpSpPr without nested catastrophic regex — find first blocks by scan
  inner = stripFirstNamedBlock(inner, 'p:nvGrpSpPr');
  inner = stripFirstNamedBlock(inner, 'p:grpSpPr');
  return splitTopLevelShapes(inner);
}

/** Remove first balanced <name>...</name> block (linear). */
function stripFirstNamedBlock(xml: string, name: string): string {
  const openRe = new RegExp(`<${name}\\b`, 'i');
  const m = openRe.exec(xml);
  if (!m || m.index == null) return xml;
  const start = m.index;
  const closeTag = `</${name}>`;
  let depth = 0;
  let j = start;
  const n = xml.length;
  while (j < n) {
    if (xml.charCodeAt(j) !== 60) {
      j += 1;
      continue;
    }
    if (xml.slice(j, j + closeTag.length).toLowerCase() === closeTag.toLowerCase()) {
      depth -= 1;
      j += closeTag.length;
      if (depth === 0) {
        return xml.slice(0, start) + xml.slice(j);
      }
      continue;
    }
    if (new RegExp(`^<${name}\\b`, 'i').test(xml.slice(j, j + name.length + 3))) {
      const gt = xml.indexOf('>', j);
      if (gt > j && xml[gt - 1] === '/') {
        j = gt + 1;
        continue;
      }
      depth += 1;
      j = gt > j ? gt + 1 : j + 1;
      continue;
    }
    j += 1;
  }
  return xml;
}

function parseGroupXfrm(grpXml: string): GroupXfrm | null {
  const pr = grpXml.match(/<p:grpSpPr\b[\s\S]*?<\/p:grpSpPr>/i)?.[0] || grpXml;
  return parseXfrmBlock(pr);
}

export function isPptxFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.pptx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  );
}

export function isLegacyPptFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.ppt') ||
    file.type === 'application/vnd.ms-powerpoint'
  );
}

type ParseCtx = {
  zip: ZipLike;
  slideDir: string;
  rels: Map<string, string>;
  layers: ImportedStudioLayer[];
};

/** Canva often puts photos as a:blipFill on p:sp (not p:pic). */
function extractBlipEmbedIds(chunk: string): string[] {
  const ids: string[] = [];
  const re = /r:embed="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk))) {
    if (m[1] && !ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

async function pushPictureLayer(
  chunk: string,
  box: BoxPx,
  ctx: ParseCtx,
  embedId?: string,
): Promise<boolean> {
  if (ctx.layers.length >= MAX_LAYERS) return false;
  const embed =
    embedId ||
    chunk.match(/r:embed="([^"]+)"/i)?.[1] ||
    chunk.match(/Embed="([^"]+)"/i)?.[1];
  if (!embed) return false;
  const target = ctx.rels.get(embed);
  if (!target) return false;
  const mediaPath = resolveMediaPath(ctx.slideDir, target);
  const mime = mimeFromPath(mediaPath);
  if (!mime) return false;
  const bytes = await readZipBytes(ctx.zip, mediaPath);
  if (!bytes || bytes.length < 8) return false;
  const dataUrl = `data:${mime};base64,${uint8ToBase64(bytes)}`;
  const nameHint =
    chunk.match(/<p:cNvPr[^>]*\bname="([^"]*)"/i)?.[1] ||
    mediaPath.split('/').pop() ||
    'Image';
  ctx.layers.push({
    id: uid('img'),
    type: 'image',
    text: String(nameHint).slice(0, 48),
    imageUrl: dataUrl,
    x: Math.round(box.x + box.w / 2),
    y: Math.round(box.y + box.h / 2),
    width: box.w,
    height: box.h,
    fontSize: 16,
    fontColor: '#0f172a',
    opacity: 1,
  });
  return true;
}

async function pushTextOrShapeLayer(chunk: string, box: BoxPx, ctx: ParseCtx): Promise<void> {
  if (ctx.layers.length >= MAX_LAYERS) return;
  const centerX = Math.round(box.x + box.w / 2);
  const centerY = Math.round(box.y + box.h / 2);

  // Image fill on shape (Canva perfume ads etc.) — add as image layer first
  const embeds = extractBlipEmbedIds(chunk);
  let addedImage = false;
  for (const id of embeds) {
    const ok = await pushPictureLayer(chunk, box, ctx, id);
    if (ok) addedImage = true;
  }

  const text = extractAllText(chunk);
  if (text) {
    const fontSize = extractFontSizePt(chunk);
    const spPrChunk = chunk.match(/<p:spPr\b[\s\S]*?<\/p:spPr>/i)?.[0] || '';
    const hasNoFill = /<a:noFill\b/i.test(spPrChunk);
    const shapeSolidFill = !hasNoFill ? spPrChunk.match(/<a:solidFill>[\s\S]*?<\/a:solidFill>/i)?.[0] : null;
    const shapeBgColor = shapeSolidFill ? extractColor(shapeSolidFill, '') : '';
    const txBodyChunk = chunk.match(/<p:txBody\b[\s\S]*?<\/p:txBody>/i)?.[0] || chunk;
    const fontColor = extractColor(txBodyChunk, '#0f172a');
    // If shape has an image or no explicit fill, keep background transparent
    const bgColor = addedImage || hasNoFill || !shapeBgColor || shapeBgColor.toLowerCase() === fontColor.toLowerCase()
      ? undefined
      : shapeBgColor;
    ctx.layers.push({
      id: uid('txt'),
      type: fontSize >= 36 ? 'headline' : text.includes('\n') ? 'subtitle' : 'custom_text',
      text,
      x: centerX,
      y: centerY,
      width: Math.max(80, box.w),
      height: Math.max(40, box.h),
      fontSize: Math.round(fontSize * 1.33),
      fontColor,
      bgColor: bgColor || undefined,
      isBold: isBold(chunk),
      isItalic: isItalic(chunk),
      textAlign: extractAlign(chunk),
      opacity: 1,
    });
    return;
  }

  if (addedImage) return;

  const fill = chunk.match(/<a:solidFill>[\s\S]*?<\/a:solidFill>/i)?.[0];
  if (fill) {
    const color = extractColor(fill, '');
    if (color) {
      ctx.layers.push({
        id: uid('shp'),
        type: 'shape',
        text: '',
        x: centerX,
        y: centerY,
        width: box.w,
        height: box.h,
        fontSize: 16,
        fontColor: '#0f172a',
        bgColor: color,
        opacity: 1,
      });
    }
  }
}

async function parseShapeChunk(
  chunk: string,
  parentGroup: GroupXfrm | null,
  ctx: ParseCtx,
): Promise<void> {
  if (ctx.layers.length >= MAX_LAYERS) return;

  // Nested Canva groups — flatten recursively
  if (/^<p:grpSp\b/i.test(chunk.trim()) || /^<p:grpSp\b/i.test(chunk.slice(0, 20))) {
    const gxfrm = parseGroupXfrm(chunk);
    if (!gxfrm) return;
    // Compose with outer parent if already inside a group
    const absGroup: GroupXfrm = parentGroup
      ? (() => {
          const sx = parentGroup.extCx / Math.max(1, parentGroup.chExtCx);
          const sy = parentGroup.extCy / Math.max(1, parentGroup.chExtCy);
          return {
            offX: parentGroup.offX + (gxfrm.offX - parentGroup.chOffX) * sx,
            offY: parentGroup.offY + (gxfrm.offY - parentGroup.chOffY) * sy,
            extCx: gxfrm.extCx * sx,
            extCy: gxfrm.extCy * sy,
            chOffX: gxfrm.chOffX,
            chOffY: gxfrm.chOffY,
            chExtCx: gxfrm.chExtCx,
            chExtCy: gxfrm.chExtCy,
          };
        })()
      : gxfrm;
    for (const child of splitGroupChildren(chunk)) {
      await parseShapeChunk(child, absGroup, ctx);
    }
    return;
  }

  const local = parseXfrmBlock(chunk);
  if (!local) return;
  const box: BoxPx = parentGroup
    ? mapChildBoxThroughGroup(local, parentGroup)
    : {
        x: emuToPx(local.offX),
        y: emuToPx(local.offY),
        w: emuToPx(local.extCx),
        h: emuToPx(local.extCy),
      };
  if (box.w < 2 && box.h < 2) return;

  if (/^<p:pic\b/i.test(chunk.trim()) || /<p:pic\b/i.test(chunk.slice(0, 40))) {
    await pushPictureLayer(chunk, box, ctx);
    return;
  }

  await pushTextOrShapeLayer(chunk, box, ctx);
}

/**
 * Parse PowerPoint / Canva PPTX (first slide) into editable studio layers.
 */
export async function importPptxFile(file: File): Promise<ImportedStudioDesign> {
  if (isLegacyPptFile(file) && !isPptxFile(file)) {
    throw new Error('PPT_LEGACY');
  }
  if (file.size > MAX_PPTX_BYTES) {
    throw new Error('PPTX_TOO_LARGE');
  }

  const buffer = await file.arrayBuffer();
  let zip: ZipLike;
  try {
    const loader = await loadJSZip();
    zip = await loader.loadAsync(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'PPTX_LOADER_FAIL') throw err;
    throw new Error('PPTX_BAD_ARCHIVE');
  }

  const presentationXml =
    (await readZipText(zip, 'ppt/presentation.xml')) ||
    (await readZipText(zip, 'ppt/Presentation.xml'));
  if (!presentationXml) {
    throw new Error('PPTX_NO_SLIDES');
  }

  const { width: docW, height: docH } = parseSlideSize(presentationXml);
  const slidePath = findFirstSlidePath(presentationXml, zip);
  if (!slidePath) {
    throw new Error('PPTX_NO_SLIDES');
  }

  const slideXml = await readZipText(zip, slidePath);
  if (!slideXml) {
    throw new Error('PPTX_NO_SLIDES');
  }

  const slideDir = slidePath.replace(/\/[^/]+$/, '');
  const relsPath = `${slideDir}/_rels/${slidePath.split('/').pop()}.rels`;
  const relsXml = (await readZipText(zip, relsPath)) || '';
  const rels = parseRels(relsXml);

  const ctx: ParseCtx = { zip, slideDir, rels, layers: [] };
  for (const chunk of splitTopLevelShapes(slideXml)) {
    await parseShapeChunk(chunk, null, ctx);
  }

  if (ctx.layers.length === 0) {
    throw new Error('PPTX_NO_LAYERS');
  }

  let previewDataUrl: string | undefined;
  try {
    previewDataUrl = await renderLayersToCompositeThumb(ctx.layers, docW, docH);
  } catch {
    /* fallback to photo layer */
  }
  if (!previewDataUrl) {
    const rawPhoto = ctx.layers.find((l) => l.imageUrl)?.imageUrl;
    previewDataUrl = await optimizeHomeThumb(rawPhoto);
  }

  return {
    width: docW,
    height: docH,
    name: file.name.replace(/\.[^.]+$/, '') || 'Imported Template',
    source: 'pptx',
    layers: ctx.layers,
    previewDataUrl,
    categoryHint: guessCategoryFromSize(docW, docH),
  };
}
