/**
 * Platform branding — Master + Store same Holst chrome.
 * Custom: Top 15 color palettes · Top 15 Google Fonts (EN 7 + AR 6 + UR 2) · Font weights.
 * Runtime via CSS vars (Prefs → BrandingPanel / Settings).
 */

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

/** EN Google fonts (dashboard UI) */
export type BrandFontEnId =
  | 'jakarta'
  | 'inter'
  | 'dm-sans'
  | 'manrope'
  | 'outfit'
  | 'poppins'
  | 'urbanist';

/** AR Google fonts (Arabic-first / bilingual) */
export type BrandFontArId =
  | 'cairo'
  | 'noto'
  | 'ibm-plex-ar'
  | 'tajawal'
  | 'almarai'
  | 'alexandria';

export type BrandFontId = BrandFontEnId | BrandFontArId;
export type BrandIconStyle = 'soft' | 'rounded' | 'sharp';
export type BrandFontWeight = 'light' | 'regular' | 'medium' | 'bold';

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
 * Top Google Fonts:
 * 7 English + 6 Arabic — fully loaded with multiple font weights.
 */
export const BRAND_FONTS: Record<BrandFontId, BrandFontMeta> = {
  // English (7)
  jakarta: {
    id: 'jakarta',
    label: 'Plus Jakarta Sans',
    labelAr: 'جاكارتا سانس',
    labelUr: 'پلس جکارتہ سانس',
    stack: "'Plus Jakarta Sans', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Plus+Jakarta+Sans:wght@300;400;500;600;700;800',
  },
  inter: {
    id: 'inter',
    label: 'Inter',
    labelAr: 'إنتر',
    labelUr: 'انٹر',
    stack: "'Inter', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Inter:wght@300;400;500;600;700;800',
  },
  'dm-sans': {
    id: 'dm-sans',
    label: 'DM Sans',
    labelAr: 'دي إم سانس',
    labelUr: 'ڈی ایم سانس',
    stack: "'DM Sans', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'DM+Sans:wght@400;500;600;700',
  },
  manrope: {
    id: 'manrope',
    label: 'Manrope',
    labelAr: 'مانروب',
    labelUr: 'مین روپ',
    stack: "'Manrope', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Manrope:wght@400;500;600;700;800',
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit',
    labelAr: 'أوتفيت',
    labelUr: 'آؤٹ فٹ',
    stack: "'Outfit', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Outfit:wght@300;400;500;600;700;800',
  },
  poppins: {
    id: 'poppins',
    label: 'Poppins',
    labelAr: 'بوبينز',
    labelUr: 'پوپنز',
    stack: "'Poppins', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Poppins:wght@300;400;500;600;700;800',
  },
  urbanist: {
    id: 'urbanist',
    label: 'Urbanist',
    labelAr: 'أوربانيست',
    labelUr: 'اربنیسٹ',
    stack: "'Urbanist', 'Cairo', 'Noto Sans Arabic', system-ui, sans-serif",
    script: 'en',
    googleFamily: 'Urbanist:wght@300;400;500;600;700;800',
  },

  // Arabic (6)
  cairo: {
    id: 'cairo',
    label: 'Cairo (Default AR)',
    labelAr: 'القاهرة (كلاسيكي)',
    labelUr: 'قاہرہ (عربی)',
    stack: "'Cairo', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Cairo:wght@400;500;600;700;800',
  },
  noto: {
    id: 'noto',
    label: 'Noto Sans Arabic',
    labelAr: 'نوتو عربي قياسي',
    labelUr: 'نوٹو عربی',
    stack: "'Noto Sans Arabic', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Noto+Sans+Arabic:wght@400;500;600;700;800',
  },
  'ibm-plex-ar': {
    id: 'ibm-plex-ar',
    label: 'IBM Plex Sans Arabic',
    labelAr: 'آي بي إم بليكس عربي',
    labelUr: 'آئی بی ایم پلیکس عربی',
    stack: "'IBM Plex Sans Arabic', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'IBM+Plex+Sans+Arabic:wght@400;500;600;700',
  },
  tajawal: {
    id: 'tajawal',
    label: 'Tajawal',
    labelAr: 'تجوال هندسي',
    labelUr: 'تجوال',
    stack: "'Tajawal', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Tajawal:wght@400;500;700;800',
  },
  almarai: {
    id: 'almarai',
    label: 'Almarai',
    labelAr: 'المراعي عصري',
    labelUr: 'المراعی',
    stack: "'Almarai', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Almarai:wght@300;400;700;800',
  },
  alexandria: {
    id: 'alexandria',
    label: 'Alexandria',
    labelAr: 'الإسكندرية فاخر',
    labelUr: 'اسکندریہ',
    stack: "'Alexandria', 'Plus Jakarta Sans', system-ui, sans-serif",
    script: 'ar',
    googleFamily: 'Alexandria:wght@300;400;500;600;700;800',
  },
};

export const BRAND_FONTS_EN = (
  ['jakarta', 'inter', 'dm-sans', 'manrope', 'outfit', 'poppins', 'urbanist'] as BrandFontEnId[]
).map((id) => BRAND_FONTS[id]);

export const BRAND_FONTS_AR = (
  ['ibm-plex-ar', 'noto', 'cairo', 'tajawal', 'almarai', 'alexandria'] as BrandFontArId[]
).map((id) => BRAND_FONTS[id]);

export const BRAND_FONTS_UR = BRAND_FONTS_AR;

export const BRAND_FONT_IDS = Object.keys(BRAND_FONTS) as BrandFontId[];

export const BRAND_ICON_RADIUS: Record<BrandIconStyle, { label: string; px: string }> = {
  soft: { label: 'Soft', px: '12px' },
  rounded: { label: 'Rounded', px: '16px' },
  sharp: { label: 'Sharp', px: '6px' },
};

export const BRAND_FONT_WEIGHTS: Record<
  BrandFontWeight,
  { label: string; labelAr: string; body: string; heading: string }
> = {
  light: { label: 'Light', labelAr: 'خفيف', body: '350', heading: '600' },
  regular: { label: 'Regular', labelAr: 'عادي', body: '400', heading: '700' },
  medium: { label: 'Medium', labelAr: 'متوسط', body: '500', heading: '750' },
  bold: { label: 'Bold', labelAr: 'عريض', body: '600', heading: '800' },
};

export type BrandState = {
  palette: BrandPaletteId;
  font: BrandFontId;
  iconStyle: BrandIconStyle;
  fontWeight: BrandFontWeight;
};

export const DEFAULT_BRAND: BrandState = {
  palette: 'holst',
  font: 'jakarta',
  iconStyle: 'rounded',
  fontWeight: 'regular',
};

export const EN_FONTS: BrandFontId[] = [
  'jakarta',
  'inter',
  'dm-sans',
  'manrope',
  'outfit',
  'poppins',
  'urbanist',
];
export const AR_FONTS: BrandFontId[] = [
  'ibm-plex-ar',
  'noto',
  'cairo',
  'tajawal',
  'almarai',
  'alexandria',
];

export function resolveFontForLocale(font: BrandFontId, locale: 'en' | 'ar'): BrandFontId {
  if (locale === 'ar') {
    if (AR_FONTS.includes(font)) return font;
    return 'ibm-plex-ar';
  }
  if (locale === 'en') {
    if (EN_FONTS.includes(font)) return font;
    return 'jakarta';
  }
  return font;
}

export function isBrandPaletteId(v: unknown): v is BrandPaletteId {
  return typeof v === 'string' && v in BRAND_PALETTES;
}

export function isBrandFontId(v: unknown): v is BrandFontId {
  return typeof v === 'string' && v in BRAND_FONTS;
}

export function applyBrandCss(brand: BrandState, locale: 'en' | 'ar' = 'en'): void {
  const p = BRAND_PALETTES[brand.palette] ?? BRAND_PALETTES.holst;
  const resolvedFontId = resolveFontForLocale(brand.font, locale);
  const font = BRAND_FONTS[resolvedFontId] ?? BRAND_FONTS.jakarta;
  const icon = BRAND_ICON_RADIUS[brand.iconStyle] ?? BRAND_ICON_RADIUS.rounded;
  const weight = BRAND_FONT_WEIGHTS[brand.fontWeight ?? 'regular'] ?? BRAND_FONT_WEIGHTS.regular;
  const root = document.documentElement;

  // Color shades
  root.style.setProperty('--portal-950', p.p950);
  root.style.setProperty('--portal-900', p.p900);
  root.style.setProperty('--portal-800', p.p800);
  root.style.setProperty('--portal-600', p.p600);
  root.style.setProperty('--portal-400', p.p400);
  root.style.setProperty('--portal-200', p.p200);
  root.style.setProperty('--portal-50', p.p50);
  root.style.setProperty('--portal-cta', `linear-gradient(90deg, ${p.p600}, ${p.p400})`);

  // Primary UI font
  root.style.setProperty('--font-ui', font.stack);

  // Script-specific stacks
  const activeArFont = AR_FONTS.includes(brand.font) ? BRAND_FONTS[brand.font] : BRAND_FONTS['ibm-plex-ar'];
  const activeEnFont = EN_FONTS.includes(brand.font) ? BRAND_FONTS[brand.font] : BRAND_FONTS.jakarta;

  root.style.setProperty('--font-ui-ar', activeArFont.stack);
  root.style.setProperty('--font-ui-en', activeEnFont.stack);
  root.style.setProperty('--font-ar', "'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Cairo', sans-serif");

  // Font weights
  root.style.setProperty('--font-weight-body', weight.body);
  root.style.setProperty('--font-weight-heading', weight.heading);

  // Controls & accents
  root.style.setProperty('--radius-ctrl', icon.px);
  root.style.setProperty('--icon-radius', icon.px);
  root.style.setProperty('--accent', p.p600);
  root.style.setProperty('--active-bg', p.p600);
  root.style.setProperty('--active-fg', '#ffffff');
  root.style.setProperty('--active-ring', p.p400);

  root.setAttribute('data-brand', brand.palette);
  root.setAttribute('data-font', resolvedFontId);
  root.setAttribute('data-icon', brand.iconStyle);
  root.setAttribute('data-weight', brand.fontWeight ?? 'regular');
}
