import React from 'react';
import { RefreshCw, Car, Coffee, ShieldCheck, Flower2, Store as StoreIcon } from 'lucide-react';
import hibrewFlagshipImg from '../../themes/coffeeRoasters/assets/images/hibrew_h7a_flagship_machine.png';

export interface DashboardLoaderProps {
  messageAr?: string;
  messageEn?: string;
  taglineEn?: string;
  logoUrl?: string;
  storeId?: string;
  isAr?: boolean;
  inline?: boolean;
  enabled?: boolean;
  storeName?: string;
}

const ALSAEEDI_REAL_LOGO = 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/wYYVD/OZbzrkkW0icMZlcDNOiZnU4PSjwq6WxXgCkwT0PQ.png';
const MECCA_REAL_LOGO = 'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png';
const HIBREW_FLAGSHIP_IMG = hibrewFlagshipImg;

export const DashboardLoader: React.FC<DashboardLoaderProps> = ({
  messageEn,
  taglineEn,
  logoUrl,
  storeId,
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
      true
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

  // Inline Minimalist Spinner (English single line only)
  if (inline) {
    const inlineBg = isCar
      ? 'bg-[#d5a027]/15 text-[#16032e] dark:text-[#f6c344] border-[#d5a027]/40'
      : isCoffee
      ? 'bg-[#d97706]/15 text-[#451a03] dark:text-[#f59e0b] border-[#d97706]/40'
      : isMaster
      ? 'bg-cyan-500/15 text-cyan-950 dark:text-cyan-300 border-cyan-500/40'
      : 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border-emerald-500/30';

    const defaultInlineMsg = isCar
      ? 'Loading vehicle catalog…'
      : isCoffee
      ? 'Loading coffee catalog…'
      : isMaster
      ? 'Loading master portal…'
      : 'Loading store catalog…';

    return (
      <div className={`inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold border backdrop-blur-sm shadow-xs ${inlineBg}`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span className="font-semibold">{messageEn || defaultInlineMsg}</span>
      </div>
    );
  }

  // =========================================================================
  // Dedicated Store Loaders: ONLY Logo + 1 Line Company Tagline in English
  // =========================================================================

  // 1. HiBrew Coffee Store Page Loader
  if (isCoffee) {
    const englishTagline = taglineEn || messageEn || 'HiBrew KSA · Specialty Coffee Machines & Barista Essentials';

    return (
      <div
        dir="ltr"
        className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 rounded-3xl bg-white/95 dark:bg-[#140f0c] border border-[#d97706]/35 shadow-[0_20px_50px_-15px_rgba(69,26,3,0.3)] flex flex-col items-center max-w-sm w-full mx-auto backdrop-blur-xl">
          {/* Ambient Warm Coffee Glow */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#78350f]/20 via-[#d97706]/15 to-[#f59e0b]/20 blur-2xl pointer-events-none animate-pulse" />

          {/* Center Logo in Rotating Crema Rings */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#d97706]/35 animate-spin [animation-duration:10s]" />
            <div className="absolute inset-1 rounded-full border-[2.5px] border-transparent border-t-[#f59e0b] border-r-[#d97706] animate-spin [animation-duration:1.4s]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#292524] to-[#451a03] shadow-md shadow-black/40 border border-[#d97706]/50 flex items-center justify-center overflow-hidden p-2">
              {effectiveLogo && !imgError ? (
                <img
                  src={effectiveLogo}
                  alt="HiBrew KSA"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <Coffee className="w-8 h-8 text-[#f59e0b] animate-pulse" />
              )}
            </div>
          </div>

          {/* Crema Amber Progress Bar */}
          <div className="w-36 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner">
            <div className="h-full w-full bg-gradient-to-r from-[#78350f] via-[#d97706] to-[#f59e0b] rounded-full animate-pulse shadow-[0_0_10px_rgba(217,119,6,0.6)]" />
          </div>

          {/* Exactly ONE Line: English Company Tagline */}
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans truncate max-w-full">
            {englishTagline}
          </p>
        </div>
      </div>
    );
  }

  // 2. Al-Saeedi VIP Automotive Studio Page Loader
  if (isCar) {
    const englishTagline = taglineEn || messageEn || 'Al-Saeedi VIP · Precision Automotive Styling & Custom Upholstery';

    return (
      <div
        dir="ltr"
        className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 rounded-3xl bg-white/95 dark:bg-[#120224] border border-[#d5a027]/35 shadow-[0_20px_50px_-15px_rgba(22,3,46,0.3)] flex flex-col items-center max-w-sm w-full mx-auto backdrop-blur-xl">
          {/* Ambient Glow */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#d5a027]/20 via-[#f6c344]/15 to-[#3e0f77]/20 blur-2xl pointer-events-none animate-pulse" />

          {/* Center Logo in Gold Rotating Rings */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#d5a027]/35 animate-spin [animation-duration:10s]" />
            <div className="absolute inset-1 rounded-full border-[2.5px] border-transparent border-t-[#f6c344] border-r-[#d5a027] animate-spin [animation-duration:1.4s]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16032e] to-[#25074d] shadow-md shadow-[#16032e]/30 border border-[#f6c344]/50 flex items-center justify-center overflow-hidden p-2">
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
          <div className="w-36 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner">
            <div className="h-full w-full bg-gradient-to-r from-[#d5a027] via-[#f6c344] to-[#ffd700] rounded-full animate-pulse shadow-[0_0_10px_rgba(246,195,68,0.6)]" />
          </div>

          {/* Exactly ONE Line: English Company Tagline */}
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans truncate max-w-full">
            {englishTagline}
          </p>
        </div>
      </div>
    );
  }

  // 3. Master Admin Unified Cloud Platform Page Loader
  if (isMaster) {
    const englishTagline = taglineEn || messageEn || 'UnityTeck SaaS · Multi-Store E-Commerce Cloud Platform';

    return (
      <div
        dir="ltr"
        className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
        aria-busy="true"
        role="status"
      >
        <div className="relative p-8 rounded-3xl bg-white/95 dark:bg-[#071318] border border-cyan-500/35 shadow-[0_20px_50px_-15px_rgba(6,182,212,0.3)] flex flex-col items-center max-w-sm w-full mx-auto backdrop-blur-xl">
          {/* Cyber Ambient Glow */}
          <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-500/15 to-indigo-500/20 blur-2xl pointer-events-none animate-pulse" />

          {/* Center Logo in Cyan Rings */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/35 animate-spin [animation-duration:10s]" />
            <div className="absolute inset-1 rounded-full border-[2.5px] border-transparent border-t-cyan-400 border-r-sky-500 animate-spin [animation-duration:1.4s]" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#082f49] shadow-md shadow-cyan-950/40 border border-cyan-400/50 flex items-center justify-center overflow-hidden p-2">
              <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* Cyan Shimmer Progress Bar */}
          <div className="w-36 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner">
            <div className="h-full w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
          </div>

          {/* Exactly ONE Line: English Company Tagline */}
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans truncate max-w-full">
            {englishTagline}
          </p>
        </div>
      </div>
    );
  }

  // 4. Hadaya Makkah Flowers & Luxury Gifts Page Loader (Default for floral/gift storefronts)
  const flowersTagline = taglineEn || messageEn || (storeName ? `${storeName} · Luxury Flowers & Gifts` : 'Hadaya Makkah · Luxury Fresh Floral Arrangements & VIP Gifts');

  return (
    <div
      dir="ltr"
      className="p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] w-full text-center select-none animate-in fade-in zoom-in-95 duration-200"
      aria-busy="true"
      role="status"
    >
      <div className="relative p-8 rounded-3xl bg-white/95 dark:bg-[#061e14] border border-emerald-500/35 shadow-[0_20px_50px_-15px_rgba(6,78,59,0.3)] flex flex-col items-center max-w-sm w-full mx-auto backdrop-blur-xl">
        {/* Emerald Ambient Glow */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-emerald-400/20 blur-2xl pointer-events-none animate-pulse" />

        {/* Center Logo in Emerald Rings */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/35 animate-spin [animation-duration:10s]" />
          <div className="absolute inset-1 rounded-full border-[2.5px] border-transparent border-t-emerald-500 border-r-teal-400 animate-spin [animation-duration:1.4s]" />

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#064e3b] to-[#047857] shadow-md shadow-emerald-950/40 border border-emerald-400/50 flex items-center justify-center overflow-hidden p-2">
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
        <div className="w-36 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner">
          <div className="h-full w-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
        </div>

        {/* Exactly ONE Line: English Company Tagline */}
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans truncate max-w-full">
          {flowersTagline}
        </p>
      </div>
    </div>
  );
};

