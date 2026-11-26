/**
 * Shared store font catalog — every store theme / builder / Canva / invoice dropdown.
 * Arabic: Google Fonts Arabic subset + OS Arabic faces (≈100).
 * English: curated Google Latin faces (50).
 * Selection is by family name string; change applies store-wide via theme settings.
 */

export type StoreFontSource = 'google' | 'system';
export type StoreFontCategory = 'Arabic' | 'Latin';

export type StoreGoogleFont = {
  name: string;
  category: StoreFontCategory;
  /** Arabic UI label (chrome only — never mixed into EN locale) */
  labelAr: string;
  source: StoreFontSource;
};

const ar = (name: string, labelAr: string, source: StoreFontSource = 'google'): StoreGoogleFont => ({
  name,
  category: 'Arabic',
  labelAr,
  source,
});

const en = (name: string, labelAr: string): StoreGoogleFont => ({
  name,
  category: 'Latin',
  labelAr,
  source: 'google',
});

/** All Google Fonts families with Arabic subset (verified catalog) + OS Arabic faces. */
export const STORE_ARABIC_FONTS: StoreGoogleFont[] = [
  // ── Google Fonts · Arabic ──
  ar('Cairo', 'القاهرة'),
  ar('Tajawal', 'تجوال'),
  ar('Almarai', 'المراعي'),
  ar('Noto Sans Arabic', 'نوتو سانس عربي'),
  ar('Noto Naskh Arabic', 'نوتو نسخ عربي'),
  ar('Noto Kufi Arabic', 'نوتو كوفي عربي'),
  ar('Noto Serif Arabic', 'نوتو سيريف عربي'),
  ar('Noto Nastaliq Urdu', 'نوتو نستعليق'),
  ar('IBM Plex Sans Arabic', 'آي بي إم بليكس عربي'),
  ar('Readex Pro', 'ريدكس برو'),
  ar('Alexandria', 'الإسكندرية'),
  ar('Amiri', 'أميري'),
  ar('Amiri Quran', 'أميري قرآن'),
  ar('Changa', 'شانغا'),
  ar('El Messiri', 'المسيري'),
  ar('Markazi Text', 'مركزي نص'),
  ar('Reem Kufi', 'ريم كوفي'),
  ar('Reem Kufi Fun', 'ريم كوفي مرح'),
  ar('Reem Kufi Ink', 'ريم كوفي حبر'),
  ar('Aref Ruqaa', 'عارف رقعة'),
  ar('Aref Ruqaa Ink', 'عارف رقعة حبر'),
  ar('Scheherazade New', 'شهرزاد جديد'),
  ar('Lateef', 'لطيف'),
  ar('Harmattan', 'هارماتان'),
  ar('Mada', 'مدى'),
  ar('Kufam', 'كوفام'),
  ar('Katibeh', 'كتيبة'),
  ar('Lalezar', 'لاله‌زار'),
  ar('Lemonada', 'ليمونادا'),
  ar('Baloo Bhaijaan 2', 'بالو بايجان'),
  ar('Mirza', 'ميرزا'),
  ar('Rakkas', 'رقاص'),
  ar('Marhey', 'مرحي'),
  ar('Rubik', 'روبيك'),
  ar('Vazirmatn', 'وزيرمتن'),
  ar('Zain', 'زين'),
  ar('Beiruti', 'بيروتي'),
  ar('Fustat', 'فسطاط'),
  ar('Gulzar', 'گلزار'),
  ar('Alkalami', 'الكلامي'),
  ar('Jomhuria', 'جمهورية'),
  ar('Qahiri', 'قاهري'),
  ar('Blaka', 'بلاكا'),
  ar('Blaka Hollow', 'بلاكا مجوف'),
  ar('Blaka Ink', 'بلاكا حبر'),
  ar('Badeen Display', 'بادين للعرض'),
  ar('Cairo Play', 'القاهرة مرح'),
  ar('Ruwudu', 'روودو'),
  ar('Vibes', 'فايبز'),
  ar('Handjet', 'هاندجيت'),
  ar('Playpen Sans Arabic', 'بلايبين سانس عربي'),
  ar('Parastoo', 'برستو'),
  ar('Alan Sans', 'آلان سانس'),
  ar('Alyamama', 'اليمامة'),
  ar('Estedad', 'استعداد'),
  ar('Cascadia Code', 'كاسكاديا كود'),
  ar('Cascadia Mono', 'كاسكاديا مونو'),
  ar('Oi', 'أوي'),
  ar('Thabit', 'ثابت'),

  // ── System / OS Arabic (no Google load) ──
  ar('SF Arabic', 'سف عربي (آيفون)', 'system'),
  ar('Microsoft Sans Serif', 'مايكروسوفت سانس', 'system'),
  ar('Calibri', 'كاليبري', 'system'),
  ar('Cambria', 'كامبريا', 'system'),
  ar('Segoe UI', 'سيجو يو آي', 'system'),
  ar('Tahoma', 'تاهوما', 'system'),
  ar('Arial', 'أريال', 'system'),
  ar('Traditional Arabic', 'العربية التقليدية', 'system'),
  ar('Simplified Arabic', 'العربية المبسطة', 'system'),
  ar('Arabic Typesetting', 'تنضيد عربي', 'system'),
  ar('Andalus', 'أندلس', 'system'),
  ar('Aldhabi', 'الذهبي', 'system'),
  ar('Sakkal Majalla', 'سكّال مجلة', 'system'),
  ar('Microsoft Uighur', 'مايكروسوفت أويغور', 'system'),
  ar('Urdu Typesetting', 'تنضيد أردو', 'system'),
  ar('Geeza Pro', 'جيزة برو', 'system'),
  ar('Al Bayan', 'البيان', 'system'),
  ar('Baghdad', 'بغداد', 'system'),
  ar('Damascus', 'دمشق', 'system'),
  ar('Farah', 'فرح', 'system'),
  ar('DecoType Naskh', 'ديكوتايب نسخ', 'system'),
  ar('KufiStandardGK', 'كوفي قياسي', 'system'),
  ar('Nadeem', 'نديم', 'system'),
  ar('Sana', 'صنعاء', 'system'),
  ar('Waseem', 'وسيم', 'system'),
  ar('Diwan Kufi', 'ديوان كوفي', 'system'),
  ar('Diwan Thuluth', 'ديوان ثلث', 'system'),
  ar('Mishafi', 'مشافي', 'system'),
  ar('Mishafi Gold', 'مشافي ذهب', 'system'),
  ar('Times New Roman', 'تايمز نيو رومان', 'system'),
  ar('Courier New', 'كوريير جديد', 'system'),
  ar('Georgia', 'جورجيا', 'system'),
  ar('Verdana', 'فيردانا', 'system'),
  ar('Trebuchet MS', 'تريبوشت', 'system'),
  ar('Lucida Grande', 'لوسيدا', 'system'),
  ar('Helvetica Neue', 'هيلفيتيكا', 'system'),
  ar('Apple SD Gothic Neo', 'آبل سانس', 'system'),
  ar('Noto Sans', 'نوتو سانس نظام', 'system'),
  ar('system-ui', 'خط النظام', 'system'),
  ar('sans-serif', 'بلا زوائد', 'system'),
  ar('serif', 'بزوائد', 'system'),
];

/** Curated English / Latin Google Fonts (50) for storefront + creatives. */
export const STORE_ENGLISH_FONTS: StoreGoogleFont[] = [
  en('Inter', 'إنتر'),
  en('Roboto', 'روبوتو'),
  en('Open Sans', 'أوبن سانس'),
  en('Lato', 'لاتو'),
  en('Montserrat', 'مونتسيرات'),
  en('Poppins', 'بوبينز'),
  en('Plus Jakarta Sans', 'جاكرتا سانس'),
  en('Outfit', 'أوتفت'),
  en('DM Sans', 'دي إم سانس'),
  en('Manrope', 'مانروب'),
  en('Nunito Sans', 'نونيتو سانس'),
  en('Source Sans 3', 'سورس سانس'),
  en('Work Sans', 'ورك سانس'),
  en('Urbanist', 'أوربانيست'),
  en('Nunito', 'نونيتو'),
  en('Raleway', 'راليواي'),
  en('Oswald', 'أوزوالد'),
  en('Merriweather', 'ميريويذر'),
  en('Playfair Display', 'بلاي فير'),
  en('PT Sans', 'بي تي سانس'),
  en('Ubuntu', 'أوبونتو'),
  en('Mulish', 'موليش'),
  en('Heebo', 'هيبو'),
  en('Barlow', 'بارلو'),
  en('Karla', 'كارلا'),
  en('Inconsolata', 'إنكونسولاتا'),
  en('Fira Sans', 'فيرا سانس'),
  en('Libre Franklin', 'ليبر فرانكلين'),
  en('Josefin Sans', 'جوزيفين'),
  en('Quicksand', 'كويك ساند'),
  en('Cabin', 'كابين'),
  en('Archivo', 'أرشيفو'),
  en('Space Grotesk', 'سبيس جروتسك'),
  en('Sora', 'سورا'),
  en('Figtree', 'فيجتري'),
  en('Lexend', 'ليكسند'),
  en('Instrument Sans', 'إنسترومنت'),
  en('Public Sans', 'بابليك سانس'),
  en('Schibsted Grotesk', 'شيبستد'),
  en('Bricolage Grotesque', 'بريكولاچ'),
  en('Fraunces', 'فرونسز'),
  en('Cormorant Garamond', 'كورمورانت'),
  en('Libre Baskerville', 'ليبر باسكرفيل'),
  en('EB Garamond', 'إي بي جاراموند'),
  en('Cinzel', 'سينزل'),
  en('Bebas Neue', 'بيباس نيو'),
  en('Anton', 'أنطون'),
  en('Staatliches', 'ستاتليش'),
  en('Comfortaa', 'كومفورتتا'),
  en('Pacifico', 'باسيفيكو'),
];

export const STORE_GOOGLE_FONTS: StoreGoogleFont[] = [
  ...STORE_ARABIC_FONTS,
  ...STORE_ENGLISH_FONTS,
];

export const STORE_ARABIC_FONT_COUNT = STORE_ARABIC_FONTS.length;
export const STORE_ENGLISH_FONT_COUNT = STORE_ENGLISH_FONTS.length;

/** Legacy shape used by BuilderTypographyControl / SiteCodePanel. */
export type PopularGoogleFont = {
  name: string;
  category: 'Arabic' | 'Latin';
  labelAr: string;
};

export const POPULAR_GOOGLE_FONTS: PopularGoogleFont[] = STORE_GOOGLE_FONTS.map((f) => ({
  name: f.name,
  category: f.category,
  labelAr: f.labelAr,
}));

export function findStoreFont(name: string): StoreGoogleFont | undefined {
  const clean = String(name || '').replace(/['"]/g, '').trim();
  if (!clean) return undefined;
  return STORE_GOOGLE_FONTS.find((f) => f.name.toLowerCase() === clean.toLowerCase());
}

export function googleFontsCssUrl(familyName: string, weights = '300;400;500;600;700;800;900'): string {
  const family = encodeURIComponent(familyName.trim()).replace(/%20/g, '+');
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;
}

/** Inject Google Font stylesheet once (no-op for system faces). */
export function ensureStoreGoogleFontLoaded(familyName: string): void {
  if (typeof document === 'undefined') return;
  const clean = String(familyName || '').replace(/['"]/g, '').trim();
  if (!clean) return;
  const meta = findStoreFont(clean);
  if (meta?.source === 'system') return;
  if (/^(serif|sans-serif|system-ui|monospace|cursive|fantasy)$/i.test(clean)) return;

  const linkId = `store-gf-${clean.replace(/\s+/g, '-')}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = googleFontsCssUrl(clean);
  document.head.appendChild(link);
}

export function storeFontCssFamily(familyName: string, fallback = 'var(--font-ui, sans-serif)'): string {
  const clean = String(familyName || '').replace(/['"]/g, '').trim();
  if (!clean) return fallback;
  if (/^(serif|sans-serif|system-ui|monospace|cursive|fantasy)$/i.test(clean)) {
    return `${clean}, ${fallback}`;
  }
  return `'${clean}', ${fallback}`;
}
