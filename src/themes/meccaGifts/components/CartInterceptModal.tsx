import React from 'react';
import { X } from 'lucide-react';
import { CartInterceptConfig } from '../../../api/tenantApi';

interface CartInterceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CartInterceptConfig;
  language: 'ar' | 'en';
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
}

export const CartInterceptModal: React.FC<CartInterceptModalProps> = ({
  isOpen,
  onClose,
  config,
  language,
  onPrimaryAction,
  onSecondaryAction,
}) => {
  if (!isOpen || !config.enabled || config.active_modal === 'disabled') {
    return null;
  }

  const isAr = language === 'ar';
  const modalType = config.active_modal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] sm:max-w-[360px] rounded-[30px] sm:rounded-[36px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top-Right Circular Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          className="absolute top-4 end-4 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ─────────────────────────────────────────────────────────────
            MODAL TYPE 1: LOYALTY CARD (Don't Lose Your Points!)
            Image 1 Reference Matching
            ───────────────────────────────────────────────────────────── */}
        {modalType === 'loyalty' && (
          <div className="flex flex-col items-center pt-2">
            {/* Gold Star Medallion / Coin Icon matching Image 1 */}
            <div className="relative mb-5 flex items-center justify-center">
              <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldCoinRim" x1="10" y1="10" x2="66" y2="66" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFE58F" />
                    <stop offset="35%" stopColor="#D4A034" />
                    <stop offset="70%" stopColor="#F9D468" />
                    <stop offset="100%" stopColor="#9E6B15" />
                  </linearGradient>
                  <linearGradient id="goldCoinInner" x1="18" y1="18" x2="58" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFEAA7" />
                    <stop offset="50%" stopColor="#F1C40F" />
                    <stop offset="100%" stopColor="#D39E00" />
                  </linearGradient>
                  <filter id="goldGlow" x="0" y="0" width="76" height="76" filterUnits="userSpaceOnUse">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Ambient Soft Gold Glow */}
                <circle cx="38" cy="38" r="34" fill="#F1C40F" fillOpacity="0.12" />

                {/* Coin Outer Metallic Bevel */}
                <circle cx="38" cy="38" r="30" fill="url(#goldCoinRim)" />
                <circle cx="38" cy="38" r="28" fill="#F39C12" />

                {/* Coin Inner Recessed Face */}
                <circle cx="38" cy="38" r="25" fill="url(#goldCoinInner)" />
                <circle cx="38" cy="38" r="23" stroke="#ECC02A" strokeWidth="1.2" strokeDasharray="2 1.5" />

                {/* 5-Pointed Star Center Motif */}
                <path
                  d="M38 23L42.1 31.4L51.3 32.7L44.7 39.2L46.2 48.4L38 44.1L29.8 48.4L31.3 39.2L24.7 32.7L33.9 31.4L38 23Z"
                  fill="#FFF4D0"
                  stroke="#C68A0E"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />

                {/* Sparkle Twinkle Stars around coin */}
                <path d="M57 17L58.5 20L61.5 21.5L58.5 23L57 26L55.5 23L52.5 21.5L55.5 20L57 17Z" fill="#F9D468" />
                <path d="M63 26L64 28L66 29L64 30L63 32L62 30L60 29L62 28L63 26Z" fill="#FFEAA7" />
              </svg>
            </div>

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isAr ? (config.title_ar || 'لا تفوّت نقاطك الذهبية!') : (config.title_en || "Don't Lose Your Points!")}
            </h3>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2.5 max-w-[280px] leading-relaxed">
              {isAr
                ? (config.subtitle_ar || `سجّل دخولك واكسب ${config.loyalty_points || 25} نقطة على هذه السلة.`)
                : (config.subtitle_en || `Log in and earn ${config.loyalty_points || 25} points on this cart.`)}
            </p>

            {/* Vertical Stacked Buttons */}
            <div className="w-full mt-7 space-y-2.5">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'اجمع النقاط الآن' : 'Collect Points'}
              </button>

              <button
                type="button"
                onClick={onSecondaryAction}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#EBEBED] hover:bg-[#E0E0E4] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'المتابعة كزائر' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MODAL TYPE 2: GIFTS CARD (Your Gift is Ready!)
            Image 2 Reference Matching (Confetti Ribbons + Gift Box + Row Buttons)
            ───────────────────────────────────────────────────────────── */}
        {modalType === 'gift' && (
          <div className="flex flex-col items-center pt-1">
            {/* Top Confetti Streamers & Ribbons Decorative Header */}
            <div className="w-full -mt-2 -mx-2 h-14 relative overflow-hidden pointer-events-none mb-1">
              <svg width="100%" height="56" viewBox="0 0 340 56" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                {/* Pastel Confetti Ribbons Spirals */}
                <path d="M40 0C45 15 30 25 45 40C52 47 65 35 60 20" stroke="#7BA6C5" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M110 0C118 18 105 30 120 45" stroke="#E6A8A8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />
                <path d="M245 0C238 18 250 32 235 48" stroke="#DCA842" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
                <path d="M290 0C295 15 282 28 296 42" stroke="#7BA6C5" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85" />

                {/* Confetti Polka & Rectangles */}
                <circle cx="25" cy="22" r="3" fill="#DCA842" />
                <circle cx="85" cy="18" r="2.5" fill="#7BA6C5" />
                <circle cx="160" cy="12" r="3" fill="#E6A8A8" />
                <circle cx="210" cy="24" r="2.5" fill="#E2BD68" />
                <circle cx="270" cy="14" r="3" fill="#7BA6C5" />
                <circle cx="320" cy="26" r="2" fill="#E6A8A8" />

                {/* Confetti Falling Paper Streamers */}
                <rect x="58" y="28" width="6" height="3" rx="1.5" transform="rotate(25 58 28)" fill="#DCA842" />
                <rect x="135" y="20" width="7" height="3" rx="1.5" transform="rotate(-35 135 20)" fill="#7BA6C5" />
                <rect x="180" y="28" width="6" height="3" rx="1.5" transform="rotate(40 180 28)" fill="#E6A8A8" />
                <rect x="220" y="10" width="8" height="3" rx="1.5" transform="rotate(-15 220 10)" fill="#DCA842" />
                <rect x="305" y="32" width="7" height="3" rx="1.5" transform="rotate(30 305 32)" fill="#DCA842" />
              </svg>
            </div>

            {/* Gold Wrapped Gift Box Icon matching Image 2 */}
            <div className="relative mb-5 flex items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="giftGoldBase" x1="16" y1="26" x2="56" y2="62" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F7DF94" />
                    <stop offset="40%" stopColor="#D9A844" />
                    <stop offset="100%" stopColor="#A8771A" />
                  </linearGradient>
                  <linearGradient id="giftLidGold" x1="14" y1="20" x2="58" y2="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFF0B8" />
                    <stop offset="50%" stopColor="#E2B149" />
                    <stop offset="100%" stopColor="#B68322" />
                  </linearGradient>
                  <linearGradient id="giftRibbonGold" x1="32" y1="8" x2="40" y2="62" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#FFEAB3" />
                    <stop offset="100%" stopColor="#C99426" />
                  </linearGradient>
                </defs>

                {/* Gift Bow Top Ribbons */}
                <path
                  d="M36 21C31 14 22 13 22 17C22 21 31 22 36 22ZM36 21C41 14 50 13 50 17C50 21 41 22 36 22Z"
                  fill="none"
                  stroke="url(#giftRibbonGold)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="36" cy="22" r="3" fill="#D9A844" stroke="#FFF" strokeWidth="1" />

                {/* Gift Box Lid */}
                <rect x="14" y="24" width="44" height="9" rx="2.5" fill="url(#giftLidGold)" stroke="#8F620D" strokeWidth="0.8" />

                {/* Gift Box Body */}
                <rect x="17" y="33" width="38" height="28" rx="2" fill="url(#giftGoldBase)" stroke="#8F620D" strokeWidth="0.8" />

                {/* Vertical Ribbon Wrap */}
                <rect x="33" y="24" width="6" height="37" fill="url(#giftRibbonGold)" />
                <line x1="33" y1="24" x2="33" y2="61" stroke="#8F620D" strokeWidth="0.5" />
                <line x1="39" y1="24" x2="39" y2="61" stroke="#8F620D" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isAr ? (config.gift_title_ar || 'هديتك بانتظارك!') : (config.gift_title_en || 'Your Gift is Ready!')}
            </h3>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2.5 max-w-[290px] leading-relaxed">
              {isAr
                ? (config.gift_subtitle_ar || `سجّل دخولك الآن واحصل على خصم ${config.discount_percent || 10}% يطبق تلقائياً على سلتك.`)
                : (config.gift_subtitle_en || `Log in now and get ${config.discount_percent || 10}% OFF automatically applied to your cart.`)}
            </p>

            {/* Side-by-Side Pill Action Buttons matching Image 2 */}
            <div className="w-full mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={onSecondaryAction}
                className="flex-1 py-3 px-4 rounded-full bg-[#E5E5EA] hover:bg-[#D8D8DE] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'لاحقاً' : 'Later'}
              </button>

              <button
                type="button"
                onClick={onPrimaryAction}
                className="flex-1 py-3 px-4 rounded-full bg-[#0F172A] hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'احصل على الكود' : 'Get My Code'}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            MODAL TYPE 3: SAVE CART (Save Your Cart?)
            Image 3 Reference Matching (Gold Cart + Cloud Download + Stacked Buttons)
            ───────────────────────────────────────────────────────────── */}
        {modalType === 'save_cart' && (
          <div className="flex flex-col items-center pt-2">
            {/* Gold Shopping Cart + Cloud Download Icon matching Image 3 */}
            <div className="relative mb-5 flex items-center justify-center gap-2">
              <svg width="100" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldLineGrad" x1="0" y1="0" x2="100" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#F5D061" />
                    <stop offset="50%" stopColor="#D4A034" />
                    <stop offset="100%" stopColor="#A77418" />
                  </linearGradient>
                </defs>

                {/* Shopping Cart Left Side */}
                <g transform="translate(6, 6)">
                  {/* Cart Handle & Basket */}
                  <path
                    d="M2 4H9L16 28H37L42 12H13"
                    stroke="url(#goldLineGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Cart Wheels */}
                  <circle cx="18" cy="35" r="3" fill="#D4A034" />
                  <circle cx="35" cy="35" r="3" fill="#D4A034" />
                </g>

                {/* Cloud Download Right Side */}
                <g transform="translate(50, 4)">
                  {/* Cloud Silhouette */}
                  <path
                    d="M12 28C7 28 3 24 3 19C3 14.5 6.5 11 11 10.5C13 5 18 2 24 2C31 2 36 6.5 37.5 12C41.5 12.5 45 15.5 45 20C45 24.5 41 28 36 28"
                    stroke="url(#goldLineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Down Arrow inside Cloud */}
                  <path
                    d="M24 16V34M24 34L18 27M24 34L30 27"
                    stroke="url(#goldLineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              </svg>
            </div>

            {/* Headline */}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {isAr ? (config.save_cart_title_ar || 'هل ترغب بحفظ سلتك؟') : (config.save_cart_title_en || 'Save Your Cart?')}
            </h3>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-2.5 max-w-[290px] leading-relaxed">
              {isAr
                ? (config.save_cart_subtitle_ar || 'كزائر، قد تفقد سلتك عند إغلاق المتصفح. سجّل دخولك وسنحفظها لك عبر جميع أجهزتك.')
                : (config.save_cart_subtitle_en || "As a guest, your cart might be lost. Log in and we'll save it for you across any device.")}
            </p>

            {/* Vertical Stacked Buttons */}
            <div className="w-full mt-7 space-y-2.5">
              <button
                type="button"
                onClick={onPrimaryAction}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#0F172A] hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-bold shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'حفظ سلة مشترياتي' : 'Save My Cart'}
              </button>

              <button
                type="button"
                onClick={onSecondaryAction}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#EBEBED] hover:bg-[#E0E0E4] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium active:scale-98 transition-all cursor-pointer"
              >
                {isAr ? 'المتابعة كزائر' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
