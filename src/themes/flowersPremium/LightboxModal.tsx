import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MessageCircle, ExternalLink } from 'lucide-react';
import { whatsappOrderHref } from './WhatsAppChatFab';

export interface LightboxImageItem {
  id?: string;
  image: string;
  title: string;
  subtitle?: string;
  price?: number;
}

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LightboxImageItem[];
  initialIndex?: number;
  lang: string;
  money?: (amount: number) => string;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  lang,
  money,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, currentIndex]);

  if (!isOpen || !items.length) return null;

  const currentItem = items[currentIndex] || items[0];
  const isAr = lang === 'ar';

  const handleNext = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const whatsappMessageLines = [
    isAr ? 'السلام عليكم ورحمة الله،' : 'Hello,',
    isAr
      ? `أرغب بالاستفسار والطلب بخصوص: *${currentItem.title}*`
      : `I would like to inquire/order: *${currentItem.title}*`,
    currentItem.price && money ? `${isAr ? 'السعر' : 'Price'}: ${money(currentItem.price)}` : '',
    isAr ? 'التوصيل: مكة المكرمة' : 'Delivery: Makkah KSA',
  ].filter(Boolean);

  const whatsappHref = whatsappOrderHref(lang, whatsappMessageLines);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header / Actions */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-mono font-bold">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="text-xs font-extrabold text-white/90 drop-shadow-md truncate max-w-xs sm:max-w-md">
            {currentItem.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsZoomed((z) => !z)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div className="relative max-w-5xl max-h-[75vh] w-full flex items-center justify-center overflow-hidden">
        <img
          src={currentItem.image}
          alt={currentItem.title}
          className={`max-h-[72vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed((z) => !z)}
        />
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-lg z-10"
            title="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-lg z-10"
            title="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Bottom Footer Info & WhatsApp Order Action */}
      <div className="absolute bottom-4 inset-x-4 max-w-3xl mx-auto bg-slate-900/85 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white z-10 shadow-2xl">
        <div className="space-y-0.5 text-center sm:text-start min-w-0">
          <h4 className="text-sm font-black truncate">{currentItem.title}</h4>
          {currentItem.subtitle && (
            <p className="text-xs text-slate-300 truncate">{currentItem.subtitle}</p>
          )}
          {currentItem.price && money && (
            <div className="text-sm font-black text-amber-300">
              {money(currentItem.price)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-105 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>{isAr ? 'اطلب هذا المنتج عبر واتساب' : 'Order via WhatsApp'}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
