import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { useStorefrontCategories } from '../../../hooks/useStorefrontCategories';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE, handleImageError } from '../../../utils/imageFallback';

export const MainCategoriesSlider: React.FC = () => {
  const { language, navigateToCategory } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);
  const { circles } = useStorefrontCategories(activeStore?.id, currentProducts || [], {
    isAr,
    includeAll: false,
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: isAr ? -offset : offset, behavior: 'smooth' });
    }
  };

  if (circles.length === 0) {
    return (
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-sm text-[#7a7164] text-center">
          {isAr ? 'لا توجد تصنيفات بعد' : 'No categories yet'}
        </p>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#102a1c]" />
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'تصنيفات المتجر' : 'Store Collections'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
            {isAr
              ? 'تصفح تصنيفات هذا المتجر من لوحة التحكم'
              : 'Browse this store’s categories from the dashboard'}
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label={isAr ? 'التالي' : 'Scroll next'}
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label={isAr ? 'السابق' : 'Scroll previous'}
          >
            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        {circles.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateToCategory(cat.nameEn)}
            className="group flex flex-col items-center text-center shrink-0 w-28 sm:w-36 cursor-pointer"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border border-[#e8e4dc] p-3 shadow-sm group-hover:shadow-xl group-hover:border-[#102a1c] group-hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#102a1c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={cat.image || FALLBACK_PRODUCT_IMAGE}
                alt={isAr ? cat.nameAr : cat.nameEn}
                onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#1a1f1b] mt-3 group-hover:text-[#102a1c] transition-colors leading-tight line-clamp-2">
              {isAr ? cat.nameAr : cat.nameEn}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};
