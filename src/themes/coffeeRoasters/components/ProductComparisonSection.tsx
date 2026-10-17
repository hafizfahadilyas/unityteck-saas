import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { Product } from '../types';

// Fallback HiBrew Comparison Infographic Asset
import specInfographicImg from '../assets/images/hibrew_specs_comparison_infographic.png';

// Retained interfaces for backwards-compatibility
export interface ComparisonModel {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  badgeAr?: string;
  isCurrent?: boolean;
}

export interface ComparisonSpecRow {
  id: string;
  categoryEn: string;
  categoryAr: string;
  labelEn: string;
  labelAr: string;
  iconName?: string;
  values: Record<
    string,
    {
      textEn: string;
      textAr: string;
      hasCheck?: boolean;
      hasCross?: boolean;
      highlight?: boolean;
    }
  >;
}

export interface ComparisonDataset {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  badgeEn: string;
  badgeAr: string;
  models: ComparisonModel[];
  specs: ComparisonSpecRow[];
}

export type ThemePalette = 'espresso' | 'cyber' | 'onyx' | 'alabaster';

interface ProductComparisonSectionProps {
  currentProduct: Product;
  language: 'EN' | 'AR';
  onNavigateToProduct?: (productId: string) => void;
  customSpecImgUrl?: string;
  isAdmin?: boolean;
}

export const ProductComparisonSection: React.FC<ProductComparisonSectionProps> = ({
  currentProduct,
  language,
  onNavigateToProduct,
  customSpecImgUrl
}) => {
  const isAr = language === 'AR';

  // Lightbox / Zoom modal state
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Compute comparison image strictly from Database / API Product entity
  const primaryImgUrl = useMemo(() => {
    if (imageError) {
      return specInfographicImg;
    }
    // 1. If Arabic translation image is supplied from DB/API
    if (isAr && currentProduct.specComparisonImageAr && currentProduct.specComparisonImageAr.trim()) {
      return currentProduct.specComparisonImageAr;
    }
    // 2. Direct comparison image URL from DB / API
    if (currentProduct.specComparisonImage && currentProduct.specComparisonImage.trim()) {
      return currentProduct.specComparisonImage;
    }
    // 3. customSpecImgUrl passed from parent product entity
    if (customSpecImgUrl && customSpecImgUrl.trim() !== '') {
      return customSpecImgUrl;
    }
    // 4. Default official infographic fallback asset
    return specInfographicImg;
  }, [currentProduct.specComparisonImage, currentProduct.specComparisonImageAr, customSpecImgUrl, isAr, imageError]);

  return (
    <section
      id="specs-comparison-section"
      className="mt-16 sm:mt-24 space-y-6 sm:space-y-8 scroll-mt-28"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-3 px-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full bg-[#8B5A2B]/10 text-[#8B5A2B] border border-[#8B5A2B]/20">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {isAr ? 'المواصفات الفنية المعتمدة الرسمية' : 'OFFICIAL TECHNICAL SPECIFICATIONS'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="text-xs font-semibold text-neutral-500">
            {isAr ? 'مخطط مقارنة الموديلات' : 'Certified Model Comparison'}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
          {isAr ? 'المواصفات ومقارنة الموديلات الرسمية' : 'Specifications & Model Comparison'}
        </h2>

        <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? `مخطط مقارنة شامل ومعتمد يوضح الفروقات الهندسية والمواصفات الدقيقة لـ ${currentProduct.nameAr || currentProduct.name} بالمقارنة مع موديلات الفئة الرسمية.`
            : `Comprehensive certified comparison chart comparing engineering specifications and architecture of ${currentProduct.name} across companion models in the certified official lineup.`}
        </p>
      </div>

      {/* 2. ONLY COMPARISON IMAGE DISPLAY (Clean, High-Res Card) */}
      <div className="w-full bg-gradient-to-b from-white to-neutral-50/60 border border-neutral-200/90 rounded-[28px] sm:rounded-[36px] p-3 sm:p-6 lg:p-8 shadow-lg shadow-neutral-200/40 flex flex-col items-center transition-all">
        
        {/* Top Control Bar: Title & Fullscreen Lightbox Button */}
        <div className="w-full flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-200/70 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 font-medium">
            <ImageIcon className="w-4 h-4 text-[#8B5A2B]" />
            <span className="font-bold text-neutral-800">
              {isAr ? 'صورة المقارنة الفنية الرسمية' : 'Official Comparison Infographic'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsZoomOpen(true);
                setZoomLevel(1);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B5A2B] hover:bg-[#724820] text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'تكبير المخطط' : 'Full Screen'}</span>
            </button>
          </div>
        </div>

        {/* Main Comparison Image Container */}
        <div 
          onClick={() => {
            setIsZoomOpen(true);
            setZoomLevel(1);
          }}
          className="relative w-full mt-4 rounded-2xl overflow-hidden bg-white border border-neutral-200/80 p-2 sm:p-5 flex items-center justify-center cursor-zoom-in group transition-all hover:border-[#8B5A2B]/40 hover:shadow-md"
        >
          <img
            src={primaryImgUrl}
            alt={isAr ? `${currentProduct.nameAr || currentProduct.name} - مخطط المقارنة الفنية المعتمد` : `${currentProduct.name} Hardware Comparison Specifications Chart`}
            className="w-full max-w-[1140px] h-auto object-contain select-none transition-transform duration-300 group-hover:scale-[1.01]"
            onError={() => setImageError(true)}
          />

          {/* Hover Overlay Hint */}
          <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{isAr ? 'انقر لتكبير صورة المقارنة' : 'Click to inspect in high resolution'}</span>
          </div>
        </div>

        {/* Bottom Certification Badge */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 px-3 pt-5 border-t border-neutral-200/70 mt-6 gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-neutral-800">
              {isAr
                ? 'مخطط مقارنة المواصفات الفنية المعتمد من هايبرو السعودية'
                : 'HiBrew Certified Technical Comparison Blueprint'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            {isAr
              ? 'مختبرات فحص معتمدة · تحديث مستمر ومطابقة للمواصفات الرسمية'
              : 'ISO-9001 Certified Lab Verified · Official KSA Lineup'}
          </div>
        </div>
      </div>

      {/* 3. LIGHTBOX FULLSCREEN ZOOM MODAL */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top Modal Bar */}
          <div className="w-full max-w-6xl flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold truncate">
                {isAr ? `${currentProduct.nameAr || currentProduct.name} - مخطط المقارنة الفنية` : `${currentProduct.name} - Technical Comparison Chart`}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isAr ? 'تصغير' : 'Zoom Out'}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-neutral-300 min-w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.min(2.5, z + 0.25))}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isAr ? 'تكبير' : 'Zoom In'}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer ml-2"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Image Display with Interactive Zoom */}
          <div className="flex-1 w-full max-w-6xl flex items-center justify-center overflow-auto p-2 my-auto no-scrollbar">
            <img
              src={primaryImgUrl}
              alt={currentProduct.name}
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              className="max-h-[82vh] max-w-full object-contain transition-transform duration-200 select-none rounded-xl"
            />
          </div>

          {/* Modal Bottom Bar */}
          <div className="w-full max-w-6xl text-center text-xs text-neutral-400 pt-2 border-t border-white/10">
            {isAr
              ? 'انقر على مفاتيح التكبير أعلاه أو اسحب للفحص عالي الدقة · اضغط ✕ للإغلاق'
              : 'Use zoom controls above or pinch/scroll to inspect details in high resolution · Press ✕ to close'}
          </div>
        </div>
      )}
    </section>
  );
};
