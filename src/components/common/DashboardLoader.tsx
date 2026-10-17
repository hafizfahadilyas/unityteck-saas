import React from 'react';
import { Flower2, Sparkles, RefreshCw, Car, Coffee, ShieldCheck, Store as StoreIcon } from 'lucide-react';

export interface DashboardLoaderProps {
  messageAr?: string;
  messageEn?: string;
  logoUrl?: string;
  storeId?: string;
  isAr?: boolean;
  inline?: boolean;
  enabled?: boolean;
  storeName?: string;
}

import hibrewFlagshipImg from '../../themes/coffeeRoasters/assets/images/hibrew_h7a_flagship_machine.png';

const ALSAEEDI_REAL_LOGO = 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png';
const MECCA_REAL_LOGO = 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png';
const HIBREW_FLAGSHIP_IMG = hibrewFlagshipImg;

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  messageAr,
  messageEn,
  logoUrl,
  storeId,
  isAr = true,
  inline = false,
  enabled = true,
  storeName,
}) => {
  const [imgError, setImgError] = React.useState(false);

  if (!enabled) return null;

  const urlSearch = typeof window !== 'undefined' ? window.location.search.toLowerCase() : '';
  const urlPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

  const isCar =
    storeId === 'store-bleco' ||
    storeId === 'alsaeedi-cars' ||
    logoUrl?.includes('brand-logo') ||
    logoUrl?.includes('transport') ||
    logoUrl?.includes('tanjeed') ||
    urlSearch.includes('store=car') ||
    urlSearch.includes('store=bleco') ||
    urlSearch.includes('demo=car') ||
    urlPath.startsWith('/car') ||
    urlPath.startsWith('/bleco');

  const isCoffee =
    !isCar && (
      storeId === 'store-coffee' ||
      storeId === 'coffee-store' ||
      logoUrl?.includes('coffee') ||
      logoUrl?.includes('hibrew') ||
      urlSearch.includes('store=coffee') ||
      urlSearch.includes('demo=coffee') ||
      urlSearch.includes('hibrew') ||
      urlPath.startsWith('/coffee')
    );

  const isMaster =
    !isCar &&
    !isCoffee && (
      storeId === 'master' ||
      urlSearch.includes('portal=master') ||
      urlSearch.includes('store=master') ||
      urlPath.startsWith('/master')
    );

  const isFlowers =
    !isCar &&
    !isCoffee &&
    !isMaster && (
      storeId === 'store-1' ||
      storeId === 'giftshop-sa' ||
      logoUrl?.includes('flower') ||
      logoUrl?.includes('gift') ||
      urlSearch.includes('store=flowers') ||
      urlSearch.includes('store=makkah') ||
      urlSearch.includes('store=hadaya') ||
      urlSearch.includes('store=1') ||
      urlPath.startsWith('/flowers') ||
      urlPath.startsWith('/hadaya') ||
      true // default to flowers/makkah for other demo storefronts
    );

  // Sanitize Logo per store brand
  const effectiveLogo = React.useMemo(() => {
    if (isCar) {
      if (!logoUrl || logoUrl.includes('brand-logo') || logoUrl.includes('transport')) {
        return ALSAEEDI_REAL_LOGO;
      }
      return logoUrl;
    }
    if (isCoffee) {
      if (!logoUrl || logoUrl.includes('brand-logo') || logoUrl.includes('NKOjvD')) {
        return HIBREW_FLAGSHIP_IMG;
      }
      return logoUrl;
    }
    if (isFlowers) {
      if (!logoUrl || logoUrl.includes('brand-logo')) {
        return MECCA_REAL_LOGO;
      }
      return logoUrl;
    }
    return logoUrl;
  }, [isCar, isCoffee, isFlowers, logoUrl]);

  // Inline Minimalist Spinner
  if (inline) {
    const inlineBg = isCar
      ? 'bg-[#d5a027]/15 text-[#16032e] dark:text-[#f6c344] border-[#d5a027]/40'
      : isCoffee
      ? 'bg-[#d97706]/15 text-[#451a03] dark:text-[#f59e0b] border-[#d97706]/40'
      : isMaster
      ? 'bg-cyan-500/15 text-cyan-950 dark:text-cyan-300 border-cyan-500/40'
      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';

    const defaultInlineMsg = isCar
      ? (isAr ? 'جاري مزامنة بيانات السيارات…' : 'Syncing automotive database…')
      : isCoffee
      ? (isAr ? 'جاري مزامنة مكائن القهوة…' : 'Syncing coffee catalog…')
      : isMaster
      ? (isAr ? 'جاري تحديث لوحة التحكم الموحدة…' : 'Syncing master portal…')
      : (isAr ? 'جاري مزامنة بيانات المتجر…' : 'Syncing store catalog…');

    return (
      <div className={`inline-flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold border backdrop-blur-sm shadow-xs ${inlineBg}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="font-extrabold">{messageAr || messageEn || defaultInlineMsg}</span>
      </div>
    );
  }

  // =========================================================================
  // 1. HiBrew Coffee Store Official Luxury Loader (Coffee Obsidian & Gold)
  // =========================================================================
  if (isCoffee) {
    const defaultTitleAr = 'جاري تحضير تجربة القهوة ومكائن هاي برو الفاخرة…';
    const defaultTitleEn = 'Loading HiBrew specialty coffee & espresso machines…';
    const displayMsg = isAr ? (messageAr || defaultTitleAr) : (messageEn || defaultTitleEn);

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[360px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-[#140f0c] border-2 border-[#d97706]/40 shadow-[0_25px_60px_-15px_rgba(69,26,3,0.35)] flex flex-col items-center max-w-md w-full mx-auto backdrop-blur-xl">
          {/* Ambient Warm Coffee Glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#78350f]/25 via-[#d97706]/20 to-[#f59e0b]/20 blur-2xl pointer-events-none animate-pulse" />

          {/* Multi-Ring Center Container */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            {/* Outer soft dashed orbit ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#d97706]/40 animate-spin [animation-duration:9s]" />

            {/* Inner spinning gradient arc ring */}
            <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-t-[#f59e0b] border-r-[#d97706] animate-spin [animation-duration:1.2s]" />

            {/* Center Logo / Icon Container */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#451a03] shadow-lg shadow-black/40 border-2 border-[#d97706]/60 flex items-center justify-center overflow-hidden p-1.5 transition-transform hover:scale-105">
              {effectiveLogo && !imgError ? (
                <img
                  src={effectiveLogo}
                  alt="HiBrew KSA Coffee"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <Coffee className="w-8 h-8 text-[#f59e0b] animate-pulse" />
              )}
            </div>
          </div>

          {/* Brand Name & Logo Typography */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#d97706] shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
              <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              هايبرو السعودية <span className="text-[#d97706]">HiBrew</span>
            </span>
          </div>

          {/* Rich Crema Amber Shimmer Progress Bar */}
          <div className="w-48 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner border border-slate-300 dark:border-white/10">
            <div className="h-full w-full bg-gradient-to-r from-[#78350f] via-[#d97706] to-[#f59e0b] rounded-full animate-pulse shadow-[0_0_12px_rgba(217,119,6,0.7)]" />
          </div>

          {/* Crisp Title */}
          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1.5 tracking-tight">
            <Sparkles className="w-4 h-4 text-[#d97706] shrink-0 animate-pulse" />
            <span>{displayMsg}</span>
          </h4>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'متجر مكائن ومستلزمات القهوة (HiBrew KSA) · يرجى الانتظار لحظات…' : 'HiBrew KSA Official Store · Please wait a moment…'}
          </p>

          {/* Official Agency Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d97706]/15 border border-[#d97706]/40 text-[#9a3412] dark:text-[#f59e0b] text-[11px] font-black mt-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d97706]" />
            <span>{isAr ? '🇸🇦 وكيل هاي برو المعتمد بالمملكة العربية السعودية' : '🇸🇦 Official Authorized HiBrew Agent KSA'}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. Al-Saeedi Car Studio Official Luxury Loader (Royal Gold & Deep Purple)
  // =========================================================================
  if (isCar) {
    const defaultTitleAr = 'جاري مزامنة بيانات ومقاسات السيارات الفاخرة…';
    const defaultTitleEn = 'Loading luxury vehicle database and catalog…';
    const displayMsg = isAr ? (messageAr || defaultTitleAr) : (messageEn || defaultTitleEn);

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[360px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-[#120224] border-2 border-[#d5a027]/40 shadow-[0_25px_60px_-15px_rgba(22,3,46,0.35)] flex flex-col items-center max-w-md w-full mx-auto backdrop-blur-xl">
          {/* Ambient Glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#d5a027]/25 via-[#f6c344]/15 to-[#3e0f77]/25 blur-2xl pointer-events-none animate-pulse" />

          {/* Multi-Ring Center Container */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#d5a027]/40 animate-spin [animation-duration:9s]" />
            <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-t-[#f6c344] border-r-[#d5a027] animate-spin [animation-duration:1.2s]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16032e] to-[#25074d] shadow-lg shadow-[#16032e]/30 border-2 border-[#f6c344]/50 flex items-center justify-center overflow-hidden p-1.5 transition-transform hover:scale-105">
              {effectiveLogo && !imgError ? (
                <img
                  src={effectiveLogo}
                  alt="Al-Saeedi VIP Automotive"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Car className="w-8 h-8 text-[#f6c344] animate-pulse" />
              )}
            </div>
          </div>

          {/* Gold Shimmer Progress Bar */}
          <div className="w-48 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner border border-slate-300 dark:border-white/10">
            <div className="h-full w-full bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#ffd700] rounded-full animate-pulse shadow-[0_0_12px_rgba(246,195,68,0.7)]" />
          </div>

          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1.5 tracking-tight">
            <Sparkles className="w-4 h-4 text-[#d5a027] shrink-0 animate-pulse" />
            <span>{displayMsg}</span>
          </h4>

          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'متجر السعيدي VIP · يرجى الانتظار لحظات…' : 'Al-Saeedi VIP Automotive · Please wait a moment…'}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d5a027]/15 border border-[#d5a027]/40 text-[#92640e] dark:text-[#f6c344] text-[11px] font-black mt-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#d5a027]" />
            <span>{isAr ? '🇸🇦 أستوديو التنجيد والتفصيل الليزري بمكة' : '🇸🇦 Flagship Makkah Automotive Studio'}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. Master Admin Unified Cloud Platform Loader (Cyber Cyan & Indigo)
  // =========================================================================
  if (isMaster) {
    const defaultTitleAr = 'جاري تشغيل منصة يونيتي تك وإدارة المتاجر السحابية…';
    const defaultTitleEn = 'Loading UnityTeck Cloud SaaS Merchants Portal…';
    const displayMsg = isAr ? (messageAr || defaultTitleAr) : (messageEn || defaultTitleEn);

    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[360px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-[#071318] border-2 border-cyan-500/40 shadow-[0_25px_60px_-15px_rgba(6,182,212,0.35)] flex flex-col items-center max-w-md w-full mx-auto backdrop-blur-xl">
          {/* Cyber Ambient Glow */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-500/15 to-indigo-500/20 blur-2xl pointer-events-none animate-pulse" />

          {/* Multi-Ring Center Container */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin [animation-duration:9s]" />
            <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-t-cyan-400 border-r-sky-500 animate-spin [animation-duration:1.2s]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#082f49] shadow-lg shadow-cyan-950/40 border-2 border-cyan-400/60 flex items-center justify-center overflow-hidden p-1.5 transition-transform hover:scale-105">
              <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* Cyan Shimmer Progress Bar */}
          <div className="w-48 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner border border-slate-300 dark:border-white/10">
            <div className="h-full w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.7)]" />
          </div>

          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1.5 tracking-tight">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 animate-pulse" />
            <span>{displayMsg}</span>
          </h4>

          <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
            {isAr ? 'منصة يونيتي تك لإدارة المتاجر السحابية · KSA 100 Stores' : 'UnityTeck Unified Merchants Portal · KSA 100 Stores'}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-800 dark:text-cyan-300 text-[11px] font-black mt-3 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            <span>{isAr ? '🇸🇦 درع الحماية السيبرانية الفعال ومكافحة الاختراق Active' : '🇸🇦 Anti-Hack Shield Active'}</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. Hadaya Makkah Flowers & Luxury Gifts Loader (Emerald Green & Gold)
  // =========================================================================
  const defaultTitleAr = 'جاري تجهيز باقات الورد الطبيعي وهدايا مكة الفاخرة…';
  const defaultTitleEn = 'Loading fresh floral arrangements and luxury gifts…';
  const displayMsg = isAr ? (messageAr || defaultTitleAr) : (messageEn || defaultTitleEn);

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[360px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
      aria-busy="true"
      role="status"
    >
      <div className="relative p-8 sm:p-10 rounded-3xl bg-white/95 dark:bg-[#061e14] border-2 border-emerald-500/40 shadow-[0_25px_60px_-15px_rgba(6,78,59,0.35)] flex flex-col items-center max-w-md w-full mx-auto backdrop-blur-xl">
        {/* Emerald Ambient Glow */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-emerald-400/20 blur-2xl pointer-events-none animate-pulse" />

        {/* Multi-Ring Center Container */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/40 animate-spin [animation-duration:9s]" />
          <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-teal-400 animate-spin [animation-duration:1.2s]" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] shadow-lg shadow-emerald-950/40 border-2 border-emerald-400/50 flex items-center justify-center overflow-hidden p-1.5 transition-transform hover:scale-105">
            {effectiveLogo && !imgError ? (
              <img
                src={effectiveLogo}
                alt={storeName || "Makkah Flowers & Gifts"}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            ) : (
              <Flower2 className="w-8 h-8 text-emerald-300 animate-pulse" />
            )}
          </div>
        </div>

        {/* Emerald Shimmer Progress Bar */}
        <div className="w-48 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner border border-slate-300 dark:border-white/10">
          <div className="h-full w-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
        </div>

        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-2 mb-1.5 tracking-tight">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
          <span>{displayMsg}</span>
        </h4>

        <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {storeName ? `${storeName} · ${isAr ? 'يرجى الانتظار لحظات…' : 'Please wait a moment…'}` : (isAr ? 'متجر هدايا مكة للزهور الفاخرة · يرجى الانتظار لحظات…' : 'Makkah Gifts & Flowers · Please wait a moment…')}
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-black mt-3 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>{isAr ? '🇸🇦 متجر الزهور الطبيعية والهدايا بالعاصمة المقدسة' : '🇸🇦 Flagship Makkah Floral & Gifts Studio'}</span>
        </div>
      </div>
    </div>
  );
};
