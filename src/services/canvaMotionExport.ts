/**
 * Design Studio motion export — animated GIF + MP4/WebM via canvas frames.
 * GIF: lightweight GIF89a (no fake cloud). Video: MediaRecorder (mp4 when browser allows).
 */

export type MotionFrame = {
  /** RGBA ImageData or already-drawn canvas */
  canvas: HTMLCanvasElement;
  delayCs: number; // centiseconds for GIF
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Very small GIF89a writer — 256-color adaptive palette per frame (fast path). */
export function encodeGifFromCanvases(
  frames: MotionFrame[],
  width: number,
  height: number,
): Blob {
  if (!frames.length) throw new Error('GIF_NO_FRAMES');

  const parts: number[] = [];
  const pushStr = (s: string) => {
    for (let i = 0; i < s.length; i++) parts.push(s.charCodeAt(i));
  };
  const pushBytes = (...bs: number[]) => {
    for (const b of bs) parts.push(b & 0xff);
  };
  const pushU16 = (n: number) => {
    parts.push(n & 0xff, (n >> 8) & 0xff);
  };

  pushStr('GIF89a');
  pushU16(width);
  pushU16(height);
  pushBytes(0xf7, 0, 0); // GCT flag 256 colors

  // Global palette placeholder (will use first frame palette)
  const firstPal = quantizeFrame(frames[0].canvas, width, height);
  for (let i = 0; i < 256; i++) {
    const c = firstPal.palette[i] || [0, 0, 0];
    pushBytes(c[0], c[1], c[2]);
  }

  // Netscape loop
  pushBytes(0x21, 0xff, 0x0b);
  pushStr('NETSCAPE2.0');
  pushBytes(0x03, 0x01, 0x00, 0x00, 0x00);

  for (const frame of frames) {
    const q = quantizeFrame(frame.canvas, width, height);
    // Graphic control
    pushBytes(0x21, 0xf9, 0x04, 0x00);
    pushU16(Math.max(2, Math.min(1000, frame.delayCs)));
    pushBytes(0x00, 0x00);
    // Image descriptor
    pushBytes(0x2c);
    pushU16(0);
    pushU16(0);
    pushU16(width);
    pushU16(height);
    pushBytes(0x87); // local color table 256
    for (let i = 0; i < 256; i++) {
      const c = q.palette[i] || [0, 0, 0];
      pushBytes(c[0], c[1], c[2]);
    }
    const compressed = lzwEncode(q.indexes, 8);
    pushBytes(8);
    for (let i = 0; i < compressed.length; i += 255) {
      const chunk = compressed.subarray(i, i + 255);
      pushBytes(chunk.length);
      for (let j = 0; j < chunk.length; j++) parts.push(chunk[j]);
    }
    pushBytes(0x00);
  }

  pushBytes(0x3b);
  return new Blob([new Uint8Array(parts)], { type: 'image/gif' });
}

function quantizeFrame(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): { palette: Array<[number, number, number]>; indexes: Uint8Array } {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('GIF_NO_CTX');
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const bucket = new Map<number, { r: number; g: number; b: number; n: number }>();

  // Sample every 2nd pixel for palette build
  for (let i = 0; i < data.length; i += 8) {
    const r = data[i] >> 3;
    const g = data[i + 1] >> 3;
    const b = data[i + 2] >> 3;
    const key = (r << 10) | (g << 5) | b;
    const cur = bucket.get(key);
    if (cur) {
      cur.r += data[i];
      cur.g += data[i + 1];
      cur.b += data[i + 2];
      cur.n += 1;
    } else {
      bucket.set(key, { r: data[i], g: data[i + 1], b: data[i + 2], n: 1 });
    }
  }

  const colors = [...bucket.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 256)
    .map((c) => [Math.round(c.r / c.n), Math.round(c.g / c.n), Math.round(c.b / c.n)] as [
      number,
      number,
      number,
    ]);
  while (colors.length < 256) colors.push([0, 0, 0]);

  const indexes = new Uint8Array(width * height);
  for (let y = 0, p = 0; y < height; y++) {
    for (let x = 0; x < width; x++, p++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let best = 0;
      let bestD = 1e18;
      for (let c = 0; c < 256; c++) {
        const pr = colors[c][0] - r;
        const pg = colors[c][1] - g;
        const pb = colors[c][2] - b;
        const d = pr * pr + pg * pg + pb * pb;
        if (d < bestD) {
          bestD = d;
          best = c;
          if (d === 0) break;
        }
      }
      indexes[p] = best;
    }
  }
  return { palette: colors, indexes };
}

function lzwEncode(indexes: Uint8Array, minCodeSize: number): Uint8Array {
  const clear = 1 << minCodeSize;
  const end = clear + 1;
  let codeSize = minCodeSize + 1;
  let nextCode = end + 1;
  const maxCode = 4095;

  const out: number[] = [];
  let cur = 0;
  let curBits = 0;
  const writeCode = (code: number) => {
    cur |= code << curBits;
    curBits += codeSize;
    while (curBits >= 8) {
      out.push(cur & 0xff);
      cur >>= 8;
      curBits -= 8;
    }
  };

  writeCode(clear);
  let w = String(indexes[0]);
  const dict = new Map<string, number>();

  const resetDict = () => {
    dict.clear();
    codeSize = minCodeSize + 1;
    nextCode = end + 1;
  };
  resetDict();

  for (let i = 1; i < indexes.length; i++) {
    const k = String(indexes[i]);
    const wk = w + ',' + k;
    if (dict.has(wk)) {
      w = wk;
    } else {
      const code = w.includes(',') ? dict.get(w)! : Number(w);
      writeCode(code);
      if (nextCode <= maxCode) {
        dict.set(wk, nextCode++);
        if (nextCode > 1 << codeSize && codeSize < 12) codeSize++;
      } else {
        writeCode(clear);
        resetDict();
      }
      w = k;
    }
  }
  writeCode(w.includes(',') ? dict.get(w)! : Number(w));
  writeCode(end);
  if (curBits > 0) out.push(cur & 0xff);
  return Uint8Array.from(out);
}

export async function exportAnimatedGif(opts: {
  width: number;
  height: number;
  timelineMs: number;
  fps?: number;
  maxSide?: number;
  filename: string;
  renderFrame: (timeMs: number, target: HTMLCanvasElement) => void | Promise<void>;
}): Promise<void> {
  const fps = opts.fps ?? 10;
  const maxSide = opts.maxSide ?? 720;
  const scale = Math.min(1, maxSide / Math.max(opts.width, opts.height));
  const w = Math.max(2, Math.round(opts.width * scale));
  const h = Math.max(2, Math.round(opts.height * scale));
  const frameCount = Math.max(2, Math.ceil((opts.timelineMs / 1000) * fps));
  const delayCs = Math.max(2, Math.round(100 / fps));

  const frameCanvas = document.createElement('canvas');
  frameCanvas.width = w;
  frameCanvas.height = h;
  const frames: MotionFrame[] = [];

  for (let i = 0; i < frameCount; i++) {
    const t = (i / (frameCount - 1)) * opts.timelineMs;
    await opts.renderFrame(t, frameCanvas);
    // Copy to dedicated canvas (encode mutates read)
    const copy = document.createElement('canvas');
    copy.width = w;
    copy.height = h;
    const cctx = copy.getContext('2d');
    cctx?.drawImage(frameCanvas, 0, 0);
    frames.push({ canvas: copy, delayCs });
  }

  const blob = encodeGifFromCanvases(frames, w, h);
  downloadBlob(blob, opts.filename.endsWith('.gif') ? opts.filename : `${opts.filename}.gif`);
}

export async function exportMotionVideo(opts: {
  width: number;
  height: number;
  timelineMs: number;
  fps?: number;
  filename: string;
  preferMp4?: boolean;
  renderFrame: (timeMs: number, target: HTMLCanvasElement) => void | Promise<void>;
}): Promise<{ mime: string; ext: string }> {
  const fps = opts.fps ?? 15;
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  await opts.renderFrame(0, canvas);

  const stream = canvas.captureStream(fps);
  const candidates = opts.preferMp4
    ? ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
    : ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];

  let mime = '';
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) {
      mime = c;
      break;
    }
  }
  if (!mime) throw new Error('VIDEO_UNSUPPORTED');

  const chunks: BlobPart[] = [];
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    rec.onerror = () => reject(new Error('VIDEO_RECORD_FAIL'));
  });

  rec.start(100);
  const frameCount = Math.max(2, Math.ceil((opts.timelineMs / 1000) * fps));
  const frameDelay = 1000 / fps;
  for (let i = 0; i < frameCount; i++) {
    const t = (i / (frameCount - 1)) * opts.timelineMs;
    await opts.renderFrame(t, canvas);
    // Force a paint for captureStream
    await new Promise((r) => setTimeout(r, frameDelay));
  }
  rec.stop();
  stream.getTracks().forEach((t) => t.stop());

  const blob = await done;
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const name = opts.filename.replace(/\.(mp4|webm)$/i, '');
  downloadBlob(blob, `${name}.${ext}`);
  return { mime, ext };
}
