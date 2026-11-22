/**
 * Sample custom dashboard wallpaper brightness → shell text luma.
 * Light photo → dark page titles; dark photo → light titles (like Soft night).
 */

export type ShellLuma = 'light' | 'dark';

const cache = new Map<string, ShellLuma>();
const inflight = new Map<string, Promise<ShellLuma>>();

/** Relative luminance 0–1 from sRGB channels. */
function pixelLuma(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function shellLumaFromAverage(avg: number): ShellLuma {
  // Mid-bright photos (sky / snow / beige) need dark ink — match city-warm presets
  return avg >= 0.42 ? 'light' : 'dark';
}

export function cachedShellWallpaperLuma(url: string): ShellLuma | null {
  const key = (url || '').trim();
  if (!key) return null;
  return cache.get(key) || null;
}

/**
 * Downscale image to a tiny canvas and average luminance.
 * Cross-origin failures → 'dark' (safe: white titles + stronger scrim).
 */
export async function sampleShellWallpaperLuma(imageUrl: string): Promise<ShellLuma> {
  const url = (imageUrl || '').trim();
  if (!url) return 'dark';
  const hit = cache.get(url);
  if (hit) return hit;
  const pending = inflight.get(url);
  if (pending) return pending;

  const run = (async (): Promise<ShellLuma> => {
    if (typeof document === 'undefined') return 'dark';
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        // blob:/data:/same-origin OK; remote CDN may taint — try anonymous first
        if (!url.startsWith('blob:') && !url.startsWith('data:')) {
          el.crossOrigin = 'anonymous';
        }
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('WALLPAPER_LOAD_FAIL'));
        el.src = url;
      });

      const w = 64;
      const h = Math.max(1, Math.round((img.naturalHeight / Math.max(img.naturalWidth, 1)) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        cache.set(url, 'dark');
        return 'dark';
      }
      ctx.drawImage(img, 0, 0, w, h);
      let data: ImageData;
      try {
        data = ctx.getImageData(0, 0, w, h);
      } catch {
        // Tainted canvas (CORS) — assume dark shell so white titles + scrim stay readable
        cache.set(url, 'dark');
        return 'dark';
      }
      const px = data.data;
      let sum = 0;
      let count = 0;
      // Sample every pixel (64×~40 is tiny)
      for (let i = 0; i < px.length; i += 4) {
        const a = px[i + 3];
        if (a < 20) continue;
        sum += pixelLuma(px[i], px[i + 1], px[i + 2]);
        count += 1;
      }
      const avg = count > 0 ? sum / count : 0.3;
      const luma = shellLumaFromAverage(avg);
      cache.set(url, luma);
      return luma;
    } catch {
      cache.set(url, 'dark');
      return 'dark';
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, run);
  return run;
}

export function clearShellWallpaperLumaCache(url?: string): void {
  if (!url) {
    cache.clear();
    return;
  }
  cache.delete(url.trim());
}
