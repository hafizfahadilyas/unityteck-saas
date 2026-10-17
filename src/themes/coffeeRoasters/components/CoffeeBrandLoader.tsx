import React from 'react';
import { Sparkles, ShieldCheck, Coffee } from 'lucide-react';
import h7aLogoImg from '../assets/images/hibrew_h7a_flagship_machine.png';

export interface CoffeeBrandLoaderProps {
  messageAr?: string;
  messageEn?: string;
  fullScreen?: boolean;
}

export const CoffeeBrandLoader: React.FC<CoffeeBrandLoaderProps> = ({
  messageAr,
  messageEn,
  fullScreen = false
}) => {
  const [imgError, setImgError] = React.useState(false);

  const defaultMsgAr = 'جاري تحضير تجربة القهوة ومكائن هاي برو الفاخرة…';
  const defaultMsgEn = 'Loading HiBrew specialty coffee & barista machines…';
  const displayAr = messageAr || defaultMsgAr;
  const displayEn = messageEn || defaultMsgEn;

  return (
    <div
      dir="auto"
      className={`w-full flex items-center justify-center p-6 sm:p-10 select-none animate-in fade-in zoom-in-95 duration-200 ${
        fullScreen ? 'min-h-screen bg-[#FAF8F5]' : 'min-h-[60vh] bg-transparent'
      }`}
      aria-busy="true"
      role="status"
    >
      <div className="relative p-8 sm:p-10 rounded-3xl bg-white/95 border-2 border-[#8B5A2B]/30 shadow-[0_20px_50px_-15px_rgba(139,90,43,0.25)] flex flex-col items-center max-w-md w-full mx-auto backdrop-blur-xl text-center">
        {/* Warm Coffee Amber Ambient Glow */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#78350f]/20 via-[#8B5A2B]/15 to-[#f59e0b]/20 blur-2xl pointer-events-none animate-pulse" />

        {/* Center Multi-Ring Branding Container */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-5">
          {/* Outer dashed spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#8B5A2B]/40 animate-spin [animation-duration:9s]" />

          {/* Inner spinning gradient crema arc */}
          <div className="absolute inset-1.5 rounded-full border-[3px] border-transparent border-t-[#8B5A2B] border-r-[#D97706] animate-spin [animation-duration:1.2s]" />

          {/* Center Brand Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#2A1810] to-[#451a03] shadow-lg shadow-black/30 border-2 border-[#8B5A2B]/60 flex items-center justify-center overflow-hidden p-2 transition-transform hover:scale-105">
            {!imgError ? (
              <img
                src={h7aLogoImg}
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
          <svg className="w-5 h-5 text-[#8B5A2B] shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.5" />
            <path d="M12 3.5 A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 font-sans">
            هايبرو السعودية <span className="text-[#8B5A2B]">HiBrew</span>
          </span>
        </div>

        {/* Crema Shimmer Progress Bar */}
        <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden my-3 relative shadow-inner border border-neutral-200/80">
          <div className="h-full w-full bg-gradient-to-r from-[#78350f] via-[#8B5A2B] to-[#f59e0b] rounded-full animate-pulse shadow-[0_0_12px_rgba(139,90,43,0.7)]" />
        </div>

        {/* Status Title */}
        <h4 className="text-sm sm:text-base font-extrabold text-neutral-800 flex items-center justify-center gap-1.5 mb-1 tracking-tight">
          <Sparkles className="w-4 h-4 text-[#8B5A2B] shrink-0 animate-pulse" />
          <span>{displayAr}</span>
        </h4>

        {/* Subtitle Branding */}
        <p className="text-xs font-semibold text-neutral-500">
          متجر مكائن ومستلزمات القهوة المعتمد · يرجى الانتظار لحظات…
        </p>

        {/* Official KSA Agency Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/30 text-[#8B5A2B] text-[11px] font-black mt-4 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8B5A2B]" />
          <span>🇸🇦 وكيل هاي برو المعتمد بالمملكة العربية السعودية · ضمان سنتين</span>
        </div>
      </div>
    </div>
  );
};
