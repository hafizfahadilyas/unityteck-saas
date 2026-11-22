/**
 * Platform branding — Master + Store same Holst chrome.
 * Custom: Top 15 color palettes · EN 7 + AR fonts (incl. Amiri + Markazi) · Font weights.
 * Runtime via CSS vars (Prefs → BrandingPanel / Settings).
 */
import { runChromePainter } from './chromePainter';

export { setChromePainter } from './chromePainter';

export type BrandPaletteId =
  | 'holst'
  | 'emerald'
  | 'forest'
  | 'amber'
  | 'coral'
  | 'crimson'
  | 'purple'
  | 'amethyst'
  | 'indigo'
  | 'sapphire'
  | 'cyan'
  | 'rose'
  | 'midnight'
  | 'titanium'
  | 'bronze'
  // Legacy aliases for backward compatibility
  | 'holst-deep'
  | 'holst-bright'
  | 'ocean'
  | 'aqua'
  | 'mint'
  | 'slate-teal'
  | 'sand';

/** EN Google fonts (dashboard UI) — top 15 global UI faces */
export type BrandFontEnId =
  | 'jakarta'
  | 'inter'
  | 'dm-sans'
  | 'manrope'
  | 'outfit'
  | 'poppins'
  | 'urbanist'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'montserrat'
  | 'nunito-sans'
  | 'source-sans-3'
  | 'work-sans'
  | 'rubik';

/** AR fonts — top 15 Arabic + optional custom */
export type BrandFontArId =
  | 'sf-arabic'
  | 'cairo'
  | 'tajawal'
  | 'noto'
  | 'ibm-plex-ar'
  | 'almarai'
  | 'readex-pro'
  | 'noto-kufi'
  | 'amiri'
  | 'markazi'
  | 'changa'
  | 'el-messiri'
  | 'alexandria'
  | 'reem-kufi'
  | 'noto-naskh'
  | 'custom-ar';

/** Shared Apple Arabic stack (SF Arabic on iPhone/macOS; Segoe/Noto elsewhere) */
export const APPLE_ARABIC_STACK =
  "'SF Arabic', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Segoe UI Historic', 'Noto Sans Arabic', 'IBM Plex Sans Arabic', 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif";

/** Official SAMA Riyal glyph font (U+20C1 only via unicode-range) — always first in stacks. */
export const SAUDI_RIYAL_FONT_FAMILY = 'SaudiRiyalSign';

/** Prepend Riyal sign face so ⃁ never falls back to missing-glyph tofu/bars. */
export function withSaudiRiyalFont(stack: string): string {
  const s = String(stack || '').trim();
  if (!s) return `'${SAUDI_RIYAL_FONT_FAMILY}', sans-serif`;
  if (s.includes(SAUDI_RIYAL_FONT_FAMILY)) return s;
  return `'${SAUDI_RIYAL_FONT_FAMILY}', ${s}`;
}

export type BrandFontId = BrandFontEnId | BrandFontArId;
export type BrandIconStyle = 'soft' | 'rounded' | 'sharp';
/** UI weight keys — Light / Regular / Bold are primary; Medium optional */
export type BrandFontWeight = 'light' | 'regular' | 'bold' | 'medium';

/** Display order for weight chips (user-facing) */
export const BRAND_FONT_WEIGHT_ORDER: BrandFontWeight[] = ['light', 'regular', 'bold', 'medium'];

export type BrandPalette = {
  id: BrandPaletteId;
  label: string;
  labelAr: string;
  labelUr?: string;
  colorHex: string;
  p950: string;
  p900: string;
  p800: string;
  p600: string;
  p400: string;
  p200: string;
  p50: string;
};

/** Top 15 Color Palettes with distinct, vibrant colors (Teal, Green, Orange, Purple, Blue, Pink, Dark, etc.) */
export const BRAND_PALETTES: Record<BrandPaletteId, BrandPalette> = {
  holst: {
    id: 'holst',
    label: '1 · Holst Teal',
    labelAr: '١ · هولست تركواز',
    labelUr: '١ · ہولسٹ فیروزی',
    colorHex: '#1d8b94',
    p950: '#04222b',
    p900: '#0a3d4a',
    p800: '#10606f',
    p600: '#1d8b94',
    p400: '#4fb8b4',
    p200: '#98d8d0',
    p50: '#e2f4f0',
  },
  emerald: {
    id: 'emerald',
    label: '2 · Royal Emerald',
    labelAr: '٢ · أخضر زمردي',
    labelUr: '٢ · شاہی زمردی',
    colorHex: '#059669',
    p950: '#022c22',
    p900: '#064e3b',
    p800: '#047857',
    p600: '#059669',
    p400: '#10b981',
    p200: '#6ee7b7',
    p50: '#ecfdf5',
  },
  forest: {
    id: 'forest',
    label: '3 · Forest Green',
    labelAr: '٣ · أخضر غابات',
    labelUr: '٣ · گہرا سبز',
    colorHex: '#16a34a',
    p950: '#052418',
    p900: '#0e3f2d',
    p800: '#166534',
    p600: '#15803d',
    p400: '#22c55e',
    p200: '#86efac',
    p50: '#f0fdf4',
  },
  amber: {
    id: 'amber',
    label: '4 · Sunset Orange',
    labelAr: '٤ · برتقالي ذهبي',
    labelUr: '٤ · سنہری نارنجی',
    colorHex: '#ea580c',
    p950: '#291804',
    p900: '#451a03',
    p800: '#7c2d12',
    p600: '#ea580c',
    p400: '#f97316',
    p200: '#fdba74',
    p50: '#fff7ed',
  },
  coral: {
    id: 'coral',
    label: '5 · Coral Tangerine',
    labelAr: '٥ · مرجاني برتقالي',
    labelUr: '٥ · شعلہ نارنجی',
    colorHex: '#c2410c',
    p950: '#2d1108',
    p900: '#521b0b',
    p800: '#9a3412',
    p600: '#c2410c',
    p400: '#fb923c',
    p200: '#fed7aa',
    p50: '#fffaf5',
  },
  crimson: {
    id: 'crimson',
    label: '6 · Ruby Crimson',
    labelAr: '٦ · أحمر ياقوتي',
    labelUr: '٦ · یاقوتی سرخ',
    colorHex: '#be123c',
    p950: '#2e080e',
    p900: '#4c0519',
    p800: '#9f1239',
    p600: '#be123c',
    p400: '#f43f5e',
    p200: '#fda4af',
    p50: '#fff1f2',
  },
  purple: {
    id: 'purple',
    label: '7 · Royal Purple',
    labelAr: '٧ · بنفسجي ملكي',
    labelUr: '٧ · شاہی جامنی',
    colorHex: '#7e22ce',
    p950: '#1e0a3c',
    p900: '#3b0764',
    p800: '#581c87',
    p600: '#7e22ce',
    p400: '#a855f7',
    p200: '#d8b4fe',
    p50: '#faf5ff',
  },
  amethyst: {
    id: 'amethyst',
    label: '8 · Deep Amethyst',
    labelAr: '٨ · أرجواني عميق',
    labelUr: '٨ · گہرا بنفشی',
    colorHex: '#9333ea',
    p950: '#250c2f',
    p900: '#4a044e',
    p800: '#701a75',
    p600: '#9333ea',
    p400: '#c084fc',
    p200: '#e9d5ff',
    p50: '#fdf4ff',
  },
  indigo: {
    id: 'indigo',
    label: '9 · Electric Indigo',
    labelAr: '٩ · نيلي فاخر',
    labelUr: '٩ · برقی نیلا',
    colorHex: '#4338ca',
    p950: '#0b132b',
    p900: '#1e1b4b',
    p800: '#312e81',
    p600: '#4338ca',
    p400: '#6366f1',
    p200: '#a5b4fc',
    p50: '#eef2ff',
  },
  sapphire: {
    id: 'sapphire',
    label: '10 · Sapphire Blue',
    labelAr: '١٠ · أزرق ياقوتي',
    labelUr: '١٠ · نیلمی نیلا',
    colorHex: '#2563eb',
    p950: '#031d38',
    p900: '#0c355b',
    p800: '#1e40af',
    p600: '#2563eb',
    p400: '#3b82f6',
    p200: '#93c5fd',
    p50: '#eff6ff',
  },
  cyan: {
    id: 'cyan',
    label: '11 · Ocean Cyan',
    labelAr: '١١ · أكوا سماوي',
    labelUr: '١١ · سمندری فیروزی',
    colorHex: '#0891b2',
    p950: '#042533',
    p900: '#083344',
    p800: '#0e7490',
    p600: '#0891b2',
    p400: '#06b6d4',
    p200: '#67e8f9',
    p50: '#ecfeff',
  },
  rose: {
    id: 'rose',
    label: '12 · Rose Magenta',
    labelAr: '١٢ · وردي أنيق',
    labelUr: '١٢ · گلابی مجنٹا',
    colorHex: '#be185d',
    p950: '#290819',
    p900: '#500724',
    p800: '#831843',
    p600: '#be185d',
    p400: '#db2777',
    p200: '#f472b6',
    p50: '#fdf2f8',
  },
  midnight: {
    id: 'midnight',
    label: '13 · Midnight Dark',
    labelAr: '١٣ · كحلي ليلي غامق',
    labelUr: '١٣ · نصف شب تاریک',
    colorHex: '#374151',
    p950: '#090d16',
    p900: '#111827',
    p800: '#1f2937',
    p600: '#374151',
    p400: '#4b5563',
    p200: '#9ca3af',
    p50: '#f3f4f6',
  },
  titanium: {
    id: 'titanium',
    label: '14 · Titanium Slate',
    labelAr: '١٤ · تيتانيوم رمادي',
    labelUr: '١٤ · ٹائٹینیم سرمئی',
    colorHex: '#475569',
    p950: '#0b0f19',
    p900: '#1e293b',
    p800: '#334155',
    p600: '#475569',
    p400: '#64748b',
    p200: '#cbd5e1',
    p50: '#f8fafc',
  },
  bronze: {
    id: 'bronze',
    label: '15 · Sand Bronze',
    labelAr: '١٥ · برونزي فاخر',
    labelUr: '١٥ · کانسی ریت',
    colorHex: '#855b32',
    p950: '#241a10',
    p900: '#3e2b17',
    p800: '#6b4f2c',
    p600: '#855b32',
    p400: '#b48448',
    p200: '#e4cb9f',
    p50: '#fdfaf4',
  },
  // Legacy aliases map seamlessly:
  'holst-deep': {
    id: 'holst-deep',
    label: 'Holst Deep',
    labelAr: 'هولست عميق',
    labelUr: 'ہولسٹ گہرا',
    colorHex: '#178089',
    p950: '#031820',
    p900: '#073340',
    p800: '#0c5564',
    p600: '#178089',
    p400: '#3aa8a4',
    p200: '#7fcfc8',
    p50: '#d8f0ec',
  },
  'holst-bright': {
    id: 'holst-bright',
    label: 'Holst Bright',
    labelAr: 'هولست فاتح',
    labelUr: 'ہولسٹ روشن',
    colorHex: '#22a0aa',
    p950: '#052a35',
    p900: '#0c4654',
    p800: '#147484',
    p600: '#22a0aa',
    p400: '#5ec9c4',
    p200: '#a8e0da',
    p50: '#eaf8f5',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    labelAr: 'محيط',
    labelUr: 'سمندر',
    colorHex: '#1a9aaa',
    p950: '#03252f',
    p900: '#0a4452',
    p800: '#116a7a',
    p600: '#1a9aaa',
    p400: '#48c4d0',
    p200: '#9adfe6',
    p50: '#e6f7f9',
  },
  aqua: {
    id: 'aqua',
    label: 'Aqua',
    labelAr: 'أكوا',
    labelUr: 'آبی',
    colorHex: '#1a9e96',
    p950: '#042828',
    p900: '#0a4a48',
    p800: '#11706c',
    p600: '#1a9e96',
    p400: '#45c8be',
    p200: '#9ae8e0',
    p50: '#e8faf7',
  },
  mint: {
    id: 'mint',
    label: 'Mint',
    labelAr: 'نعناع',
    labelUr: 'پودینہ',
    colorHex: '#1f9a7e',
    p950: '#06241f',
    p900: '#0c4339',
    p800: '#146858',
    p600: '#1f9a7e',
    p400: '#4ec9a8',
    p200: '#a0e4d0',
    p50: '#eaf8f3',
  },
  'slate-teal': {
    id: 'slate-teal',
    label: 'Slate Teal',
    labelAr: 'رمادي تركواز',
    labelUr: 'سلیٹی فیروزی',
    colorHex: '#3a7a88',
    p950: '#0b1c22',
    p900: '#16333c',
    p800: '#244e5a',
    p600: '#3a7a88',
    p400: '#6aa8b4',
    p200: '#b0cfd6',
    p50: '#eef4f6',
  },
  sand: {
    id: 'sand',
    label: 'Sand Teal',
    labelAr: 'رملي تركواز',
    labelUr: 'ریتیلا فیروزی',
    colorHex: '#5f8f82',
    p950: '#1a1c18',
    p900: '#2e3530',
    p800: '#456058',
    p600: '#5f8f82',
    p400: '#8bb8aa',
    p200: '#c5d9d0',
    p50: '#f3f7f5',
  },
};

export const TOP_15_PALETTES: BrandPaletteId[] = [
  'holst',
  'emerald',
  'forest',
  'amber',
  'coral',
  'crimson',
  'purple',
  'amethyst',
  'indigo',
  'sapphire',
  'cyan',
  'rose',
  'midnight',
  'titanium',
  'bronze',
];

export const BRAND_PALETTE_IDS = Object.keys(BRAND_PALETTES) as BrandPaletteId[];

export type BrandFontMeta = {
  id: BrandFontId;
  label: string;
  labelAr: string;
  labelUr?: string;
  stack: string;
  script: 'en' | 'ar';
  googleFamily: string;
};

/**
 * Top global Google Fonts:
 * EN 15 + AR 15 (+ custom-ar) — Light / Regular / Bold weights.
 */
export const BRAND_FONTS: Record<BrandFontId, BrandFontMeta> = {
  // ── English (15) ──
  jakarta: {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    labelAr: 'جاكارتا سانس',
    stack: `'Plus Jakarta Sans', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800',
  },
  inter: {
    id: 'inter',
    label: 'Inter',
    labelAr: 'إنتر',
    stack: `'Inter', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Inter:wght@300;400;500;600;700;800',
  },
  'dm-sans': {
    id: 'dm-sans',
    label: 'DM Sans',
    labelAr: 'دي إم سانس',
    stack: `'DM Sans', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'DM+Sans:wght@300;400;500;600;700',
  },
  manrope: {
    id: 'manrope',
    label: 'Manrope',
    labelAr: 'مانروب',
    stack: `'Manrope', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Manrope:wght@300;400;500;600;700;800',
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit',
    labelAr: 'أوتفيت',
    stack: `'Outfit', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Outfit:wght@300;400;500;600;700;800',
  },
  poppins: {
    id: 'poppins',
    label: 'Poppins',
    labelAr: 'بوبينز',
    stack: `'Poppins', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Poppins:wght@300;400;500;600;700;800',
  },
  urbanist: {
    id: 'urbanist',
    label: 'Urbanist',
    labelAr: 'أوربانيست',
    stack: `'Urbanist', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Urbanist:wght@300;400;500;600;700;800',
  },
  roboto: {
    id: 'roboto',
    label: 'Roboto',
    labelAr: 'روبوتو',
    stack: `'Roboto', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Roboto:wght@300;400;500;700;900',
  },
  'open-sans': {
    id: 'open-sans',
    label: 'Open Sans',
    labelAr: 'أوبن سانس',
    stack: `'Open Sans', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Open+Sans:wght@300;400;500;600;700;800',
  },
  lato: {
    id: 'lato',
    label: 'Lato',
    labelAr: 'لاتو',
    stack: `'Lato', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Lato:wght@300;400;700;900',
  },
  montserrat: {
    id: 'montserrat',
    label: 'Montserrat',
    labelAr: 'مونتسيرات',
    stack: `'Montserrat', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Montserrat:wght@300;400;500;600;700;800',
  },
  'nunito-sans': {
    id: 'nunito-sans',
    label: 'Nunito Sans',
    labelAr: 'نونيتو سانس',
    stack: `'Nunito Sans', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Nunito+Sans:wght@300;400;500;600;700;800',
  },
  'source-sans-3': {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    labelAr: 'سورس سانس ٣',
    stack: `'Source Sans 3', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Source+Sans+3:wght@300;400;500;600;700;800',
  },
  'work-sans': {
    id: 'work-sans',
    label: 'Work Sans',
    labelAr: 'ورك سانس',
    stack: `'Work Sans', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Work+Sans:wght@300;400;500;600;700;800',
  },
  rubik: {
    id: 'rubik',
    label: 'Rubik',
    labelAr: 'روبيك',
    stack: `'Rubik', ${APPLE_ARABIC_STACK}`,
    script: 'en',
    googleFamily: 'Rubik:wght@300;400;500;600;700;800',
  },

  // ── Arabic (15) + custom ──
  'sf-arabic': {
    id: 'sf-arabic',
    label: 'SF Arabic (iPhone)',
    labelAr: 'سف عربي (آيفون)',
    stack: APPLE_ARABIC_STACK,
    script: 'ar',
    googleFamily: '',
  },
  cairo: {
    id: 'cairo',
    label: 'Cairo',
    labelAr: 'القاهرة',
    stack: "'Cairo', 'IBM Plex Sans Arabic', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Cairo:wght@300;400;500;600;700;800',
  },
  tajawal: {
    id: 'tajawal',
    label: 'Tajawal',
    labelAr: 'تجوال',
    stack: "'Tajawal', 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Tajawal:wght@300;400;500;700;800',
  },
  noto: {
    id: 'noto',
    label: 'Noto Sans Arabic',
    labelAr: 'نوتو سانس عربي',
    stack: "'Noto Sans Arabic', 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Noto+Sans+Arabic:wght@300;400;500;600;700;800',
  },
  'ibm-plex-ar': {
    id: 'ibm-plex-ar',
    label: 'IBM Plex Sans Arabic',
    labelAr: 'آي بي إم بليكس عربي',
    stack: "'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'IBM+Plex+Sans+Arabic:wght@300;400;500;600;700',
  },
  almarai: {
    id: 'almarai',
    label: 'Almarai',
    labelAr: 'المراعي',
    stack: "'Almarai', 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Almarai:wght@300;400;700;800',
  },
  'readex-pro': {
    id: 'readex-pro',
    label: 'Readex Pro',
    labelAr: 'ريدكس برو',
    stack: "'Readex Pro', 'Noto Sans Arabic', 'Cairo', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Readex+Pro:wght@300;400;500;600;700',
  },
  'noto-kufi': {
    id: 'noto-kufi',
    label: 'Noto Kufi Arabic',
    labelAr: 'نوتو كوفي عربي',
    stack: "'Noto Kufi Arabic', 'Noto Sans Arabic', 'Cairo', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Noto+Kufi+Arabic:wght@300;400;500;600;700;800',
  },
  amiri: {
    id: 'amiri',
    label: 'Amiri',
    labelAr: 'أميري',
    stack: "'Amiri', 'Noto Naskh Arabic', 'Cairo', system-ui, serif",
    script: 'ar',
    googleFamily: 'Amiri:wght@400;700',
  },
  markazi: {
    id: 'markazi',
    label: 'Markazi Text',
    labelAr: 'مركزي نص',
    stack: "'Markazi Text', 'Amiri', 'Cairo', system-ui, serif",
    script: 'ar',
    googleFamily: 'Markazi+Text:wght@300;400;500;600;700',
  },
  changa: {
    id: 'changa',
    label: 'Changa',
    labelAr: 'تشانجا',
    stack: "'Changa', 'Tajawal', 'Cairo', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Changa:wght@300;400;500;600;700;800',
  },
  'el-messiri': {
    id: 'el-messiri',
    label: 'El Messiri',
    labelAr: 'المسيري',
    stack: "'El Messiri', 'Amiri', 'Cairo', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'El+Messiri:wght@300;400;500;600;700',
  },
  alexandria: {
    id: 'alexandria',
    label: 'Alexandria',
    labelAr: 'الإسكندرية',
    stack: "'Alexandria', 'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Alexandria:wght@300;400;500;600;700;800',
  },
  'reem-kufi': {
    id: 'reem-kufi',
    label: 'Reem Kufi',
    labelAr: 'ريم كوفي',
    stack: "'Reem Kufi', 'Noto Kufi Arabic', 'Cairo', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Reem+Kufi:wght@400;500;600;700',
  },
  'noto-naskh': {
    id: 'noto-naskh',
    label: 'Noto Naskh Arabic',
    labelAr: 'نوتو نسخ عربي',
    stack: "'Noto Naskh Arabic', 'Amiri', 'Cairo', system-ui, serif",
    script: 'ar',
    googleFamily: 'Noto+Naskh+Arabic:wght@400;500;600;700',
  },
  'custom-ar': {
    id: 'custom-ar',
    label: 'Custom Arabic Font',
    labelAr: 'خط عربي مخصص',
    stack: APPLE_ARABIC_STACK,
    script: 'ar',
    googleFamily: '',
  },
};

/** Curated EN 15 — most-used global UI fonts */
export const BRAND_FONTS_EN = (
  [
    'jakarta',
    'inter',
    'roboto',
    'open-sans',
    'poppins',
    'montserrat',
    'lato',
    'dm-sans',
    'manrope',
    'outfit',
    'nunito-sans',
    'source-sans-3',
    'work-sans',
    'rubik',
    'urbanist',
  ] as BrandFontEnId[]
).map((id) => BRAND_FONTS[id]);

/** Curated AR 15 — most-used Arabic + custom option */
export const BRAND_FONTS_AR = (
  [
    'sf-arabic',
    'cairo',
    'tajawal',
    'noto',
    'ibm-plex-ar',
    'almarai',
    'readex-pro',
    'noto-kufi',
    'amiri',
    'markazi',
    'changa',
    'el-messiri',
    'alexandria',
    'reem-kufi',
    'noto-naskh',
    'custom-ar',
  ] as BrandFontArId[]
).map((id) => BRAND_FONTS[id]);

export const BRAND_FONTS_UR = BRAND_FONTS_AR;

export const BRAND_FONT_IDS = Object.keys(BRAND_FONTS) as BrandFontId[];

export const BRAND_ICON_RADIUS: Record<
  BrandIconStyle,
  { label: string; labelAr: string; px: string }
> = {
  soft: { label: 'Soft', labelAr: 'ناعم', px: '12px' },
  rounded: { label: 'Rounded', labelAr: 'مستدير', px: '16px' },
  sharp: { label: 'Sharp', labelAr: 'حاد', px: '6px' },
};

export const BRAND_FONT_WEIGHTS: Record<
  BrandFontWeight,
  { label: string; labelAr: string; body: string; heading: string; sample: number }
> = {
  light: { label: 'Light', labelAr: 'خفيف', body: '300', heading: '500', sample: 300 },
  regular: { label: 'Regular', labelAr: 'عادي', body: '400', heading: '700', sample: 400 },
  bold: { label: 'Bold', labelAr: 'عريض', body: '700', heading: '800', sample: 700 },
  medium: { label: 'Medium', labelAr: 'متوسط', body: '500', heading: '750', sample: 500 },
};

export type BrandState = {
  palette: BrandPaletteId;
  /** Active font for current UI (legacy + resolved). */
  font: BrandFontId;
  /** Persisted English dashboard font. */
  fontEn?: BrandFontEnId;
  /** Persisted Arabic dashboard font. */
  fontAr?: BrandFontArId;
  iconStyle: BrandIconStyle;
  fontWeight: BrandFontWeight;
  /** Optional custom primary hex (#RRGGBB). When set, overrides preset palette shades. */
  customAccentHex?: string | null;
  /** Optional scrollbar hex. Null = follow global --portal-400 / --accent. */
  customScrollbarHex?: string | null;
  /** Optional page canvas / background hex. Null = follow theme + palette. */
  customBgHex?: string | null;
  /** Optional primary text / font color hex. Null = follow theme + palette. */
  customTextHex?: string | null;
  /** Custom Arabic font family name when fontAr === 'custom-ar' */
  customFontFamilyAr?: string | null;
  /** Optional CSS/Google Fonts URL for custom Arabic face */
  customFontUrlAr?: string | null;
};

export const DEFAULT_BRAND: BrandState = {
  palette: 'holst',
  font: 'jakarta',
  fontEn: 'jakarta',
  fontAr: 'sf-arabic',
  iconStyle: 'rounded',
  fontWeight: 'regular',
  customAccentHex: null,
  customScrollbarHex: null,
  customBgHex: null,
  customTextHex: null,
  customFontFamilyAr: null,
  customFontUrlAr: null,
};

/** Parse #RGB / #RRGGBB → {r,g,b} or null. */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mixChannel(channel: number, target: number, amount: number): number {
  return Math.round(channel + (target - channel) * amount);
}

/** Build portal shade ramp from a single accent hex (light→dark). */
export function paletteFromAccentHex(hex: string): Pick<
  BrandPalette,
  'colorHex' | 'p950' | 'p900' | 'p800' | 'p600' | 'p400' | 'p200' | 'p50'
> | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const toHex = (r: number, g: number, b: number) =>
    `#${[r, g, b]
      .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
      .join('')}`;
  const shade = (towardWhite: number, towardBlack: number) => {
    const r = mixChannel(mixChannel(rgb.r, 255, towardWhite), 0, towardBlack);
    const g = mixChannel(mixChannel(rgb.g, 255, towardWhite), 0, towardBlack);
    const b = mixChannel(mixChannel(rgb.b, 255, towardWhite), 0, towardBlack);
    return toHex(r, g, b);
  };
  const colorHex = toHex(rgb.r, rgb.g, rgb.b);
  return {
    colorHex,
    p600: colorHex,
    p400: shade(0.35, 0),
    p200: shade(0.55, 0),
    p50: shade(0.88, 0),
    p800: shade(0, 0.28),
    p900: shade(0, 0.45),
    p950: shade(0, 0.62),
  };
}

export const EN_FONTS: BrandFontId[] = [
  'jakarta',
  'inter',
  'roboto',
  'open-sans',
  'poppins',
  'montserrat',
  'lato',
  'dm-sans',
  'manrope',
  'outfit',
  'nunito-sans',
  'source-sans-3',
  'work-sans',
  'rubik',
  'urbanist',
];
export const AR_FONTS: BrandFontId[] = [
  'sf-arabic',
  'cairo',
  'tajawal',
  'noto',
  'ibm-plex-ar',
  'almarai',
  'readex-pro',
  'noto-kufi',
  'amiri',
  'markazi',
  'changa',
  'el-messiri',
  'alexandria',
  'reem-kufi',
  'noto-naskh',
  'custom-ar',
];

/** Relative luminance 0–1 (sRGB). */
export function hexLuminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** On dark UI, force light text if merchant picked a dark hex (keep readable). */
export function readableTextForTheme(hex: string | null | undefined, isDark: boolean): string | null {
  if (!hex || !parseHexColor(hex)) return null;
  if (!isDark) return hex;
  const lum = hexLuminance(hex);
  if (lum == null) return hex;
  return lum < 0.45 ? '#f2fbf8' : hex;
}

function sanitizeFontFamilyName(name: string): string {
  return name
    .replace(/['"\\;{}<>]/g, '')
    .trim()
    .slice(0, 80);
}

export function resolveArFontStack(brand: BrandState, arId: BrandFontArId): string {
  if (arId === 'custom-ar') {
    const family = sanitizeFontFamilyName(brand.customFontFamilyAr || '');
    if (family) {
      return `'${family}', ${APPLE_ARABIC_STACK}`;
    }
  }
  return BRAND_FONTS[arId]?.stack || APPLE_ARABIC_STACK;
}

/** Store-isolated AR typography paint (chromeBrand) — fonts only, no palette wipe. */
export function applyStoreArabicTypography(
  opts: {
    fontAr?: BrandFontArId | null;
    fontWeight?: BrandFontWeight | null;
    customFontFamilyAr?: string | null;
    customFontUrlAr?: string | null;
  },
  locale: 'en' | 'ar' = 'ar',
): void {
  if (typeof document === 'undefined') return;
  const arId: BrandFontArId =
    opts.fontAr && AR_FONTS.includes(opts.fontAr) ? opts.fontAr : 'sf-arabic';
  const weightKey: BrandFontWeight =
    opts.fontWeight === 'light' ||
    opts.fontWeight === 'medium' ||
    opts.fontWeight === 'bold' ||
    opts.fontWeight === 'regular'
      ? opts.fontWeight
      : 'regular';
  const brandSlice: BrandState = {
    ...DEFAULT_BRAND,
    fontAr: arId,
    font: arId,
    fontWeight: weightKey,
    customFontFamilyAr: opts.customFontFamilyAr ?? null,
    customFontUrlAr: opts.customFontUrlAr ?? null,
  };
  const arStack = withSaudiRiyalFont(resolveArFontStack(brandSlice, arId));
  const weight = BRAND_FONT_WEIGHTS[weightKey] ?? BRAND_FONT_WEIGHTS.regular;
  const root = document.documentElement;
  root.style.setProperty('--font-ui-ar', arStack);
  root.style.setProperty('--font-ar', arStack);
  if (locale === 'ar') {
    root.style.setProperty('--font-ui', arStack);
  }
  const arMeta = BRAND_FONTS[arId];
  if (arId === 'custom-ar' && brandSlice.customFontUrlAr) {
    ensureBrandFontStylesheet(String(brandSlice.customFontUrlAr), 'unityteck-custom-font-ar');
  } else if (arMeta?.googleFamily) {
    ensureBrandFontStylesheet(
      `https://fonts.googleapis.com/css2?family=${arMeta.googleFamily}&display=swap`,
      `unityteck-font-${arId}`,
    );
  }
  const arMaxWeight =
    arId === 'ibm-plex-ar' || arId === 'noto' || arId === 'amiri' ? 700 : 800;
  const bodyW = Math.min(parseInt(weight.body, 10) || 400, locale === 'ar' ? arMaxWeight : 800);
  const headingW = Math.min(
    parseInt(weight.heading, 10) || 700,
    locale === 'ar' ? arMaxWeight : 800,
  );
  root.style.setProperty('--font-weight-body', String(bodyW));
  root.style.setProperty('--font-weight-heading', String(headingW));
  root.setAttribute('data-brand-fw', weightKey);
}

/** Inject Google / custom stylesheet once (speed — no duplicate links). */
export function ensureBrandFontStylesheet(href: string, linkId: string): void {
  if (typeof document === 'undefined' || !href) return;
  const safe = href.trim();
  if (!/^https:\/\/fonts\.googleapis\.com\/css2\?/i.test(safe) && !/^https:\/\//i.test(safe)) {
    return;
  }
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.href !== safe) link.href = safe;
}

export function resolveFontForLocale(font: BrandFontId, locale: 'en' | 'ar'): BrandFontId {
  if (locale === 'ar') {
    if (AR_FONTS.includes(font as BrandFontArId)) return font;
    return 'sf-arabic';
  }
  if (locale === 'en') {
    if (EN_FONTS.includes(font as BrandFontEnId)) return font;
    return 'jakarta';
  }
  return font;
}

/** Resolve EN/AR fonts independently so locale switch keeps both choices. */
export function resolveBrandFonts(brand: BrandState, locale: 'en' | 'ar'): {
  activeId: BrandFontId;
  enId: BrandFontEnId;
  arId: BrandFontArId;
} {
  const enId: BrandFontEnId =
    brand.fontEn && EN_FONTS.includes(brand.fontEn)
      ? brand.fontEn
      : EN_FONTS.includes(brand.font as BrandFontEnId)
        ? (brand.font as BrandFontEnId)
        : 'jakarta';
  const arId: BrandFontArId =
    brand.fontAr && AR_FONTS.includes(brand.fontAr)
      ? brand.fontAr
      : AR_FONTS.includes(brand.font as BrandFontArId)
        ? (brand.font as BrandFontArId)
        : 'sf-arabic';
  return {
    activeId: locale === 'ar' ? arId : enId,
    enId,
    arId,
  };
}

export function isBrandPaletteId(v: unknown): v is BrandPaletteId {
  return typeof v === 'string' && v in BRAND_PALETTES;
}

export function isBrandFontId(v: unknown): v is BrandFontId {
  return typeof v === 'string' && v in BRAND_FONTS;
}

export function applyBrandCss(brand: BrandState, locale: 'en' | 'ar' = 'en'): void {
  const preset = BRAND_PALETTES[brand.palette] ?? BRAND_PALETTES.holst;
  const custom = brand.customAccentHex ? paletteFromAccentHex(brand.customAccentHex) : null;
  const p = custom
    ? { ...preset, ...custom, id: preset.id, label: preset.label, labelAr: preset.labelAr }
    : preset;

  const { activeId, enId, arId } = resolveBrandFonts(brand, locale);
  const arStack = withSaudiRiyalFont(resolveArFontStack(brand, arId));
  const enStack = withSaudiRiyalFont(BRAND_FONTS[enId]?.stack || BRAND_FONTS.jakarta.stack);
  const activeStack = locale === 'ar' ? arStack : enStack;
  const icon = BRAND_ICON_RADIUS[brand.iconStyle] ?? BRAND_ICON_RADIUS.rounded;
  const weight = BRAND_FONT_WEIGHTS[brand.fontWeight ?? 'regular'] ?? BRAND_FONT_WEIGHTS.regular;
  const root = document.documentElement;

  // Color shades (preset or custom accent)
  root.style.setProperty('--portal-950', p.p950);
  root.style.setProperty('--portal-900', p.p900);
  root.style.setProperty('--portal-800', p.p800);
  root.style.setProperty('--portal-600', p.p600);
  root.style.setProperty('--portal-400', p.p400);
  root.style.setProperty('--portal-200', p.p200);
  root.style.setProperty('--portal-50', p.p50);
  root.style.setProperty('--portal-cta', `linear-gradient(90deg, ${p.p600}, ${p.p400})`);

  // EN/AR stacks always stored; CSS html[lang] picks --font-ui (one global face)
  // SaudiRiyalSign first so U+20C1 never tofu (unicode-range keeps brand faces intact)
  root.style.setProperty('--font-ui-ar', arStack);
  root.style.setProperty('--font-ui-en', enStack);
  root.style.setProperty('--font-ar', arStack);
  root.style.setProperty('--font-ui', activeStack);

  // Load Google faces for selected EN + AR fonts (Light / Regular / Bold)
  const enMeta = BRAND_FONTS[enId];
  if (enMeta?.googleFamily) {
    ensureBrandFontStylesheet(
      `https://fonts.googleapis.com/css2?family=${enMeta.googleFamily}&display=swap`,
      `unityteck-font-${enId}`,
    );
  }
  const arMeta = BRAND_FONTS[arId];
  if (arId === 'custom-ar' && brand.customFontUrlAr) {
    ensureBrandFontStylesheet(String(brand.customFontUrlAr), 'unityteck-custom-font-ar');
  } else if (arMeta?.googleFamily) {
    ensureBrandFontStylesheet(
      `https://fonts.googleapis.com/css2?family=${arMeta.googleFamily}&display=swap`,
      `unityteck-font-${arId}`,
    );
  }

  // Font weights — Arabic faces (IBM Plex / Noto) max at 700; clamp so headers
  // do not fall back to a second family (Cairo/Tajawal) and look "different".
  const arMaxWeight =
    arId === 'ibm-plex-ar' || arId === 'noto' || arId === 'amiri' || arId === 'noto-naskh'
      ? 700
      : 800;
  const bodyW = Math.min(parseInt(weight.body, 10) || 400, locale === 'ar' ? arMaxWeight : 800);
  const headingW = Math.min(parseInt(weight.heading, 10) || 700, locale === 'ar' ? arMaxWeight : 800);
  root.style.setProperty('--font-weight-body', String(bodyW));
  root.style.setProperty('--font-weight-heading', String(headingW));
  root.setAttribute('data-brand-fw', brand.fontWeight || 'regular');

  // Controls & accents
  root.style.setProperty('--radius-ctrl', icon.px);
  root.style.setProperty('--icon-radius', icon.px);
  root.style.setProperty('--accent', p.p600);
  root.style.setProperty('--active-bg', p.p600);
  root.style.setProperty('--active-fg', '#ffffff');
  root.style.setProperty('--active-ring', p.p400);

  // Form / modal / page text — always set BOTH themes (inline light leftovers broke dark mode)
  const isDark = root.getAttribute('data-theme') === 'dark';
  const customBg = brand.customBgHex && parseHexColor(brand.customBgHex) ? brand.customBgHex : null;
  const customTextRaw =
    brand.customTextHex && parseHexColor(brand.customTextHex) ? brand.customTextHex : null;
  // Dark UI: never keep near-black text — auto lift to readable light
  const customText = readableTextForTheme(customTextRaw, isDark);

  if (!isDark) {
    // ONE global page canvas for Master + Store (design pack: --bg = portal-50)
    root.style.setProperty('--bg', customBg || p.p50);
    root.style.setProperty('--surface', '#ffffff');
    root.style.setProperty('--text', customText || p.p950);
    root.style.setProperty('--muted', p.p900);
    root.style.setProperty('--input-bg', '#ffffff');
    root.style.setProperty('--input-fg', customText || p.p950);
    root.style.setProperty('--input-ph', p.p800);
    root.style.setProperty('--table-head', customText || p.p950);
    root.style.setProperty('--card-fg', customText || p.p950);
    root.style.setProperty('--icon-on-light', customText || p.p950);
    root.style.setProperty('--icon-box-fg', customText || p.p950);
    root.style.setProperty('--border', p.p200);
  } else {
    // Deep Holst dark — light text; never leave light-mode dark text stuck inline
    root.style.setProperty('--bg', customBg || p.p950);
    root.style.setProperty('--surface', p.p900);
    root.style.setProperty('--text', customText || '#f2fbf8');
    root.style.setProperty('--muted', '#cbd5e1');
    root.style.setProperty('--input-bg', `color-mix(in srgb, ${p.p950} 70%, ${p.p900})`);
    root.style.setProperty('--input-fg', customText || '#f2fbf8');
    root.style.setProperty('--input-ph', p.p200);
    root.style.setProperty('--table-head', customText || '#e2f4f0');
    root.style.setProperty('--card-fg', customText || '#f2fbf8');
    root.style.setProperty('--icon-on-light', p.p900);
    root.style.setProperty('--icon-on-dark', '#e2f4f0');
    root.style.setProperty('--icon-box-bg', `color-mix(in srgb, ${p.p400} 18%, ${p.p900})`);
    root.style.setProperty('--icon-box-fg', p.p200);
    root.style.setProperty('--border', `color-mix(in srgb, ${p.p400} 28%, transparent)`);
  }

  // Scrollbar: follow brand by default; optional dedicated luxury color
  const sbCustom = brand.customScrollbarHex ? paletteFromAccentHex(brand.customScrollbarHex) : null;
  if (sbCustom) {
    root.style.setProperty('--sb-color', sbCustom.p400);
    root.style.setProperty('--sb-color-deep', sbCustom.p600);
    root.setAttribute('data-custom-scrollbar', sbCustom.colorHex);
  } else {
    root.style.setProperty('--sb-color', p.p400);
    root.style.setProperty('--sb-color-deep', p.p600);
    root.removeAttribute('data-custom-scrollbar');
  }

  root.setAttribute('data-brand', custom ? 'custom' : brand.palette);
  root.setAttribute('data-font', activeId);
  root.setAttribute('data-icon', brand.iconStyle);
  root.setAttribute('data-weight', brand.fontWeight ?? 'regular');
  if (custom) {
    root.setAttribute('data-custom-accent', p.colorHex);
  } else {
    root.removeAttribute('data-custom-accent');
  }
  if (customBg) root.setAttribute('data-custom-bg', customBg);
  else root.removeAttribute('data-custom-bg');
  if (customText) root.setAttribute('data-custom-text', customText);
  else root.removeAttribute('data-custom-text');
  runChromePainter(root);
}
