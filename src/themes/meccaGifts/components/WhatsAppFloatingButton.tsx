import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, ArrowUp, ArrowDown, X } from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';

export const WhatsAppFloatingButton: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  if (isAdmin) return null;

  const { language } = useApp();
  const isAr = language === 'ar';

  const [showScrollControls, setShowScrollControls] = useState(false);
  const [isChatDismissed, setIsChatDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // ONLY show the up/down scroll button when user scrolls past 280px
      if (window.scrollY > 280) {
        setShowScrollControls(true);
      } else {
        setShowScrollControls(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. SCROLL UP / DOWN BUTTON: Positioned on the RIGHT side on desktop, hidden on mobile */}
      {showScrollControls && (
        <aside
          aria-label="Scroll Navigation"
          className="hidden md:block fixed bottom-24 lg:bottom-8 right-6 z-40 select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex flex-col items-center bg-[#102a1c]/95 backdrop-blur-md rounded-full p-1 border border-[#d4af37]/60 shadow-2xl text-[#f3e5ab] hover:border-[#d4af37] hover:shadow-[#102a1c]/40 transition-all">
            {/* Scroll To Top */}
            <button
              onClick={scrollToTop}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-[#1f4a32] active:scale-95 transition-all text-[#e6ca98] hover:text-white cursor-pointer group"
              title={isAr ? 'الصعود لأعلى الصفحة' : 'Scroll to Top'}
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.3] group-hover:-translate-y-0.5 transition-transform" />
            </button>

            {/* Subtle Divider */}
            <div className="w-4 h-[1px] bg-[#d4af37]/35 my-0.5" />

            {/* Scroll To Bottom */}
            <button
              onClick={scrollToBottom}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-[#1f4a32] active:scale-95 transition-all text-[#e6ca98] hover:text-white cursor-pointer group"
              title={isAr ? 'النزول لأسفل الصفحة' : 'Scroll to Bottom'}
              aria-label="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4 stroke-[2.3] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. LIVE FLORIST CHAT BUTTON: Positioned on the OTHER (LEFT) SIDE, completely separated (Zero Overlap!) */}
      {!isChatDismissed && (
        <aside
          aria-label="Florist Live Chat"
          className="fixed bottom-20 sm:bottom-24 lg:bottom-8 left-3.5 sm:left-6 z-40 select-none pointer-events-auto"
        >
          <div className="relative group/chat">
            {/* Close / Dismiss Icon (X) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsChatDismissed(true);
              }}
              className="absolute -top-1 -right-1 z-50 w-4 h-4 rounded-full bg-black/90 hover:bg-red-600 text-white flex items-center justify-center shadow-md border border-white/60 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق المحادثة' : 'Close chat'}
              aria-label="Close chat button"
            >
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>

            {/* WhatsApp Trigger Button */}
            <a
              href={`https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(
                isAr
                  ? 'أهلاً بك في متجر هدايا مكة، أود الاستفسار عن باقات الزهور والتوصيل الفوري'
                  : 'Hello Hadaya Mecca, I would like to inquire about fresh flowers and express delivery'
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Chat with Florist Concierge on WhatsApp"
              title={isAr ? 'محادثة المنسق المباشرة (واتساب)' : 'Live Florist Concierge (WhatsApp)'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] hover:brightness-110 text-white flex items-center justify-center shadow-2xl hover:shadow-green-500/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 relative cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />

              {/* Online Indicator Pulse Dot */}
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center shadow-xs">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              </span>
            </a>
          </div>
        </aside>
      )}
    </>
  );
};
