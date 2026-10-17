import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Phone, Mail, MessageCircle, X, ShoppingBag, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const FloatingHelpWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { cartCount, setIsMiniCartOpen, language, currentRoute } = useCart();
  const widgetRef = useRef<HTMLDivElement>(null);

  // Monitor scroll position: only show bottom scroll-to-top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && e.target instanceof Node && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart icon is shown ONLY on the Learn More page (product-detail)
  const isLearnMorePage = currentRoute === 'product-detail';

  return (
    <aside
      aria-label="Customer Support Dock"
      ref={widgetRef}
      dir="ltr"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none"
    >
      {/* Honor Help Card Popup (matches Screenshot 1) */}
      {isOpen && (
        <div
          role="region"
          aria-label="Customer Care Details"
          className="relative bg-white text-neutral-900 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-neutral-100 p-5 w-[280px] sm:w-[300px] mb-2 animate-fadeIn transition-all duration-300"
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close Support Details"
            className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4 pt-1">
            {/* Hotline */}
            <a
              href="tel:8008440443"
              className="flex items-start gap-3.5 group hover:bg-neutral-50 p-2 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-start">
                <div className="text-xs font-semibold text-neutral-500">
                  {language === 'AR' ? 'الرقم المجاني' : 'Hotline'}
                </div>
                <div className="text-sm font-bold text-neutral-900 tracking-wide">
                  8008440443
                </div>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:sa.support@hibrew.com"
              className="flex items-start gap-3.5 group hover:bg-neutral-50 p-2 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-start">
                <div className="text-xs font-semibold text-neutral-500">
                  {language === 'AR' ? 'البريد الإلكتروني' : 'Email'}
                </div>
                <div className="text-xs font-bold text-neutral-900 break-all">
                  sa.support@hibrew.com
                </div>
              </div>
            </a>

            {/* Live Chat */}
            <div className="flex items-start gap-3.5 p-2 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="text-start">
                <div className="text-xs font-semibold text-neutral-900">
                  {language === 'AR' ? 'المحادثة المباشرة' : 'Live Chat'}
                </div>
                <div className="text-[11px] font-medium text-neutral-500 mt-0.5">
                  {language === 'AR' ? 'الأحد – السبت: 9:00–21:00' : 'Sunday – Saturday: 9:00–21:00'}
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <a
              href="https://wa.me/9668008440443"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 group hover:bg-emerald-50 p-2 rounded-xl transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-start">
                <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                  {language === 'AR' ? 'واتساب' : 'WhatsApp'}
                </div>
              </div>
            </a>
          </div>

          {/* Little triangle arrow at bottom pointing to the headphone button */}
          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white rotate-45 border-r border-b border-neutral-100"></div>
        </div>
      )}

      {/* Conditional Floating Dock:
          1. Learn More Page: Cart Icon + Headphone Support Icon in a Pill (Screenshot 1)
          2. Home / Standard Pages: Headphone Support Icon + Scroll-to-Top Icon as separate circles (Screenshot 2)
      */}
      {isLearnMorePage ? (
        /* Learn More Page Vertical Dock: Shopping Bag + Headphone (Screenshot 1) */
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex flex-col items-center gap-2.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-[0_6px_25px_rgba(0,0,0,0.14)] border border-neutral-200">
            {/* Quick Mini Cart button */}
            <button
              onClick={() => setIsMiniCartOpen(true)}
              aria-label="View Shopping Bag"
              className="relative w-11 h-11 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              title={language === 'AR' ? 'حقيبة التسوق' : 'Shopping Bag'}
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Headphone Support button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Customer Support and Assistance"
              aria-expanded={isOpen}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                isOpen ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100 text-neutral-900'
              }`}
              title={language === 'AR' ? 'خدمة العملاء' : 'Customer Support'}
            >
              <Headphones className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Scroll to Top button (Bottom) - Only shows when user scrolls down */}
          <div
            className={`transition-all duration-300 ease-out transform ${
              showScrollTop
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                : 'opacity-0 translate-y-4 scale-75 pointer-events-none h-0 overflow-hidden'
            }`}
          >
            <button
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="w-11 h-11 rounded-full bg-white text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title={language === 'AR' ? 'العودة للأعلى' : 'Back to top'}
            >
              <ChevronUp className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>
      ) : (
        /* Home & Other Pages: Support (Headphone) on Top + Scroll-to-Top (ChevronUp) on Bottom (Screenshot 2) */
        <div className="flex flex-col items-center gap-2.5">
          {/* Headphone Support button (Top) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Customer Support and Assistance"
            aria-expanded={isOpen}
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 transition-all duration-300 hover:scale-105 active:scale-95 ${
              isOpen ? 'bg-black text-white' : 'bg-white hover:bg-neutral-50 text-neutral-900'
            }`}
            title={language === 'AR' ? 'خدمة العملاء' : 'Customer Support'}
          >
            <Headphones className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
          </button>

          {/* Scroll to Top button (Bottom) - Only shows when user scrolls down */}
          <div
            className={`transition-all duration-300 ease-out transform ${
              showScrollTop
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                : 'opacity-0 translate-y-4 scale-75 pointer-events-none h-0 overflow-hidden'
            }`}
          >
            <button
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title={language === 'AR' ? 'العودة للأعلى' : 'Back to top'}
            >
              <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
