/**
 * Ensure Canva studio text + bg pairs stay fully readable on light/dark canvases.
 * Prefer Canva-style ink flip (black on light / white on dark) — pill only as last resort.
 */

function parseColor(input: string | undefined): { r: number; g: number; b: number; a: number } | null {
  if (!input || input === 'transparent') return null;
  const s = input.trim().toLowerCase();
  if (s === 'none') return null;

  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    if (hex.length === 4) {
      const [r, g, b, a] = hex.split('');
      hex = r + r + g + g + b + b + a + a;
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if ([r, g, b].some((n) => Number.isNaN(n))) return null;
      return { r, g, b, a };
    }
  }

  const rgba = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/,
  );
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] != null ? Number(rgba[4]) : 1,
    };
  }
  return null;
}

function channel(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string | undefined): number | null {
  const rgb = parseColor(color);
  if (!rgb || rgb.a < 0.35) return null;
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: string | undefined, b: string | undefined): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la == null || lb == null) return 1;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isLightSurface(color: string | undefined, fallbackLight = true): boolean {
  const lum = relativeLuminance(color);
  if (lum == null) return fallbackLight;
  // Stricter: mid-dark emerald/gold/espresso count as dark → light ink (never dark-on-dark)
  return lum >= 0.45;
}

const DARK_INK = '#0f172a';
const LIGHT_INK = '#f8fafc';
const DARK_PILL = 'rgba(15, 23, 42, 0.92)';
const LIGHT_PILL = 'rgba(255, 255, 255, 0.95)';

/** WCAG AA normal text — full readable floor for studio */
const DEFAULT_MIN_RATIO = 4.5;

export interface ReadableTextStyle {
  fontColor: string;
  bgColor: string;
}

export interface EnsureReadableOptions {
  /**
   * When true and flipped ink alone is still weak (rare mid-tone), allow a contrast pill.
   * Never skips the ink-flip path — user wants black/white text readable first (Canva-like).
   */
  preferPill?: boolean;
  /** Override minimum contrast ratio (default 4.5). */
  minRatio?: number;
}

/**
 * Make font/bg fully readable against an approximate canvas backdrop.
 * Order: keep pair if OK → flip ink on solid fill → flip ink on canvas → optional pill.
 */
export function ensureReadableTextStyle(
  fontColor: string | undefined,
  bgColor: string | undefined,
  canvasApprox: string,
  opts?: EnsureReadableOptions,
): ReadableTextStyle {
  const minRatio = opts?.minRatio ?? DEFAULT_MIN_RATIO;
  const font = fontColor || DARK_INK;
  const bg = bgColor && bgColor !== 'transparent' ? bgColor : 'transparent';
  const canvas = canvasApprox || '#ffffff';
  const against = bg !== 'transparent' ? bg : canvas;
  const ratio = contrastRatio(font, against);

  if (ratio >= minRatio) {
    return { fontColor: font, bgColor: bg };
  }

  // Solid badge/price fill — flip ink to match fill luminance
  if (bg !== 'transparent') {
    const ink = isLightSurface(bg) ? DARK_INK : LIGHT_INK;
    if (contrastRatio(ink, bg) >= minRatio) {
      return { fontColor: ink, bgColor: bg };
    }
    // Extremely washed fill — strengthen fill + dark ink
    return {
      fontColor: DARK_INK,
      bgColor: LIGHT_PILL,
    };
  }

  // Transparent text on canvas — flip ink first (black on light / white on dark)
  const flipped = isLightSurface(canvas) ? DARK_INK : LIGHT_INK;
  if (contrastRatio(flipped, canvas) >= minRatio) {
    return { fontColor: flipped, bgColor: 'transparent' };
  }

  // Last resort only (mid-tone / busy approx) — readable pill
  if (opts?.preferPill !== false) {
    const pill = isLightSurface(canvas) ? DARK_PILL : LIGHT_PILL;
    const pillInk = isLightSurface(canvas) ? LIGHT_INK : DARK_INK;
    return { fontColor: pillInk, bgColor: pill };
  }

  return { fontColor: flipped, bgColor: 'transparent' };
}

/** Resolve approximate solid color for known studio backdrops. */
export function resolveCanvasApproxColor(
  backdropId: string,
  customSolid: string,
  gradientMid?: string,
): string {
  if (backdropId === 'custom') return customSolid || '#ffffff';
  if (backdropId === 'custom_gradient') return gradientMid || customSolid || '#e2e8f0';
  if (backdropId === 'transparent' || backdropId === 'original') return '#f8fafc';
  const map: Record<string, string> = {
    'pure-white': '#ffffff',
    'soft-ivory': '#f3ebe3',
    'coffee-cream': '#e8d5b7',
    // Use darker stop so contrast engine picks light ink (never dark text on dark BG)
    'espresso-lux': '#2a170e',
    'floral-blush': '#f9a8d4',
    'petal-ivory': '#fce7f3',
    'sage-mist': '#c5d5c8',
    'ksa-emerald': '#022c22',
    'royal-gold': '#1c1917',
    'desert-sand': '#451a03',
    'velvet-rose': '#4c0519',
    'ocean-blue': '#082f49',
    obsidian: '#090d16',
  };
  return map[backdropId] || '#ffffff';
}
