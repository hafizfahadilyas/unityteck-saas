import React from 'react';
import { Coffee } from 'lucide-react';
import h7aLogoImg from '../assets/images/hibrew_h7a_flagship_machine.png';

export interface CoffeeBrandLoaderProps {
  messageEn?: string;
  taglineEn?: string;
  fullScreen?: boolean;
}

export const CoffeeBrandLoader: React.FC<CoffeeBrandLoaderProps> = ({
  messageEn,
  taglineEn,
  fullScreen = false
}) => {
  const [imgError, setImgError] = React.useState(false);

  const englishTagline = taglineEn || messageEn || 'HiBrew KSA · Specialty Coffee Machines & Barista Essentials';

  return (
    <div
      dir="ltr"
      className={`w-full flex items-center justify-center p-6 sm:p-10 select-none animate-in fade-in zoom-in-95 duration-200 ${
        fullScreen ? 'min-h-screen bg-[#FAF8F5] dark:bg-[#120e0c]' : 'min-h-[50vh] bg-transparent'
      }`}
      aria-busy="true"
      role="status"
    >
      <div className="relative p-8 rounded-3xl bg-white/95 dark:bg-[#1a1412] border border-[#8B5A2B]/30 shadow-[0_20px_50px_-15px_rgba(139,90,43,0.25)] flex flex-col items-center max-w-sm w-full mx-auto backdrop-blur-xl text-center">
        {/* Warm Coffee Amber Ambient Glow */}
        <div className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#78350f]/20 via-[#8B5A2B]/15 to-[#f59e0b]/20 blur-2xl pointer-events-none animate-pulse" />

        {/* Center Multi-Ring Branding Container */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-5">
          {/* Outer dashed spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#8B5A2B]/40 animate-spin [animation-duration:9s]" />

          {/* Inner spinning gradient crema arc */}
          <div className="absolute inset-1.5 rounded-full border-[2.5px] border-transparent border-t-[#8B5A2B] border-r-[#D97706] animate-spin [animation-duration:1.3s]" />

          {/* Center Brand Emblem */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1c1917] via-[#2A1810] to-[#451a03] shadow-lg shadow-black/30 border border-[#8B5A2B]/60 flex items-center justify-center overflow-hidden p-2 transition-transform hover:scale-105">
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

        {/* Crema Shimmer Progress Bar */}
        <div className="w-36 h-1.5 bg-neutral-100 dark:bg-white/10 rounded-full overflow-hidden mb-4 relative shadow-inner border border-neutral-200/80 dark:border-white/10">
          <div className="h-full w-full bg-gradient-to-r from-[#78350f] via-[#8B5A2B] to-[#f59e0b] rounded-full animate-pulse shadow-[0_0_12px_rgba(139,90,43,0.7)]" />
        </div>

        {/* Exactly ONE Line: English Company Tagline */}
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-200 font-sans truncate max-w-full">
          {englishTagline}
        </p>
      </div>
    </div>
  );
};
