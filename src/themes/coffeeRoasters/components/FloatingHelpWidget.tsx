import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Headphones, Phone, Mail, MessageCircle, X, ShoppingBag, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { coffeeWhatsAppDigits } from '../../settings/coffeeModularSettings';

export const FloatingHelpWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { cartCount, setIsMiniCartOpen, isMiniCartOpen, language, currentRoute, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const widgetRef = useRef<HTMLDivElement>(null);
  const isAr = language === 'AR';

  const contacts = useMemo(() => {
    const coffee = activeStore?.id
      ? resolveCoffeeThemeSettings(activeStore.id, activeStore)
      : null;
    const headerWa = coffee?.header?.actions?.whatsapp?.phoneNumber;
    const footerPhone = coffee?.footer?.contactPhone;
    const footerEmail = coffee?.footer?.contactEmail;
    const phoneRaw =
      storeIdentity?.phone ||
      footerPhone ||
      headerWa ||
      (activeStore as { whatsapp?: string; phone?: string } | undefined)?.whatsapp ||
      (activeStore as { phone?: string } | undefined)?.phone ||
      '';
    const phoneDigits = coffeeWhatsAppDigits(phoneRaw);
    const email = String(
      storeIdentity?.email ||
        footerEmail ||
        (activeStore as { email?: string; ownerEmail?: string } | undefined)?.email ||
        (activeStore as { ownerEmail?: string } | undefined)?.ownerEmail ||
        '',
    ).trim();
    const hours =
      (isAr ? coffee?.footer?.hoursAr : coffee?.footer?.hoursEn)?.trim() ||
      (isAr ? 'الأحد – السبت: 9:00–21:00' : 'Sunday – Saturday: 9:00–21:00');
    return {
      phoneDigits,
      phoneDisplay: phoneRaw || phoneDigits,
      email,
      hours,
    };
  }, [activeStore, isAr, storeIdentity]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 250);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isLearnMorePage = currentRoute === 'product-detail';
  const hasAnyContact = Boolean(contacts.phoneDigits || contacts.email);

  if (isMiniCartOpen) return null;

  return (
    <aside
      aria-label={isAr ? 'دعم العملاء' : 'Customer Support Dock'}
      ref={widgetRef}
      dir="ltr"
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 select-none"
    >
      {isOpen && hasAnyContact && (
        <div
          role="region"
          aria-label={isAr ? 'تفاصيل خدمة العملاء' : 'Customer Care Details'}
          className="relative bg-white text-neutral-900 rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-neutral-100 p-5 w-[280px] sm:w-[300px] mb-2 animate-fadeIn transition-all duration-300"
        >
          <button
            onClick={() => setIsOpen(false)}
            aria-label={isAr ? 'إغلاق' : 'Close Support Details'}
            className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-black p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-4 pt-1">
            {contacts.phoneDigits ? (
              <a
                href={`tel:${contacts.phoneDigits}`}
                className="flex items-start gap-3.5 group hover:bg-neutral-50 p-2 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-semibold text-neutral-500">
                    {isAr ? 'الرقم المجاني' : 'Hotline'}
                  </div>
                  <div className="text-sm font-bold text-neutral-900 tracking-wide">
                    {contacts.phoneDisplay}
                  </div>
                </div>
              </a>
            ) : null}

            {contacts.email ? (
              <a
                href={`mailto:${contacts.email}`}
                className="flex items-start gap-3.5 group hover:bg-neutral-50 p-2 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-semibold text-neutral-500">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </div>
                  <div className="text-xs font-bold text-neutral-900 break-all">{contacts.email}</div>
                </div>
              </a>
            ) : null}

            {contacts.hours ? (
              <div className="flex items-start gap-3.5 p-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800 shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-semibold text-neutral-900">
                    {isAr ? 'ساعات الدعم' : 'Support hours'}
                  </div>
                  <div className="text-[11px] font-medium text-neutral-500 mt-0.5">{contacts.hours}</div>
                </div>
              </div>
            ) : null}

            {contacts.phoneDigits ? (
              <a
                href={`https://wa.me/${contacts.phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 group hover:bg-emerald-50 p-2 rounded-xl transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="text-start">
                  <div className="text-xs font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    {isAr ? 'واتساب' : 'WhatsApp'}
                  </div>
                </div>
              </a>
            ) : null}
          </div>

          <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white rotate-45 border-r border-b border-neutral-100"></div>
        </div>
      )}

      {isLearnMorePage ? (
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex flex-col items-center gap-2.5 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-[0_6px_25px_rgba(0,0,0,0.14)] border border-neutral-200">
            <button
              onClick={() => setIsMiniCartOpen(true)}
              aria-label={isAr ? 'حقيبة التسوق' : 'View Shopping Bag'}
              className="relative w-11 h-11 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
              title={isAr ? 'حقيبة التسوق' : 'Shopping Bag'}
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-black text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {hasAnyContact ? (
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isAr ? 'خدمة العملاء' : 'Customer Support and Assistance'}
                aria-expanded={isOpen}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isOpen ? 'bg-black text-white' : 'bg-white hover:bg-neutral-100 text-neutral-900'
                }`}
                title={isAr ? 'خدمة العملاء' : 'Customer Support'}
              >
                <Headphones className="w-5 h-5 stroke-[1.8]" />
              </button>
            ) : null}
          </div>

          <div
            className={`transition-all duration-300 ease-out transform ${
              showScrollTop
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                : 'opacity-0 translate-y-4 scale-75 pointer-events-none h-0 overflow-hidden'
            }`}
          >
            <button
              onClick={scrollToTop}
              aria-label={isAr ? 'العودة للأعلى' : 'Scroll to top'}
              className="w-11 h-11 rounded-full bg-white text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title={isAr ? 'العودة للأعلى' : 'Back to top'}
            >
              <ChevronUp className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5">
          {hasAnyContact ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isAr ? 'خدمة العملاء' : 'Customer Support and Assistance'}
              aria-expanded={isOpen}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 transition-all duration-300 hover:scale-105 active:scale-95 ${
                isOpen ? 'bg-black text-white' : 'bg-white hover:bg-neutral-50 text-neutral-900'
              }`}
              title={isAr ? 'خدمة العملاء' : 'Customer Support'}
            >
              <Headphones className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.8]" />
            </button>
          ) : null}

          <div
            className={`transition-all duration-300 ease-out transform ${
              showScrollTop
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto h-auto'
                : 'opacity-0 translate-y-4 scale-75 pointer-events-none h-0 overflow-hidden'
            }`}
          >
            <button
              onClick={scrollToTop}
              aria-label={isAr ? 'العودة للأعلى' : 'Scroll to top'}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-neutral-200/80 flex items-center justify-center hover:bg-neutral-50 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              title={isAr ? 'العودة للأعلى' : 'Back to top'}
            >
              <ChevronUp className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2]" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
