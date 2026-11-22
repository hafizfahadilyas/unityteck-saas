/**
 * Per-store dashboard chrome: palette, gradient, custom color, background image.
 * Saved on store_settings.settings.chromeBrand (store_id). Never copied across stores.
 */
import {
  apiFetch,
  getApiBase,
  liveApiBaseForStore,
  preferLiveApiInDev,
  resolveApiBaseForStore,
} from '../api/client';
import { setChromePainter } from './chromePainter';
import {
  AR_FONTS,
  BRAND_PALETTES,
  applyStoreArabicTypography,
  isBrandPaletteId,
  type BrandFontArId,
  type BrandFontWeight,
  type BrandPalette,
  type BrandPaletteId,
} from './branding';
import {
  getChromeImageBlob,
  hydrateChromeImageUrl,
  hydrateStoreChromeImages,
  isChromeIdbUrl,
  parseChromeIdbUrl,
  resolveChromeImageUrlSync,
  type ChromeImageField,
} from './storeChromeImageStore';
import {
  cachedShellWallpaperLuma,
  sampleShellWallpaperLuma,
  type ShellLuma,
} from './shellWallpaperLuma';

export type ChromeFill = 'palette' | 'gradient' | 'custom' | 'image';
export type SidebarDesignId = 'classic' | 'navy' | 'emerald' | 'minimal' | 'luxe';
/** Glass admin shell wallpaper behind frosted panels (store portal only). */
export type ShellWallpaperPreset = 'city-warm' | 'peach-lavender' | 'soft-night' | 'custom';
/**
 * Platform default glass wallpaper (all stores after login).
 * Color gradient presets are retired — empty chrome always resolves here.
 */
export const DEFAULT_SHELL_WALLPAPER_URL = '/images/shell-wallpaper-default.webp';

/** Resolve paint/upload URL: merchant custom wins, else platform default image. */
export function resolveShellWallpaperUrl(
  urlOrChrome?: string | { shellWallpaper?: string | null } | null,
): string {
  const raw =
    typeof urlOrChrome === 'string'
      ? urlOrChrome
      : typeof urlOrChrome?.shellWallpaper === 'string'
        ? urlOrChrome.shellWallpaper
        : '';
  const trimmed = raw.trim();
  return trimmed || DEFAULT_SHELL_WALLPAPER_URL;
}

/** True when URL is empty or the shared platform default (not a merchant upload). */
export function isDefaultShellWallpaper(url: unknown): boolean {
  if (typeof url !== 'string') return true;
  const t = url.trim();
  if (!t) return true;
  if (t === DEFAULT_SHELL_WALLPAPER_URL) return true;
  return /(^|\/)images\/shell-wallpaper-default\.webp(\?|#|$)/i.test(t);
}

/** Full dashboard look packs (sidebar + wallpaper + colors) — exactly 2. */
export type DashboardLookId = 'glass' | 'night';

/** Page chrome title ink over wallpaper: auto = sample photo; light/dark = force; custom = pageTextColor. */
export type ShellTextMode = 'auto' | 'light' | 'dark' | 'custom';

export type StoreChromeBrand = {
  palette: BrandPaletteId;
  fill: ChromeFill;
  customColor: string;
  gradientFrom: string;
  gradientTo: string;
  bgImage: string;
  sidebarDesign: SidebarDesignId;
  /** Preset ambient wash behind glass UI */
  shellWallpaperPreset: ShellWallpaperPreset;
  /** Custom wallpaper image URL when preset is `custom` (or overrides preset) */
  shellWallpaper: string;
  /** Custom wallpaper blur in px (0–24). Applies to BG image layer only. */
  shellWallpaperBlur: number;
  /** Custom wallpaper opacity 0.15–1. */
  shellWallpaperOpacity: number;
  /**
   * Store-owner global page background (admin). Empty = follow palette / wallpaper.
   * Persisted per store_id in chromeBrand.
   */
  pageBgColor?: string;
  /**
   * Store-owner global page / title text color. Empty = follow shell luma / theme.
   */
  pageTextColor?: string;
  /** How page titles pick ink over wallpaper (auto / light / dark / custom hex). */
  shellTextMode?: ShellTextMode;
  /** Active full-dashboard look pack (glass | night). */
  dashboardLookId?: DashboardLookId;
  /** Per-store Arabic UI font (store_id isolated). */
  fontAr?: BrandFontArId;
  /** Per-store font weight: light | regular | bold | medium. */
  fontWeight?: BrandFontWeight;
  /** Custom Arabic family when fontAr === custom-ar. */
  customFontFamilyAr?: string | null;
  /** Optional Google Fonts / CSS URL for custom Arabic face. */
  customFontUrlAr?: string | null;
  /** Last local/API write — newer cache must not be wiped by stale remote load. */
  updatedAt?: number;
};

export function isShellTextMode(value: unknown): value is ShellTextMode {
  return value === 'auto' || value === 'light' || value === 'dark' || value === 'custom';
}

/** In-memory live wallpaper while upload is still ephemeral (blob/data). */
const pendingChromeByStore = new Map<string, StoreChromeBrand>();

/** Survives refresh — blocks IDB/cache restore after intentional wallpaper/bg remove. */
const clearFlagsKey = (storeId: string) => `unityteck_chrome_cleared_${storeId}`;

type ChromeClearFlags = { shellWallpaper?: number; bgImage?: number };

function readClearFlags(storeId: string): ChromeClearFlags {
  if (!storeId || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(clearFlagsKey(storeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ChromeClearFlags;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeClearFlags(storeId: string, flags: ChromeClearFlags): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  try {
    const next = { ...readClearFlags(storeId), ...flags };
    if (!next.shellWallpaper && !next.bgImage) {
      localStorage.removeItem(clearFlagsKey(storeId));
      return;
    }
    localStorage.setItem(clearFlagsKey(storeId), JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

/** Call when merchant clears or uploads glass wallpaper / sidebar bg. */
export function markChromeImageCleared(
  storeId: string,
  field: ChromeImageField,
  cleared: boolean,
): void {
  if (!storeId) return;
  const flags = readClearFlags(storeId);
  if (cleared) {
    flags[field] = Date.now();
  } else {
    delete flags[field];
  }
  writeClearFlags(storeId, flags);
}

function isChromeImageCleared(storeId: string, field: ChromeImageField): boolean {
  return Boolean(readClearFlags(storeId)[field]);
}

function clampBlur(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 10;
  return Math.max(0, Math.min(24, Math.round(v)));
}

function clampOpacity(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0.92;
  return Math.max(0.15, Math.min(1, Math.round(v * 100) / 100));
}

/** @deprecated Color gradient presets removed — default is always the platform image. */
export const SHELL_WALLPAPER_PRESETS: Array<{
  id: Exclude<ShellWallpaperPreset, 'custom'>;
  label: string;
  labelAr: string;
}> = [];

export function isShellWallpaperPreset(value: unknown): value is ShellWallpaperPreset {
  return value === 'city-warm' || value === 'peach-lavender' || value === 'soft-night' || value === 'custom';
}

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
  const keepBg = Boolean((chrome.bgImage || '').trim());
  return {
    ...chrome,
    shellWallpaperPreset: 'custom',
    shellWallpaper: resolveShellWallpaperUrl(chrome),
    shellWallpaperBlur: clampBlur(chrome.shellWallpaperBlur),
    shellWallpaperOpacity: clampOpacity(chrome.shellWallpaperOpacity),
    sidebarDesign: preset.id,
    // Merchant sidebar wallpaper wins — never wipe on design pack click
    fill: keepBg ? 'image' : preset.fill,
    palette: preset.palette,
    gradientFrom: preset.from,
    gradientTo: preset.to,
    customColor: preset.accent,
    bgImage: keepBg ? chrome.bgImage : '',
    updatedAt: Date.now(),
  };
}

export type DashboardLookPack = {
  id: DashboardLookId;
  label: string;
  labelAr: string;
  toastEn: string;
  toastAr: string;
  chrome: Pick<
    StoreChromeBrand,
    | 'palette'
    | 'fill'
    | 'customColor'
    | 'gradientFrom'
    | 'gradientTo'
    | 'sidebarDesign'
    | 'shellWallpaperPreset'
    | 'shellWallpaperBlur'
    | 'shellWallpaperOpacity'
  >;
};

/** Exactly two full-dashboard looks — sidebar + colors (wallpaper = fixed platform image). */
export const DASHBOARD_LOOK_PACKS: DashboardLookPack[] = [
  {
    id: 'glass',
    label: 'Glass Soft',
    labelAr: 'زجاج ناعم',
    toastEn: 'Glass Soft look applied',
    toastAr: 'تم تطبيق مظهر الزجاج الناعم',
    chrome: {
      palette: 'holst',
      fill: 'palette',
      customColor: '#1e293b',
      gradientFrom: '#0A3D4A',
      gradientTo: '#1D8B94',
      sidebarDesign: 'classic',
      shellWallpaperPreset: 'custom',
      shellWallpaperBlur: 10,
      shellWallpaperOpacity: 0.92,
    },
  },
  {
    id: 'night',
    label: 'Night Luxe',
    labelAr: 'ليل فاخر',
    toastEn: 'Night Luxe look applied',
    toastAr: 'تم تطبيق مظهر الليل الفاخر',
    chrome: {
      palette: 'bronze',
      fill: 'gradient',
      customColor: '#E7D3A1',
      gradientFrom: '#2A2118',
      gradientTo: '#6B4E2E',
      sidebarDesign: 'luxe',
      shellWallpaperPreset: 'custom',
      shellWallpaperBlur: 12,
      shellWallpaperOpacity: 0.9,
    },
  },
];

export function isDashboardLookId(value: unknown): value is DashboardLookId {
  return value === 'glass' || value === 'night';
}

/** Infer pack from chrome when dashboardLookId missing (legacy rows). */
export function resolveDashboardLookId(chrome: StoreChromeBrand): DashboardLookId {
  if (isDashboardLookId(chrome.dashboardLookId)) return chrome.dashboardLookId;
  if (chrome.sidebarDesign === 'luxe' || chrome.sidebarDesign === 'navy') {
    return 'night';
  }
  return 'glass';
}

/**
 * Apply a full dashboard look pack (sidebar + colors).
 * Merchant custom wallpaper / sidebar images are kept — never wiped by a look toggle.
 * Empty wallpaper falls back to the platform default image (not color gradients).
 */
export function applyDashboardLookPack(
  chrome: StoreChromeBrand,
  id: DashboardLookId,
): StoreChromeBrand {
  const pack = DASHBOARD_LOOK_PACKS.find((p) => p.id === id) ?? DASHBOARD_LOOK_PACKS[0];
  const keepShell = Boolean((chrome.shellWallpaper || '').trim()) && !isDefaultShellWallpaper(chrome.shellWallpaper);
  const keepBg = Boolean((chrome.bgImage || '').trim());
  return {
    ...chrome,
    ...pack.chrome,
    dashboardLookId: pack.id,
    shellWallpaper: keepShell ? chrome.shellWallpaper : DEFAULT_SHELL_WALLPAPER_URL,
    shellWallpaperPreset: 'custom',
    shellWallpaperBlur: keepShell
      ? clampBlur(chrome.shellWallpaperBlur)
      : pack.chrome.shellWallpaperBlur,
    shellWallpaperOpacity: keepShell
      ? clampOpacity(chrome.shellWallpaperOpacity)
      : pack.chrome.shellWallpaperOpacity,
    bgImage: keepBg ? chrome.bgImage : '',
    fill: keepBg ? 'image' : pack.chrome.fill,
    updatedAt: Date.now(),
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
    customColor: '#1e293b',
    gradientFrom: '#0B1F33',
    gradientTo: '#8A6A2F',
    bgImage: '',
    sidebarDesign: 'classic',
    shellWallpaperPreset: 'custom',
    shellWallpaper: DEFAULT_SHELL_WALLPAPER_URL,
    shellWallpaperBlur: 10,
    shellWallpaperOpacity: 0.92,
    pageBgColor: '',
    pageTextColor: '',
    shellTextMode: 'auto',
    dashboardLookId: 'glass',
  };
}

function safeHex(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const hex = value.trim();
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? hex : fallback;
}

/** Optional owner hex — empty string clears override. */
function optionalHex(value: unknown): string {
  if (typeof value !== 'string') return '';
  const hex = value.trim();
  if (!hex) return '';
  return /^#([0-9a-fA-F]{6})$/.test(hex) ? hex : '';
}

/** blob:/data: previews — live paint OK until chrome-idb or CDN URL replaces them. */
export function isEphemeralImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (isChromeIdbUrl(url)) return false;
  return url.startsWith('blob:') || url.startsWith('data:image/');
}

/** Local durable or remote URL (never volatile blob/data for cache). */
export function isPersistableChromeImageUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const url = value.trim();
  if (!url) return false;
  if (isChromeIdbUrl(url)) return true;
  if (url.length > 4000) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Persistable store image (CDN /storage / http / chrome-idb). Ephemeral previews stay live-only. */
function safeImage(value: unknown, opts?: { allowEphemeral?: boolean; allowIdb?: boolean }): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url) return '';
  if ((opts?.allowIdb ?? true) && isChromeIdbUrl(url)) return url;
  if (opts?.allowEphemeral && isEphemeralImageUrl(url)) {
    // data: can be huge — keep for live paint only (never localStorage / API)
    if (url.startsWith('data:') && url.length > 2_000_000) return '';
    return url;
  }
  if (url.length > 4000) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return url;
  } catch {
    return '';
  }
  return '';
}

/** API / Hostinger body — remote URLs only (no blob/data/chrome-idb). */
function apiSafeImage(value: unknown): string {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url || isChromeIdbUrl(url) || isEphemeralImageUrl(url)) return '';
  return safeImage(url, { allowIdb: false });
}

/** Live media host for this store (coffee→mieraf, flowers→giftshop). */
export function mediaOriginForStore(storeId?: string | null): string {
  const api = liveApiBaseForStore(storeId || undefined);
  return String(api || '').replace(/\/api\/?$/i, '');
}

/**
 * Resolve chrome/media URL for paint + preview.
 * Relative `/images/...` must hit the store's Hostinger host — never localhost/Vite 404.
 */
export function absolutePaintUrl(url: string, storeId?: string | null): string {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  const fromIdb = resolveChromeImageUrlSync(trimmed);
  if (isChromeIdbUrl(trimmed)) return fromIdb || '';
  if (fromIdb && fromIdb !== trimmed) return fromIdb;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    // Bundled platform default stays on the admin SPA host (public/), never Hostinger /uploads
    if (isDefaultShellWallpaper(trimmed)) {
      const pathOnly = trimmed.split(/[?#]/)[0] || DEFAULT_SHELL_WALLPAPER_URL;
      if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}${pathOnly}`;
      }
      return pathOnly;
    }
    const sid = storeId || boundStoreId;
    const isUploadPath =
      trimmed.startsWith('/images/') ||
      trimmed.startsWith('/storage/') ||
      trimmed.startsWith('/uploads/');
    if (isUploadPath) {
      const live = mediaOriginForStore(sid);
      if (live) return `${live}${trimmed}`;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}${trimmed}`;
    }
    const fallback = mediaOriginForStore(sid);
    return fallback ? `${fallback}${trimmed}` : trimmed;
  }
  return trimmed;
}

/** Mark live ephemeral/custom wallpaper immediately (before debounce save). */
export function rememberPendingChrome(storeId: string, chrome: StoreChromeBrand): void {
  if (!storeId) return;
  pendingChromeByStore.set(storeId, parseStoreChrome(chrome));
}

export function clearPendingChrome(storeId: string): void {
  if (!storeId) return;
  pendingChromeByStore.delete(storeId);
}

export function parseStoreChrome(raw: unknown): StoreChromeBrand {
  const base = defaultStoreChrome();
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Partial<StoreChromeBrand>;
  const fill: ChromeFill =
    row.fill === 'gradient' || row.fill === 'custom' || row.fill === 'image' ? row.fill : 'palette';
  // Empty / legacy color presets → platform default image (all stores)
  const shellWallpaper =
    safeImage(row.shellWallpaper, { allowEphemeral: true }) || DEFAULT_SHELL_WALLPAPER_URL;
  const shellWallpaperPreset: ShellWallpaperPreset = 'custom';
  const updatedAtRaw = (row as { updatedAt?: unknown }).updatedAt;
  const updatedAt =
    typeof updatedAtRaw === 'number' && Number.isFinite(updatedAtRaw) && updatedAtRaw > 0
      ? Math.round(updatedAtRaw)
      : undefined;
  const dashboardLookId = isDashboardLookId(row.dashboardLookId)
    ? row.dashboardLookId
    : undefined;
  const pageBgColor = optionalHex(row.pageBgColor);
  const pageTextColor = optionalHex(row.pageTextColor);
  const shellTextMode: ShellTextMode = isShellTextMode(row.shellTextMode)
    ? row.shellTextMode
    : pageTextColor
      ? 'custom'
      : 'auto';
  const fontArRaw = typeof row.fontAr === 'string' ? row.fontAr : '';
  const fontAr: BrandFontArId | undefined = AR_FONTS.includes(fontArRaw as BrandFontArId)
    ? (fontArRaw as BrandFontArId)
    : undefined;
  const fontWeightRaw = typeof row.fontWeight === 'string' ? row.fontWeight : '';
  const fontWeight: BrandFontWeight | undefined =
    fontWeightRaw === 'light' ||
    fontWeightRaw === 'regular' ||
    fontWeightRaw === 'bold' ||
    fontWeightRaw === 'medium'
      ? fontWeightRaw
      : undefined;
  const customFontFamilyAr =
    typeof row.customFontFamilyAr === 'string' && row.customFontFamilyAr.trim()
      ? row.customFontFamilyAr.trim().slice(0, 80)
      : row.customFontFamilyAr === null
        ? null
        : undefined;
  const customFontUrlAr =
    typeof row.customFontUrlAr === 'string' && row.customFontUrlAr.trim()
      ? row.customFontUrlAr.trim().slice(0, 500)
      : row.customFontUrlAr === null
        ? null
        : undefined;
  return {
    palette: isBrandPaletteId(row.palette) ? row.palette : base.palette,
    fill,
    customColor: safeHex(row.customColor, base.customColor),
    gradientFrom: safeHex(row.gradientFrom, base.gradientFrom),
    gradientTo: safeHex(row.gradientTo, base.gradientTo),
    bgImage: safeImage(row.bgImage, { allowEphemeral: true }),
    sidebarDesign: isSidebarDesignId(row.sidebarDesign) ? row.sidebarDesign : 'classic',
    shellWallpaperPreset,
    shellWallpaper,
    shellWallpaperBlur: clampBlur(
      (row as { shellWallpaperBlur?: unknown }).shellWallpaperBlur ?? base.shellWallpaperBlur,
    ),
    shellWallpaperOpacity: clampOpacity(
      (row as { shellWallpaperOpacity?: unknown }).shellWallpaperOpacity ?? base.shellWallpaperOpacity,
    ),
    pageBgColor,
    pageTextColor,
    shellTextMode,
    ...(dashboardLookId ? { dashboardLookId } : {}),
    ...(fontAr ? { fontAr } : {}),
    ...(fontWeight ? { fontWeight } : {}),
    ...(customFontFamilyAr !== undefined ? { customFontFamilyAr } : {}),
    ...(customFontUrlAr !== undefined ? { customFontUrlAr } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

/** Prefer newer chrome; never let empty remote wipe local wallpaper / blur / design. */
function mergeChromePreferNewest(
  remote: StoreChromeBrand,
  local: StoreChromeBrand,
  storeId?: string,
): StoreChromeBrand {
  const remoteTs = remote.updatedAt || 0;
  const localTs = local.updatedAt || 0;
  // Equal / missing timestamps → keep local cache (stops settings snap-back after load)
  const preferLocal = localTs >= remoteTs;
  const newer = preferLocal ? local : remote;
  const older = preferLocal ? remote : local;
  let shellWallpaper = newer.shellWallpaper;
  let bgImage = newer.bgImage;
  /*
   * Empty preferred side must NOT wipe durable art from the other side —
   * unless merchant intentionally cleared (pending / clear-flag / newer stamp + '').
   * Cleared glass wallpaper restores the platform default image (not color gradients).
   */
  const shellCleared =
    Boolean(storeId && isChromeImageCleared(storeId, 'shellWallpaper')) ||
    (isDefaultShellWallpaper(newer.shellWallpaper) &&
      !isDefaultShellWallpaper(older.shellWallpaper) &&
      (newer.updatedAt || 0) > (older.updatedAt || 0)) ||
    (!newer.shellWallpaper && (newer.updatedAt || 0) > (older.updatedAt || 0));
  const bgCleared =
    Boolean(storeId && isChromeImageCleared(storeId, 'bgImage')) ||
    (!newer.bgImage && (newer.updatedAt || 0) > (older.updatedAt || 0));
  if (shellCleared) {
    shellWallpaper = DEFAULT_SHELL_WALLPAPER_URL;
  } else if (isDefaultShellWallpaper(shellWallpaper) && !isDefaultShellWallpaper(older.shellWallpaper)) {
    shellWallpaper = older.shellWallpaper;
  } else if (!shellWallpaper && older.shellWallpaper) {
    shellWallpaper = older.shellWallpaper;
  }
  if (!bgImage && older.bgImage && !bgCleared) {
    bgImage = older.bgImage;
  }
  shellWallpaper = resolveShellWallpaperUrl(shellWallpaper);
  const shellWallpaperPreset: ShellWallpaperPreset = 'custom';
  return {
    ...older,
    ...newer,
    shellWallpaper,
    shellWallpaperPreset,
    shellWallpaperBlur: clampBlur(
      shellWallpaper
        ? newer.shellWallpaper
          ? newer.shellWallpaperBlur
          : older.shellWallpaperBlur
        : newer.shellWallpaperBlur,
    ),
    shellWallpaperOpacity: clampOpacity(
      shellWallpaper
        ? newer.shellWallpaper
          ? newer.shellWallpaperOpacity
          : older.shellWallpaperOpacity
        : newer.shellWallpaperOpacity,
    ),
    bgImage,
    fill: (bgImage ? 'image' : newer.fill === 'image' ? 'palette' : newer.fill) as ChromeFill,
    updatedAt: Math.max(remoteTs, localTs) || undefined,
  };
}

function chromeApiOpts(storeId: string): { baseUrl?: string; timeoutMs: number } {
  // Coffee/bleco → mieraf MySQL; flowers → giftshop (never cross-write chromeBrand)
  const resolved = preferLiveApiInDev()
    ? liveApiBaseForStore(storeId)
    : resolveApiBaseForStore(storeId);
  /*
   * Browser DEV: never force absolute mieraf/giftshop for multipart media —
   * that triggers CORS from localhost. Use Vite `/api` proxy instead.
   * JSON chromeBrand may still use live base when preferLiveApiInDev is on.
   */
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return { timeoutMs: 90_000 };
    }
  }
  if (resolved && resolved !== getApiBase()) {
    return { baseUrl: resolved, timeoutMs: 90_000 };
  }
  return { timeoutMs: 90_000 };
}

/**
 * Push chrome-idb blobs to /media then return chrome with CDN/storage URLs.
 * Keeps local IDB as offline backup until CDN URL is confirmed in settings.
 */
async function syncChromeImagesToApi(
  storeId: string,
  chrome: StoreChromeBrand,
): Promise<StoreChromeBrand> {
  const { isApiEnabled } = await import('../api/client');
  if (!isApiEnabled() || !storeId) return chrome;

  const apiOpts = chromeApiOpts(storeId);
  let next = { ...chrome };
  const fields: ChromeImageField[] = ['shellWallpaper', 'bgImage'];
  for (const field of fields) {
    const current = next[field];
    if (!isChromeIdbUrl(current)) continue;
    try {
      const blob = await getChromeImageBlob(storeId, field);
      if (!blob) continue;
      const ext = (blob.type || '').includes('png') ? 'png' : 'webp';
      const file = new File([blob], `chrome-${field}-${storeId}.${ext}`, {
        type: blob.type || 'image/webp',
      });
      const { uploadMediaFile } = await import('../api/tenantApi');
      const asset = await uploadMediaFile(storeId, file, {
        alt: field === 'shellWallpaper' ? 'Dashboard wallpaper' : 'Sidebar background',
        folder: 'chrome',
        baseUrl: apiOpts.baseUrl,
        timeoutMs: apiOpts.timeoutMs,
      });
      const remote = asset.optimizedUrl || asset.originalUrl;
      if (remote) {
        next = {
          ...next,
          [field]: remote,
          ...(field === 'shellWallpaper'
            ? { shellWallpaperPreset: 'custom' as ShellWallpaperPreset }
            : { fill: 'image' as ChromeFill }),
        };
      }
    } catch {
      /* keep chrome-idb until API is up */
    }
  }
  return next;
}

/** Strip blob/data before localStorage. Keep chrome-idb:// + remote URLs. */
function persistableStoreChrome(chrome: StoreChromeBrand): StoreChromeBrand {
  const shellWallpaper =
    safeImage(chrome.shellWallpaper, { allowIdb: true }) || DEFAULT_SHELL_WALLPAPER_URL;
  const bgImage = safeImage(chrome.bgImage, { allowIdb: true });
  return {
    ...chrome,
    shellWallpaper,
    shellWallpaperPreset: 'custom',
    bgImage,
    fill: chrome.fill === 'image' && !bgImage ? 'palette' : chrome.fill,
  };
}

/**
 * Remote PUT body only — never send blob/data/chrome-idb to Hostinger.
 * When paint is still local (idb/blob), keep the last known remote URL so
 * a sync race cannot wipe wallpaper/sidebar images from store_settings.
 */
function apiPersistableStoreChrome(
  chrome: StoreChromeBrand,
  previousRemote?: StoreChromeBrand,
): StoreChromeBrand {
  let shellWallpaper = apiSafeImage(chrome.shellWallpaper);
  let bgImage = apiSafeImage(chrome.bgImage);
  const shellPendingLocal =
    isChromeIdbUrl(chrome.shellWallpaper) || isEphemeralImageUrl(chrome.shellWallpaper);
  const bgPendingLocal = isChromeIdbUrl(chrome.bgImage) || isEphemeralImageUrl(chrome.bgImage);
  if (!shellWallpaper && shellPendingLocal) {
    shellWallpaper = apiSafeImage(previousRemote?.shellWallpaper) || '';
  }
  if (!bgImage && bgPendingLocal) {
    bgImage = apiSafeImage(previousRemote?.bgImage) || '';
  }
  // Intentional clear → platform default image (never empty color presets).
  if ((!chrome.shellWallpaper || isDefaultShellWallpaper(chrome.shellWallpaper)) && !shellPendingLocal) {
    shellWallpaper = DEFAULT_SHELL_WALLPAPER_URL;
  }
  if (!chrome.bgImage && !bgPendingLocal) bgImage = '';
  return {
    ...chrome,
    shellWallpaper: shellWallpaper || DEFAULT_SHELL_WALLPAPER_URL,
    shellWallpaperPreset: 'custom',
    bgImage,
    fill: bgImage ? 'image' : chrome.fill === 'image' ? 'palette' : chrome.fill,
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
    // Never stash blob:/huge data: into localStorage
    localStorage.setItem(cacheKey(storeId), JSON.stringify(persistableStoreChrome(chrome)));
  } catch {
    /* storage may be unavailable */
  }
}

/** Immediate localStorage paint for Settings (before debounce save) — keeps IDB refs. */
export function cacheStoreChromeNow(storeId: string, chrome: StoreChromeBrand): void {
  if (!storeId) return;
  const live = parseStoreChrome({ ...chrome, updatedAt: chrome.updatedAt || Date.now() });
  const prev = readChromeCache(storeId);
  const base = persistableStoreChrome(live);
  // Blob preview in flight → keep prior durable URL; intentional '' clear must stay empty
  const shellWallpaper =
    base.shellWallpaper ||
    (isEphemeralImageUrl(live.shellWallpaper) ? prev.shellWallpaper : '');
  const bgImage =
    base.bgImage || (isEphemeralImageUrl(live.bgImage) ? prev.bgImage : '');
  writeChromeCache(storeId, {
    ...base,
    shellWallpaper,
    bgImage,
    shellWallpaperPreset: shellWallpaper
      ? 'custom'
      : live.shellWallpaperPreset || base.shellWallpaperPreset,
    fill: bgImage ? 'image' : base.fill === 'image' ? 'palette' : base.fill,
    updatedAt: live.updatedAt,
  });
}

function rgbOf(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function isDarkHexColor(hex: string): boolean {
  const rgb = rgbOf(hex);
  if (!rgb) return true;
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma < 0.48;
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

function clearShellInlineWallpaper(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.removeProperty('--store-shell-wallpaper');
  root.style.removeProperty('--store-shell-wallpaper-blur');
  root.style.removeProperty('--store-shell-wallpaper-opacity');
  document.querySelectorAll<HTMLElement>('.unity-shell[data-portal="store"]').forEach((el) => {
    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-repeat');
    el.style.removeProperty('background-attachment');
  });
}

function applyShellInlineWallpaper(
  imageUrl: string,
  blurPx: number,
  opacity: number,
  cacheKey?: number | string,
  shellLuma: ShellLuma = 'dark',
): void {
  if (typeof document === 'undefined') return;
  let painted = absolutePaintUrl(imageUrl, boundStoreId);
  if (!painted) {
    clearShellInlineWallpaper();
    return;
  }
  // Same path overwritten → force browser/CDN repaint (sidebar + shell bg)
  if (cacheKey != null && String(cacheKey) && !painted.startsWith('data:') && !painted.startsWith('blob:')) {
    const stamp = encodeURIComponent(String(cacheKey));
    painted = /[?&]v=/.test(painted)
      ? painted.replace(/([?&]v=)[^&]*/i, `$1${stamp}`)
      : `${painted}${painted.includes('?') ? '&' : '?'}v=${stamp}`;
  }
  const root = document.documentElement;
  // ::before layer in portal-tokens applies blur/opacity without blurring UI chrome
  root.style.setProperty('--store-shell-wallpaper', `url("${cssUrl(painted)}")`);
  root.style.setProperty('--store-shell-wallpaper-blur', `${clampBlur(blurPx)}px`);
  root.style.setProperty('--store-shell-wallpaper-opacity', String(clampOpacity(opacity)));
  // Scrim adapts to photo brightness so page titles stay readable (light→dark ink, dark→light ink)
  const scrim =
    shellLuma === 'light'
      ? 'linear-gradient(180deg, rgba(248, 250, 252, 0.55), rgba(241, 245, 249, 0.42))'
      : 'linear-gradient(180deg, rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.68))';
  document.querySelectorAll<HTMLElement>('.unity-shell[data-portal="store"]').forEach((el) => {
    el.style.setProperty('background-image', scrim, 'important');
    el.style.setProperty('background-size', 'cover', 'important');
    el.style.setProperty('background-position', 'center', 'important');
    el.style.setProperty('background-repeat', 'no-repeat', 'important');
    el.style.setProperty('background-attachment', 'fixed', 'important');
  });
}

function paint(root: HTMLElement): void {
  if (!boundChrome || !boundStoreId) {
    root.style.removeProperty('--chrome-sidebar-bg');
    root.style.removeProperty('--chrome-header-bg');
    root.style.removeProperty('--store-shell-wallpaper');
    // Let BrandingPanel / CSS tokens own --bg again (still one global canvas)
    root.removeAttribute('data-chrome-fill');
    root.removeAttribute('data-chrome-store');
    root.removeAttribute('data-sidebar-design');
    root.removeAttribute('data-shell-wallpaper');
    root.removeAttribute('data-shell-luma');
    root.removeAttribute('data-shell-text-mode');
    root.removeAttribute('data-sidebar-luma');
    clearShellInlineWallpaper();
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
  // Owner custom text/bg (chromeBrand or BrandingPanel data-custom-*) win over palette defaults
  const ownerText =
    optionalHex(chrome.pageTextColor) || root.getAttribute('data-custom-text') || '';
  const ownerBg =
    optionalHex(chrome.pageBgColor) || root.getAttribute('data-custom-bg') || '';
  if (root.getAttribute('data-theme') !== 'dark') {
    const ink = ownerText || '#0f172a';
    root.style.setProperty('--text', ink);
    root.style.setProperty('--muted', ownerText ? mix(ink, '#64748b', 0.45) : '#475569');
    root.style.setProperty('--input-fg', ink);
    root.style.setProperty('--input-ph', shades.p800);
    root.style.setProperty('--table-head', ink);
    root.style.setProperty('--card-fg', ink);
    root.style.setProperty('--icon-on-light', ink);
    root.style.setProperty('--icon-box-fg', ink);
    root.style.setProperty('--border', 'transparent');
    root.style.setProperty('--table-border', 'rgba(15, 23, 42, 0.16)');
    root.style.setProperty('--table-border-strong', 'rgba(15, 23, 42, 0.22)');
    if (ownerText) root.setAttribute('data-custom-text', ownerText);
    else if (!root.getAttribute('data-custom-text')) {
      /* BrandingPanel may set later */
    }
    if (ownerBg) root.setAttribute('data-custom-bg', ownerBg);
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

  // Per-store Arabic font + weight (isolated by store_id chromeBrand)
  if (chrome.fontAr || chrome.fontWeight || chrome.customFontFamilyAr || chrome.customFontUrlAr) {
    const localeAttr = (root.getAttribute('lang') || 'ar') === 'en' ? 'en' : 'ar';
    applyStoreArabicTypography(
      {
        fontAr: chrome.fontAr,
        fontWeight: chrome.fontWeight,
        customFontFamilyAr: chrome.customFontFamilyAr,
        customFontUrlAr: chrome.customFontUrlAr,
      },
      localeAttr,
    );
  }

  // Glass shell wallpaper — always a photo (platform default or merchant custom). Color presets retired.
  const wallpaperUrl = resolveShellWallpaperUrl(chrome);
  root.setAttribute('data-shell-wallpaper', 'custom');
  /*
   * Page title ink:
   * - shellTextMode light/dark/custom → store owner force
   * - Photo + auto → sample image luma (default mountain is bright → light shell)
   */
  const textMode: ShellTextMode = isShellTextMode(chrome.shellTextMode)
    ? chrome.shellTextMode
    : ownerText
      ? 'custom'
      : 'auto';
  let shellLuma: ShellLuma =
    textMode === 'light'
      ? 'light'
      : textMode === 'dark'
        ? 'dark'
        : textMode === 'custom' && ownerText
          ? isDarkHexColor(ownerText)
            ? 'light'
            : 'dark'
          : isDefaultShellWallpaper(wallpaperUrl)
            ? 'light'
            : 'dark';
  root.setAttribute('data-shell-text-mode', textMode);
  {
    const paintUrl = absolutePaintUrl(wallpaperUrl, boundStoreId);
    const allowAutoLuma = textMode === 'auto';
    const cachedLuma = allowAutoLuma && paintUrl ? cachedShellWallpaperLuma(paintUrl) : null;
    if (cachedLuma) shellLuma = cachedLuma;
    root.setAttribute('data-shell-luma', shellLuma);
    if (paintUrl) {
      applyShellInlineWallpaper(
        wallpaperUrl,
        chrome.shellWallpaperBlur,
        chrome.shellWallpaperOpacity,
        chrome.updatedAt || Date.now(),
        shellLuma,
      );
      if (allowAutoLuma) {
        const storeId = boundStoreId;
        const pendingUrl = wallpaperUrl;
        void sampleShellWallpaperLuma(paintUrl).then((luma) => {
          if (boundStoreId !== storeId) return;
          if (resolveShellWallpaperUrl(boundChrome) !== pendingUrl) return;
          if ((boundChrome?.shellTextMode || 'auto') !== 'auto') return;
          const html = document.documentElement;
          if (html.getAttribute('data-shell-luma') === luma) {
            applyShellInlineWallpaper(
              pendingUrl,
              boundChrome!.shellWallpaperBlur,
              boundChrome!.shellWallpaperOpacity,
              boundChrome!.updatedAt || Date.now(),
              luma,
            );
            return;
          }
          html.setAttribute('data-shell-luma', luma);
          applyShellInlineWallpaper(
            pendingUrl,
            boundChrome!.shellWallpaperBlur,
            boundChrome!.shellWallpaperOpacity,
            boundChrome!.updatedAt || Date.now(),
            luma,
          );
        });
      }
    } else if (isChromeIdbUrl(wallpaperUrl)) {
      const storeId = boundStoreId;
      const pendingUrl = wallpaperUrl;
      const parsed = parseChromeIdbUrl(pendingUrl);
      if (storeId && parsed) {
        void hydrateChromeImageUrl(storeId, parsed.field, pendingUrl).then((idbUrl) => {
          if (!idbUrl) return;
          if (boundStoreId !== storeId) return;
          if (resolveShellWallpaperUrl(boundChrome) !== pendingUrl) return;
          paint(document.documentElement);
        });
      }
    } else {
      // Absolute path missing → still paint platform default from public/
      applyShellInlineWallpaper(
        DEFAULT_SHELL_WALLPAPER_URL,
        chrome.shellWallpaperBlur,
        chrome.shellWallpaperOpacity,
        chrome.updatedAt || Date.now(),
        shellLuma,
      );
    }
  }

  // ONE global page canvas — owner pageBgColor wins when set
  const isDarkChrome = root.getAttribute('data-theme') === 'dark';
  if (!isDarkChrome) {
    root.style.setProperty('--bg', ownerBg || shades.p50);
    // Design glass lock: navy CTA / active (screenshot pixel match)
    root.style.setProperty('--glass-navy', '#0f172a');
    root.style.setProperty('--accent', '#1e293b');
    root.style.setProperty('--active-bg', '#0f172a');
    root.style.setProperty('--active-fg', '#ffffff');
    root.style.setProperty('--active-ring', '#334155');
    root.style.setProperty('--portal-cta', '#0f172a');
    root.style.setProperty('--portal-600', '#1e293b');
    root.style.setProperty('--portal-400', '#334155');
  } else {
    root.style.setProperty('--bg', ownerBg || shades.p950);
  }

  if (chrome.fill === 'gradient') {
    const bar = `linear-gradient(180deg, ${chrome.gradientFrom}, ${chrome.gradientTo})`;
    root.style.setProperty('--chrome-sidebar-bg', bar);
    // Dark gradient bars → light nav text for life (Night Luxe / designs)
    root.setAttribute(
      'data-sidebar-luma',
      isDarkHexColor(chrome.gradientFrom) || isDarkHexColor(chrome.gradientTo) ? 'dark' : 'light',
    );
    // Header stays on the same global --bg (no second white/tinted strip)
    root.style.removeProperty('--chrome-header-bg');
  } else if (chrome.fill === 'image' && chrome.bgImage) {
    const resolvedBg =
      absolutePaintUrl(chrome.bgImage, boundStoreId) || chrome.bgImage;
    if (isChromeIdbUrl(chrome.bgImage) && !resolveChromeImageUrlSync(chrome.bgImage) && boundStoreId) {
      const storeId = boundStoreId;
      const pendingBg = chrome.bgImage;
      // Solid readable sidebar while IDB hydrates — never flash empty/transparent
      root.style.setProperty(
        '--chrome-sidebar-bg',
        'linear-gradient(180deg, rgba(4,16,28,0.94), rgba(4,16,28,0.98))',
      );
      root.setAttribute('data-sidebar-luma', 'dark');
      void hydrateChromeImageUrl(storeId, 'bgImage', pendingBg).then((idbUrl) => {
        if (!idbUrl || boundStoreId !== storeId) return;
        if (boundChrome?.bgImage !== pendingBg) return;
        paint(document.documentElement);
      });
    }
    let image = cssUrl(resolvedBg);
    if (image && !isChromeIdbUrl(image) && chrome.updatedAt) {
      const stamp = encodeURIComponent(String(chrome.updatedAt));
      image = /[?&]v=/.test(image)
        ? image.replace(/([?&]v=)[^&]*/i, `$1${stamp}`)
        : `${image}${image.includes('?') ? '&' : '?'}v=${stamp}`;
    }
    if (image && !isChromeIdbUrl(image)) {
      // Cover + center applied in CSS — shorthand alone was resetting background-size
      root.style.setProperty(
        '--chrome-sidebar-bg',
        `linear-gradient(180deg, rgba(4,16,28,0.82), rgba(4,16,28,0.92)), url("${image}")`,
      );
      root.setAttribute('data-sidebar-luma', 'dark');
    } else if (!isChromeIdbUrl(chrome.bgImage)) {
      // Missing URL → solid dark bar so nav labels stay readable without an image
      root.style.setProperty(
        '--chrome-sidebar-bg',
        'linear-gradient(180deg, rgba(4,16,28,0.94), rgba(4,16,28,0.98))',
      );
      root.setAttribute('data-sidebar-luma', 'dark');
    }
    root.style.removeProperty('--chrome-header-bg');
  } else if (chrome.fill === 'custom' && isDarkHexColor(chrome.customColor)) {
    root.style.removeProperty('--chrome-sidebar-bg');
    root.setAttribute('data-sidebar-luma', 'dark');
    root.style.removeProperty('--chrome-header-bg');
  } else {
    root.removeAttribute('data-sidebar-luma');
    root.style.removeProperty('--chrome-sidebar-bg');
    // Palette / solid: header + main share --bg only
    root.style.removeProperty('--chrome-header-bg');
  }

  if (!designOwnsColors(chrome)) return;
  const preset = designPreset(chrome);
  // Keep modal headers / sidebar deep tone on the SAME palette as CTA (no teal/green split).
  const designPalette = BRAND_PALETTES[preset.palette] ?? shades;
  root.style.setProperty('--portal-950', designPalette.p950);
  root.style.setProperty('--portal-900', designPalette.p900);
  root.style.setProperty('--portal-800', designPalette.p800);
  root.style.setProperty('--portal-200', preset.idle);
  // Light glass store keeps design navy for CTA/active; dark uses preset accents
  if (isDarkChrome) {
    root.style.setProperty('--portal-400', preset.accent);
    root.style.setProperty('--portal-600', preset.accent);
    root.style.setProperty('--accent', preset.accent);
    root.style.setProperty('--active-bg', preset.accent);
    root.style.setProperty('--active-fg', preset.activeFg);
    root.style.setProperty('--active-ring', preset.accent);
    root.style.setProperty('--portal-cta', preset.cta);
  }
  if (root.getAttribute('data-theme') !== 'dark') {
    const ink = ownerText || '#0f172a';
    root.style.setProperty('--text', ink);
    root.style.setProperty('--muted', ownerText ? mix(ink, '#64748b', 0.45) : '#475569');
    root.style.setProperty('--input-fg', ink);
    root.style.setProperty('--input-ph', designPalette.p800);
    root.style.setProperty('--table-head', ink);
    root.style.setProperty('--card-fg', ink);
    root.style.setProperty('--icon-on-light', ink);
    root.style.setProperty('--icon-box-fg', ink);
    root.style.setProperty('--border', 'transparent');
    root.style.setProperty('--table-border', 'rgba(15, 23, 42, 0.16)');
    root.style.setProperty('--table-border-strong', 'rgba(15, 23, 42, 0.22)');
  }
  if (!root.hasAttribute('data-custom-scrollbar')) {
    root.style.setProperty('--sb-color', isDarkChrome ? preset.accent : '#64748b');
    root.style.setProperty('--sb-color-deep', isDarkChrome ? designPalette.p600 : '#1e293b');
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

function mergePendingChrome(storeId: string, base: StoreChromeBrand): StoreChromeBrand {
  const pending = pendingChromeByStore.get(storeId);
  if (!pending) return base;
  // Pending is latest merchant intent — including intentional clears ('' must win over remote).
  return {
    ...base,
    shellWallpaper: resolveShellWallpaperUrl(pending.shellWallpaper),
    shellWallpaperPreset: 'custom',
    shellWallpaperBlur: clampBlur(pending.shellWallpaperBlur ?? base.shellWallpaperBlur),
    shellWallpaperOpacity: clampOpacity(
      pending.shellWallpaperOpacity ?? base.shellWallpaperOpacity,
    ),
    bgImage: pending.bgImage,
    fill: pending.bgImage ? 'image' : pending.fill === 'image' ? 'palette' : pending.fill,
    palette: pending.palette || base.palette,
    customColor: pending.customColor || base.customColor,
    gradientFrom: pending.gradientFrom || base.gradientFrom,
    gradientTo: pending.gradientTo || base.gradientTo,
    sidebarDesign: pending.sidebarDesign || base.sidebarDesign,
    pageBgColor: pending.pageBgColor ?? '',
    pageTextColor: pending.pageTextColor ?? '',
    shellTextMode: isShellTextMode(pending.shellTextMode) ? pending.shellTextMode : 'auto',
    fontAr: pending.fontAr ?? base.fontAr,
    fontWeight: pending.fontWeight ?? base.fontWeight,
    customFontFamilyAr:
      pending.customFontFamilyAr !== undefined
        ? pending.customFontFamilyAr
        : base.customFontFamilyAr,
    customFontUrlAr:
      pending.customFontUrlAr !== undefined ? pending.customFontUrlAr : base.customFontUrlAr,
  };
}

async function withHydratedImages(
  storeId: string,
  chrome: StoreChromeBrand,
  opts?: { restoreEmptyShellFromIdb?: boolean; restoreEmptyBgFromIdb?: boolean },
): Promise<StoreChromeBrand> {
  const hydrated = await hydrateStoreChromeImages(
    storeId,
    { shellWallpaper: chrome.shellWallpaper, bgImage: chrome.bgImage },
    {
      restoreMissingShell: Boolean(opts?.restoreEmptyShellFromIdb),
      restoreMissingBg: Boolean(opts?.restoreEmptyBgFromIdb),
    },
  );
  const shellWallpaper = resolveShellWallpaperUrl(
    hydrated.shellWallpaper || chrome.shellWallpaper,
  );
  const bgImage = hydrated.bgImage || chrome.bgImage;
  return {
    ...chrome,
    shellWallpaper,
    shellWallpaperPreset: 'custom',
    bgImage,
    fill: bgImage ? 'image' : chrome.fill === 'image' ? 'palette' : chrome.fill,
  };
}

/** True when wallpaper/sidebar still only exist as chrome-idb or blob on this device. */
function chromeHasLocalOnlyImages(chrome: StoreChromeBrand): boolean {
  return (
    isChromeIdbUrl(chrome.shellWallpaper) ||
    isChromeIdbUrl(chrome.bgImage) ||
    isEphemeralImageUrl(chrome.shellWallpaper) ||
    isEphemeralImageUrl(chrome.bgImage)
  );
}

/** Dedupe Sidebar + Settings parallel loads (same store_id). */
const loadChromeInflight = new Map<string, Promise<StoreChromeBrand>>();

export async function loadStoreChrome(storeId: string): Promise<StoreChromeBrand> {
  if (!storeId) return defaultStoreChrome();
  const existing = loadChromeInflight.get(storeId);
  if (existing) return existing;

  const run = (async (): Promise<StoreChromeBrand> => {
    const cached = readChromeCache(storeId);
    const apiOpts = chromeApiOpts(storeId);
    let remote = cached;
    try {
      const res = await apiFetch<{ success?: boolean; data?: Record<string, unknown> }>(
        `/stores/${encodeURIComponent(storeId)}/store-settings`,
        // Fast fail — local cache already painted; long hangs made Settings feel stuck
        { storeId, baseUrl: apiOpts.baseUrl, timeoutMs: 8_000 },
      );
      if (res?.data?.chromeBrand) {
        remote = parseStoreChrome(res.data.chromeBrand);
      }
    } catch {
      remote = cached;
    }

    const hasPending = pendingChromeByStore.has(storeId);
    const shellCleared = isChromeImageCleared(storeId, 'shellWallpaper');
    const bgCleared = isChromeImageCleared(storeId, 'bgImage');
    // Newer local cache / pending must win — stops "settings change after loading"
    let merged = hasPending
      ? mergePendingChrome(storeId, mergeChromePreferNewest(remote, cached, storeId))
      : mergeChromePreferNewest(remote, cached, storeId);

    // Never let empty remote wipe local durable images unless merchant cleared
    if (!hasPending && !shellCleared) {
      if (!merged.shellWallpaper && cached.shellWallpaper) {
        merged = {
          ...merged,
          shellWallpaper: cached.shellWallpaper,
          shellWallpaperPreset: 'custom',
        };
      }
    }
    if (!hasPending && !bgCleared) {
      if (!merged.bgImage && cached.bgImage) {
        merged = {
          ...merged,
          bgImage: cached.bgImage,
          fill: 'image',
        };
      }
    }

    // Honor intentional remove — restore platform default image (never color presets / IDB resurrect)
    if (shellCleared) {
      merged = {
        ...merged,
        shellWallpaper: DEFAULT_SHELL_WALLPAPER_URL,
        shellWallpaperPreset: 'custom',
      };
    }
    if (bgCleared) {
      merged = {
        ...merged,
        bgImage: '',
        fill: merged.fill === 'image' ? 'palette' : merged.fill,
      };
    }

    // Restore durable IDB art when cache/API empty (look-pack wipe race) — skip if merchant cleared
    merged = await withHydratedImages(storeId, merged, {
      restoreEmptyShellFromIdb: !hasPending && !shellCleared,
      restoreEmptyBgFromIdb: !hasPending && !bgCleared,
    });
    if (shellCleared) {
      merged = {
        ...merged,
        shellWallpaper: DEFAULT_SHELL_WALLPAPER_URL,
        shellWallpaperPreset: 'custom',
      };
    }
    if (bgCleared) {
      merged = { ...merged, bgImage: '', fill: merged.fill === 'image' ? 'palette' : merged.fill };
    }
    merged = {
      ...merged,
      shellWallpaper: resolveShellWallpaperUrl(merged.shellWallpaper),
      shellWallpaperPreset: 'custom',
    };

    // If wallpaper still only on this device, push to media + store_settings when API is up
    const beforeSync = merged;
    try {
      merged = await syncChromeImagesToApi(storeId, merged);
      if (
        merged.shellWallpaper !== beforeSync.shellWallpaper ||
        merged.bgImage !== beforeSync.bgImage
      ) {
        const stamped = { ...merged, updatedAt: Date.now() };
        writeChromeCache(storeId, persistableStoreChrome(stamped));
        const apiBody = apiPersistableStoreChrome(stamped, beforeSync);
        // Only persist to MySQL when images are real remote URLs (never stamp empty wipe)
        const safeToPut =
          !chromeHasLocalOnlyImages(stamped) &&
          (!beforeSync.shellWallpaper || Boolean(apiBody.shellWallpaper) || !stamped.shellWallpaper) &&
          (!beforeSync.bgImage || Boolean(apiBody.bgImage) || !stamped.bgImage);
        if (safeToPut) {
          await apiFetch(`/stores/${encodeURIComponent(storeId)}/store-settings`, {
            method: 'PUT',
            storeId,
            baseUrl: apiOpts.baseUrl,
            timeoutMs: apiOpts.timeoutMs,
            body: { settings: { chromeBrand: apiBody } },
          });
        }
        merged = stamped;
      }
    } catch {
      /* local cache remains */
    }

    writeChromeCache(storeId, persistableStoreChrome(merged));
    return merged;
  })();

  loadChromeInflight.set(storeId, run);
  try {
    return await run;
  } finally {
    loadChromeInflight.delete(storeId);
  }
}

export async function saveStoreChrome(storeId: string, chrome: StoreChromeBrand): Promise<void> {
  const live = parseStoreChrome({ ...chrome, updatedAt: Date.now() });
  const next = persistableStoreChrome(live);
  const shellWallpaper = resolveShellWallpaperUrl(live.shellWallpaper);
  let painted: StoreChromeBrand = {
    ...next,
    shellWallpaper,
    shellWallpaperPreset: 'custom',
    shellWallpaperBlur: live.shellWallpaperBlur,
    shellWallpaperOpacity: live.shellWallpaperOpacity,
    bgImage: live.bgImage,
    fill: live.bgImage ? 'image' : live.fill === 'image' ? 'palette' : live.fill,
    updatedAt: live.updatedAt || Date.now(),
  };
  // Default platform image = cleared merchant upload (block IDB resurrect)
  if (isDefaultShellWallpaper(painted.shellWallpaper)) {
    markChromeImageCleared(storeId, 'shellWallpaper', true);
  } else {
    markChromeImageCleared(storeId, 'shellWallpaper', false);
  }
  if (!painted.bgImage) markChromeImageCleared(storeId, 'bgImage', true);
  else markChromeImageCleared(storeId, 'bgImage', false);

  bindStoreChrome(storeId, painted);
  pendingChromeByStore.set(storeId, painted);

  // Volatile blob still uploading → local only; IDB sync happens when chrome-idb arrives
  if (isEphemeralImageUrl(live.shellWallpaper) || isEphemeralImageUrl(live.bgImage)) {
    const prev = readChromeCache(storeId);
    writeChromeCache(storeId, {
      ...next,
      shellWallpaper: next.shellWallpaper || (isEphemeralImageUrl(live.shellWallpaper) ? prev.shellWallpaper : ''),
      shellWallpaperPreset:
        next.shellWallpaper || (isEphemeralImageUrl(live.shellWallpaper) && prev.shellWallpaper)
          ? 'custom'
          : next.shellWallpaperPreset,
      shellWallpaperBlur: live.shellWallpaperBlur,
      shellWallpaperOpacity: live.shellWallpaperOpacity,
      bgImage: next.bgImage || (isEphemeralImageUrl(live.bgImage) ? prev.bgImage : ''),
      fill:
        live.bgImage || next.bgImage || (isEphemeralImageUrl(live.bgImage) && prev.bgImage)
          ? 'image'
          : next.fill === 'image'
            ? 'palette'
            : next.fill,
      updatedAt: painted.updatedAt,
    });
    return;
  }

  writeChromeCache(storeId, painted);

  const apiOpts = chromeApiOpts(storeId);

  // chrome-idb → Hostinger /media, then full chromeBrand to store_settings
  try {
    painted = await syncChromeImagesToApi(storeId, painted);
    painted = { ...painted, updatedAt: Date.now() };
    bindStoreChrome(storeId, painted);
    pendingChromeByStore.set(storeId, painted);
    writeChromeCache(storeId, persistableStoreChrome(painted));
  } catch {
    /* keep local */
  }

  const prevCached = readChromeCache(storeId);
  const apiBody = apiPersistableStoreChrome(painted, prevCached);
  /*
   * Never PUT empty image fields while this device still only has chrome-idb/blob.
   * That stamped '' into live MySQL and a later load wiped center + sidebar BGs.
   * Intentional clears (empty + not local-only) still reach the API below.
   */
  const wouldWipeLocalShell =
    !apiBody.shellWallpaper &&
    (isChromeIdbUrl(painted.shellWallpaper) || isEphemeralImageUrl(painted.shellWallpaper));
  const wouldWipeLocalBg =
    !apiBody.bgImage &&
    (isChromeIdbUrl(painted.bgImage) || isEphemeralImageUrl(painted.bgImage));
  if (wouldWipeLocalShell || wouldWipeLocalBg) {
    // Local IDB + cache + pending remain source of truth until CDN URL exists
    return;
  }

  try {
    await apiFetch(`/stores/${encodeURIComponent(storeId)}/store-settings`, {
      method: 'PUT',
      storeId,
      baseUrl: apiOpts.baseUrl,
      timeoutMs: apiOpts.timeoutMs,
      body: { settings: { chromeBrand: apiBody } },
    });
    // Coffee/bleco primary = mieraf; local Vite proxy often wrote wallpaper to giftshop — clear orphan
    if (!apiBody.shellWallpaper || !apiBody.bgImage) {
      await clearOrphanChromeImagesOnAltHost(storeId, apiBody);
    }
    // Only clear pending after a successful DB write of the full chrome snapshot
    if (!chromeHasLocalOnlyImages(painted)) {
      pendingChromeByStore.delete(storeId);
    }
  } catch {
    // Local cache + IDB stay — retry on next load/save
  }
}

/** Clear empty image fields on the other Hostinger host (stale giftshop coffee wallpaper). */
async function clearOrphanChromeImagesOnAltHost(
  storeId: string,
  apiBody: StoreChromeBrand,
): Promise<void> {
  const primary = liveApiBaseForStore(storeId);
  if (!/mieraf-ksa\.com/i.test(primary)) return;
  const alt = 'https://giftshop-sa.com/api';
  const patch: Partial<StoreChromeBrand> = { updatedAt: Date.now() };
  if (!apiBody.shellWallpaper || isDefaultShellWallpaper(apiBody.shellWallpaper)) {
    patch.shellWallpaper = DEFAULT_SHELL_WALLPAPER_URL;
    patch.shellWallpaperPreset = 'custom';
  }
  if (!apiBody.bgImage) {
    patch.bgImage = '';
    if (apiBody.fill === 'image') patch.fill = 'palette';
  }
  if (patch.shellWallpaper === undefined && patch.bgImage === undefined) return;
  try {
    await apiFetch(`/stores/${encodeURIComponent(storeId)}/store-settings`, {
      method: 'PUT',
      storeId,
      baseUrl: alt,
      timeoutMs: 20_000,
      body: { settings: { chromeBrand: patch } },
    });
  } catch {
    /* orphan host may be down — primary save already succeeded */
  }
}
