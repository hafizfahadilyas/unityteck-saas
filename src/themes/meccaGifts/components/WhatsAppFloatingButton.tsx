import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { readStoreIdentity } from '../../settings/storeIdentity';
import { MessageCircle, ArrowUp, ArrowDown, X } from 'lucide-react';

export const WhatsAppFloatingButton: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  if (isAdmin) return null;

  const { language } = useApp();
  const isAr = language === 'ar';
  const { activeStore } = useTenant();

  const waDigits = useMemo(() => {
    if (!activeStore?.id) return '';
    const identity = readStoreIdentity(activeStore.id, activeStore);
    const raw = identity.whatsapp || activeStore.phone || '';
    return String(raw).replace(/[^0-9]/g, '');
  }, [activeStore]);

  const [showScrollControls, setShowScrollControls] = useState(false);
  const [isChatDismissed, setIsChatDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
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

  const storeLabel = activeStore
    ? (isAr ? (activeStore.nameAr || activeStore.name) : (activeStore.nameEn || activeStore.name))
    : '';

  return (
    <>
      {showScrollControls && (
        <aside
          aria-label={isAr ? 'التنقل في الصفحة' : 'Scroll Navigation'}
          className="hidden md:block fixed bottom-24 lg:bottom-8 right-6 z-40 select-none pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
        >
          <div className="flex flex-col items-center bg-[#102a1c]/95 backdrop-blur-md rounded-full p-1 border border-[#d4af37]/60 shadow-2xl text-[#f3e5ab] hover:border-[#d4af37] hover:shadow-[#102a1c]/40 transition-all">
            <button
              onClick={scrollToTop}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-[#1f4a32] active:scale-95 transition-all text-[#e6ca98] hover:text-white cursor-pointer group"
              title={isAr ? 'الصعود لأعلى الصفحة' : 'Scroll to Top'}
              aria-label={isAr ? 'الصعود لأعلى الصفحة' : 'Scroll to top'}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.3] group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <div className="w-4 h-[1px] bg-[#d4af37]/35 my-0.5" />

            <button
              onClick={scrollToBottom}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center hover:bg-[#1f4a32] active:scale-95 transition-all text-[#e6ca98] hover:text-white cursor-pointer group"
              title={isAr ? 'النزول لأسفل الصفحة' : 'Scroll to Bottom'}
              aria-label={isAr ? 'النزول لأسفل الصفحة' : 'Scroll to bottom'}
            >
              <ArrowDown className="w-4 h-4 stroke-[2.3] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </aside>
      )}

      {!isChatDismissed && waDigits.length >= 9 && (
        <aside
          aria-label={isAr ? 'محادثة واتساب' : 'WhatsApp chat'}
          className="fixed bottom-20 sm:bottom-24 lg:bottom-8 left-3.5 sm:left-6 z-40 select-none pointer-events-auto"
        >
          <div className="relative group/chat">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsChatDismissed(true);
              }}
              className="absolute -top-1 -right-1 z-50 w-4 h-4 rounded-full bg-black/90 hover:bg-red-600 text-white flex items-center justify-center shadow-md border border-white/60 transition-colors cursor-pointer"
              title={isAr ? 'إغلاق المحادثة' : 'Close chat'}
              aria-label={isAr ? 'إغلاق المحادثة' : 'Close chat button'}
            >
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>

            <a
              href={`https://wa.me/${waDigits}?text=${encodeURIComponent(
                isAr
                  ? `أهلاً بك في ${storeLabel}، أود الاستفسار عن المنتجات والتوصيل`
                  : `Hello ${storeLabel}, I would like to inquire about products and delivery`,
              )}`}
              target="_blank"
              rel="noreferrer"
              aria-label={isAr ? 'محادثة واتساب' : 'Chat on WhatsApp'}
              title={isAr ? 'محادثة واتساب' : 'WhatsApp chat'}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] hover:brightness-110 text-white flex items-center justify-center shadow-2xl hover:shadow-green-500/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 relative cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />

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
