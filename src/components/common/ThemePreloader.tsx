import React, { useEffect, useState } from 'react';
import { MECCA_LOGO } from '../../data/hadayaMeccaData';
import { Sparkles, Flower2 } from 'lucide-react';

interface ThemePreloaderProps {
  isLoading?: boolean;
  storeName?: string;
  storeNameAr?: string;
  title?: string;
  subtitle?: string;
  logoUrl?: string;
  accentColor?: string;
  onLoaded?: () => void;
  minDuration?: number;
  enabled?: boolean;
}

export const ThemePreloader: React.FC<ThemePreloaderProps> = ({
  isLoading = true,
  storeName = 'Mecca Gifts',
  storeNameAr = 'هدايا مكة',
  title,
  subtitle,
  logoUrl = MECCA_LOGO,
  accentColor = '#e6ca98',
  onLoaded,
  minDuration = 800,
  enabled = true,
}) => {
  const [visible, setVisible] = useState(enabled);
  const [fadingOut, setFadingOut] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    if (!isLoading) {
      const timer = setTimeout(() => {
        setFadingOut(true);
        setTimeout(() => {
          setVisible(false);
          onLoaded?.();
        }, 400);
      }, minDuration);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDuration, onLoaded, enabled]);

  if (!enabled || !visible) return null;

  const displayTitle = title?.trim()
    ? title
    : storeNameAr && storeNameAr !== 'Loading store…'
    ? storeNameAr
    : storeName && storeName !== 'Loading store…'
    ? storeName
    : 'هدايا مكة';

  const displaySubtitle = subtitle?.trim()
    ? subtitle
    : storeName && storeName !== 'Loading store…'
    ? `${storeName} · Luxury Flowers & Gifts`
    : 'Luxury Flowers & Gifts';

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0d1f15] transition-opacity duration-400 select-none pointer-events-auto ${
        fadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      aria-label="Loading Storefront"
      role="status"
    >
      {/* Background Soft Gold Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-[#102a1c] blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute w-48 h-48 rounded-full bg-[#d4af37]/20 blur-[80px] pointer-events-none" />

      {/* Main Animated Logo Box */}
      <div className="relative flex flex-col items-center z-10 text-center px-4">
        {/* Shimmering Rotating Ring */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#e6ca98]/40 animate-spin [animation-duration:8s]" />
          <div className="absolute inset-2 rounded-full border-2 border-t-[#d4af37] border-r-[#e6ca98] border-b-transparent border-l-transparent animate-spin [animation-duration:2s]" />

          {/* Center Logo */}
          <div className="w-20 h-20 rounded-full bg-[#102a1c] p-2 border border-[#e6ca98]/40 shadow-2xl flex items-center justify-center overflow-hidden">
            {logoUrl && !imgError ? (
              <img
                src={logoUrl}
                alt={displayTitle}
                onError={() => setImgError(true)}
                className="w-full h-full object-contain transform transition-transform hover:scale-105"
              />
            ) : (
              <Flower2 className="w-10 h-10 text-[#e6ca98] animate-bounce" />
            )}
          </div>
        </div>

        {/* Store Title */}
        <h3 className="text-xl font-bold text-[#FAF9F5] tracking-tight mb-1 flex items-center justify-center gap-2">
          <span>{displayTitle}</span>
          <Sparkles className="w-4 h-4 text-[#e6ca98] animate-pulse" />
        </h3>
        <p className="text-xs text-[#e6ca98] tracking-widest uppercase font-semibold mb-6">
          {displaySubtitle}
        </p>

        {/* Progress Bar */}
        <div className="w-48 h-1 bg-[#102a1c] rounded-full overflow-hidden border border-[#e6ca98]/20 relative">
          <div className="h-full bg-gradient-to-r from-[#d4af37] via-[#e6ca98] to-[#059669] rounded-full animate-[progress_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};
