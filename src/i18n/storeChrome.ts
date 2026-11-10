/**
 * Per-store dashboard chrome: palette, gradient, custom color, background image.
 * Saved on store_settings.settings.chromeBrand (store_id). Never copied across stores.
 */
import { apiFetch } from '../api/client';
import { setChromePainter } from './chromePainter';
import {
  BRAND_PALETTES,
  isBrandPaletteId,
  type BrandPalette,
  type BrandPaletteId,
} from './branding';

export type ChromeFill = 'palette' | 'gradient' | 'custom' | 'image';
export type SidebarDesignId = 'classic' | 'navy' | 'emerald' | 'minimal' | 'luxe';

export type StoreChromeBrand = {
  palette: BrandPaletteId;
  fill: ChromeFill;
  customColor: string;
  gradientFrom: string;
  gradientTo: string;
  bgImage: string;
  sidebarDesign: SidebarDesignId;
};

type SidebarPreset = {
  id: SidebarDesignId;
  label: string;
  labelAr: string;
  fill: ChromeFill;
  palette: BrandPaletteId;
  from: string;
  to: string;
  idle: string;
  accent: string;
  activeFg: string;
  cta: string;
};

export const SIDEBAR_DESIGNS: SidebarPreset[] = [
  {
    id: 'classic',
    label: 'Classic teal',
    labelAr: 'تركواز كلاسيكي',
    fill: 'palette',
    palette: 'holst',
    from: '#0A3D4A',
    to: '#1D8B94',
    idle: '#C8ECE7',
    accent: '#1D8B94',
    activeFg: '#ffffff',
    cta: 'linear-gradient(90deg, #1D8B94, #4FB8B4)',
  },
  {
    id: 'navy',
    label: 'Navy gold',
    labelAr: 'كحلي وذهبي',
    fill: 'gradient',
    palette: 'sapphire',
    from: '#071422',
    to: '#123049',
    idle: '#E4C56A',
    accent: '#D4AF37',
    activeFg: '#1A1408',
    cta: 'linear-gradient(90deg, #C6A15B, #E8C872)',
  },
  {
    id: 'emerald',
    label: 'Emerald bar',
    labelAr: 'شريط زمردي',
    fill: 'gradient',
    palette: 'emerald',
    from: '#04241C',
    to: '#0F6B4C',
    idle: '#B7F0D2',
    accent: '#34D399',
    activeFg: '#ffffff',
    cta: 'linear-gradient(90deg, #059669, #34D399)',
  },
  {
    id: 'minimal',
    label: 'Minimal line',
    labelAr: 'خط بسيط',
    fill: 'gradient',
    palette: 'indigo',
    from: '#0E1520',
    to: '#162033',
    idle: '#9FB0C3',
    accent: '#7DD3FC',
    activeFg: '#E0F2FE',
    cta: 'linear-gradient(90deg, #0284C7, #7DD3FC)',
  },
  {
    id: 'luxe',
    label: 'Luxe sand',
    labelAr: 'رملي فاخر',
    fill: 'gradient',
    palette: 'bronze',
    from: '#2A2118',
    to: '#6B4E2E',
    idle: '#F3E6C8',
    accent: '#E7D3A1',
    activeFg: '#2A2118',
    cta: 'linear-gradient(90deg, #E7D3A1, #F8F1DE)',
  },
];

export function isSidebarDesignId(value: unknown): value is SidebarDesignId {
  return SIDEBAR_DESIGNS.some((d) => d.id === value);
}

export function applySidebarDesign(chrome: StoreChromeBrand, id: SidebarDesignId): StoreChromeBrand {
  const preset = SIDEBAR_DESIGNS.find((d) => d.id === id) ?? SIDEBAR_DESIGNS[0];
  return {
    ...chrome,
    sidebarDesign: preset.id,
    fill: preset.fill,
    palette: preset.palette,
    gradientFrom: preset.from,
    gradientTo: preset.to,
    customColor: preset.accent,
    bgImage: preset.fill === 'image' ? chrome.bgImage : '',
  };
}

export const CHROME_GRADIENTS: { id: string; from: string; to: string; label: string; labelAr: string }[] = [
  { id: 'navy-gold', from: '#0B1F33', to: '#8A6A2F', label: 'Navy gold', labelAr: 'كحلي وذهبي' },
  { id: 'emerald', from: '#04241C', to: '#0F766E', label: 'Emerald', labelAr: 'زمردي' },
  { id: 'royal', from: '#1E1B4B', to: '#6D28D9', label: 'Royal', labelAr: 'ملكي' },
  { id: 'crimson', from: '#3F0A14', to: '#BE123C', label: 'Crimson', labelAr: 'ياقوتي' },
  { id: 'sand', from: '#3F2A1D', to: '#C4A574', label: 'Sand', labelAr: 'رملي' },
  { id: 'ocean', from: '#082F49', to: '#0284C7', label: 'Ocean', labelAr: 'بحري' },
];

const cacheKey = (storeId: string) => `unityteck_chrome_${storeId}`;

let boundStoreId: string | null = null;
let boundChrome: StoreChromeBrand | null = null;
let chromeRevision = 0;

export function currentChromeRevision(): number {
  return chromeRevision;
}

export function defaultStoreChrome(): StoreChromeBrand {
  return {
    palette: 'holst',
    fill: 'palette',
    customColor: '#1d8b94',
    gradientFrom: '#0B1F33',
    gradientTo: '#8A6A2F',
    bgImage: '',
    sidebarDesign: 'classic',
  };
}

function safeHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const hex = value.trim();
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? hex : fallback;
}

function safeImage(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url || url.length > 2000) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch {
    return '';
  }
  return '';
}

export function parseStoreChrome(raw: unknown): StoreChromeBrand {
  const base = defaultStoreChrome();
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Partial<StoreChromeBrand>;
  const fill: ChromeFill =
    row.fill === 'gradient' || row.fill === 'custom' || row.fill === 'image' ? row.fill : 'palette';
  return {
    palette: isBrandPaletteId(row.palette) ? row.palette : base.palette,
    fill,
    customColor: safeHex(row.customColor, base.customColor),
    gradientFrom: safeHex(row.gradientFrom, base.gradientFrom),
    gradientTo: safeHex(row.gradientTo, base.gradientTo),
    bgImage: safeImage(row.bgImage),
    sidebarDesign: isSidebarDesignId(row.sidebarDesign) ? row.sidebarDesign : 'classic',
  };
}

export function readChromeCache(storeId: string): StoreChromeBrand {
  try {
    const raw = localStorage.getItem(cacheKey(storeId));
    if (!raw) return defaultStoreChrome();
    return parseStoreChrome(JSON.parse(raw));
  } catch {
    return defaultStoreChrome();
  }
}

function writeChromeCache(storeId: string, chrome: StoreChromeBrand): void {
  try {
    localStorage.setItem(cacheKey(storeId), JSON.stringify(chrome));
  } catch {
    /* storage may be unavailable */
  }
}

function rgbOf(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function hexOf(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, target: string, amount: number): string {
  const a = rgbOf(hex);
  const b = rgbOf(target);
  if (!a || !b) return hex;
  return hexOf(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

export function shadesFromHex(hex: string): Pick<BrandPalette, 'p950' | 'p900' | 'p800' | 'p600' | 'p400' | 'p200' | 'p50'> {
  const accent = safeHex(hex, '#1d8b94');
  return {
    p950: mix(accent, '#020617', 0.82),
    p900: mix(accent, '#020617', 0.68),
    p800: mix(accent, '#020617', 0.48),
    p600: accent,
    p400: mix(accent, '#ffffff', 0.28),
    p200: mix(accent, '#ffffff', 0.62),
    p50: mix(accent, '#ffffff', 0.9),
  };
}

function shadesFor(chrome: StoreChromeBrand) {
  if (chrome.fill === 'custom') return shadesFromHex(chrome.customColor);
  if (chrome.fill === 'gradient') return shadesFromHex(chrome.gradientTo);
  return BRAND_PALETTES[chrome.palette] ?? BRAND_PALETTES.holst;
}

function cssUrl(url: string): string {
  return url.replace(/["\\)]/g, '');
}

function designPreset(chrome: StoreChromeBrand): SidebarPreset {
  return SIDEBAR_DESIGNS.find((d) => d.id === chrome.sidebarDesign) ?? SIDEBAR_DESIGNS[0];
}

function designOwnsColors(chrome: StoreChromeBrand): boolean {
  const preset = designPreset(chrome);
  if (chrome.fill !== preset.fill) return false;
  if (preset.fill === 'palette') return chrome.palette === preset.palette;
  return chrome.gradientFrom === preset.from && chrome.gradientTo === preset.to;
}

function paint(root: HTMLElement): void {
  if (!boundChrome || !boundStoreId) {
    root.style.removeProperty('--chrome-sidebar-bg');
    root.style.removeProperty('--chrome-header-bg');
    root.removeAttribute('data-chrome-fill');
    root.removeAttribute('data-chrome-store');
    root.removeAttribute('data-sidebar-design');
    return;
  }
  const chrome = boundChrome;
  const shades = shadesFor(chrome);
  root.style.setProperty('--portal-950', shades.p950);
  root.style.setProperty('--portal-900', shades.p900);
  root.style.setProperty('--portal-800', shades.p800);
  root.style.setProperty('--portal-600', shades.p600);
  root.style.setProperty('--portal-400', shades.p400);
  root.style.setProperty('--portal-200', shades.p200);
  root.style.setProperty('--portal-50', shades.p50);
  root.style.setProperty('--accent', shades.p600);
  root.style.setProperty('--active-bg', shades.p600);
  root.style.setProperty('--active-fg', '#ffffff');
  root.style.setProperty('--active-ring', shades.p400);
  root.style.setProperty('--portal-cta', `linear-gradient(90deg, ${shades.p600}, ${shades.p400})`);
  // Modal/form labels follow the same brand family as header + CTA
  if (root.getAttribute('data-theme') !== 'dark') {
    root.style.setProperty('--text', shades.p950);
    root.style.setProperty('--muted', shades.p900);
    root.style.setProperty('--input-fg', shades.p950);
    root.style.setProperty('--input-ph', shades.p800);
    root.style.setProperty('--table-head', shades.p950);
    root.style.setProperty('--card-fg', shades.p950);
    root.style.setProperty('--icon-on-light', shades.p950);
    root.style.setProperty('--icon-box-fg', shades.p950);
    root.style.setProperty('--border', shades.p200);
  }
  // Keep luxury scrollbar in sync with chrome palette unless a dedicated override is set
  if (!root.hasAttribute('data-custom-scrollbar')) {
    root.style.setProperty('--sb-color', shades.p400);
    root.style.setProperty('--sb-color-deep', shades.p600);
  }
  root.setAttribute('data-chrome-fill', chrome.fill);
  root.setAttribute('data-chrome-store', boundStoreId);
  root.setAttribute('data-sidebar-design', chrome.sidebarDesign || 'classic');
  root.setAttribute('data-brand', chrome.fill === 'palette' ? chrome.palette : 'custom');

  if (chrome.fill === 'gradient') {
    const bar = `linear-gradient(180deg, ${chrome.gradientFrom}, ${chrome.gradientTo})`;
    root.style.setProperty('--chrome-sidebar-bg', bar);
    root.style.setProperty(
      '--chrome-header-bg',
      `linear-gradient(90deg, color-mix(in srgb, ${chrome.gradientFrom} 16%, var(--surface)), color-mix(in srgb, ${chrome.gradientTo} 16%, var(--surface)))`,
    );
  } else if (chrome.fill === 'image' && chrome.bgImage) {
    const image = cssUrl(chrome.bgImage);
    root.style.setProperty(
      '--chrome-sidebar-bg',
      `linear-gradient(180deg, rgba(4,16,28,0.78), rgba(4,16,28,0.88)), url("${image}")`,
    );
    root.style.setProperty(
      '--chrome-header-bg',
      `linear-gradient(color-mix(in srgb, var(--surface) 88%, transparent), color-mix(in srgb, var(--surface) 88%, transparent)), url("${image}")`,
    );
  } else {
    root.style.removeProperty('--chrome-sidebar-bg');
    root.style.setProperty(
      '--chrome-header-bg',
      `linear-gradient(90deg, color-mix(in srgb, ${shades.p600} 12%, var(--surface)), var(--surface))`,
    );
  }

  if (!designOwnsColors(chrome)) return;
  const preset = designPreset(chrome);
  // Keep modal headers / sidebar deep tone on the SAME palette as CTA (no teal/green split).
  const designPalette = BRAND_PALETTES[preset.palette] ?? shades;
  root.style.setProperty('--portal-950', designPalette.p950);
  root.style.setProperty('--portal-900', designPalette.p900);
  root.style.setProperty('--portal-800', designPalette.p800);
  root.style.setProperty('--portal-200', preset.idle);
  root.style.setProperty('--portal-400', preset.accent);
  root.style.setProperty('--portal-600', preset.accent);
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--active-bg', preset.accent);
  root.style.setProperty('--active-fg', preset.activeFg);
  root.style.setProperty('--active-ring', preset.accent);
  root.style.setProperty('--portal-cta', preset.cta);
  if (root.getAttribute('data-theme') !== 'dark') {
    root.style.setProperty('--text', designPalette.p950);
    root.style.setProperty('--muted', designPalette.p900);
    root.style.setProperty('--input-fg', designPalette.p950);
    root.style.setProperty('--input-ph', designPalette.p800);
    root.style.setProperty('--table-head', designPalette.p950);
    root.style.setProperty('--card-fg', designPalette.p950);
    root.style.setProperty('--icon-on-light', designPalette.p950);
    root.style.setProperty('--icon-box-fg', designPalette.p950);
    root.style.setProperty('--border', designPalette.p200);
  }
  if (!root.hasAttribute('data-custom-scrollbar')) {
    root.style.setProperty('--sb-color', preset.accent);
    root.style.setProperty('--sb-color-deep', designPalette.p600);
  }
}

setChromePainter(paint);

export function bindStoreChrome(storeId: string, chrome: StoreChromeBrand): void {
  chromeRevision += 1;
  boundStoreId = storeId;
  boundChrome = chrome;
  paint(document.documentElement);
}

export function clearStoreChrome(): void {
  chromeRevision += 1;
  boundStoreId = null;
  boundChrome = null;
  paint(document.documentElement);
}

export async function loadStoreChrome(storeId: string): Promise<StoreChromeBrand> {
  const cached = readChromeCache(storeId);
  try {
    const res = await apiFetch<{ success?: boolean; data?: Record<string, unknown> }>(
      `/stores/${encodeURIComponent(storeId)}/store-settings`,
      { storeId },
    );
    const remote = res?.data?.chromeBrand;
    if (remote) {
      const parsed = parseStoreChrome(remote);
      writeChromeCache(storeId, parsed);
      return parsed;
    }
  } catch {
    return cached;
  }
  return cached;
}

export async function saveStoreChrome(storeId: string, chrome: StoreChromeBrand): Promise<void> {
  const next = parseStoreChrome(chrome);
  writeChromeCache(storeId, next);
  bindStoreChrome(storeId, next);
  await apiFetch(`/stores/${encodeURIComponent(storeId)}/store-settings`, {
    method: 'PUT',
    storeId,
    body: { settings: { chromeBrand: next } },
  });
}
