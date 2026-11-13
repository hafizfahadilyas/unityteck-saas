import React, { useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { useStorefrontCategories } from '../../../hooks/useStorefrontCategories';
import { ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE, handleImageError } from '../../../utils/imageFallback';

export const OccasionCategoriesSlider: React.FC = () => {
  const { language, navigateToCategory } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);
  const { rows, circles, childrenOf, findByName } = useStorefrontCategories(
    activeStore?.id,
    currentProducts || [],
    { isAr, includeAll: false },
  );

  const occasionCats = useMemo(() => {
    const parent =
      findByName('Occasions') ||
      findByName('المناسبات') ||
      rows.find((r) => /occasion|مناسب/i.test(String(r.name || '') + String(r.name_ar || '')));
    if (parent) {
      const kids = childrenOf(parent.id);
      if (kids.length > 0) {
        return kids.map((k) => ({
          id: k.id,
          name: String(k.name || ''),
          nameAr: String(k.name_ar || k.name || ''),
          image: String(k.image_url || FALLBACK_PRODUCT_IMAGE),
        }));
      }
    }
    return circles.slice(0, 12).map((c) => ({
      id: c.id,
      name: c.nameEn,
      nameAr: c.nameAr,
      image: c.image || FALLBACK_PRODUCT_IMAGE,
    }));
  }, [rows, circles, childrenOf, findByName]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: isAr ? -offset : offset, behavior: 'smooth' });
    }
  };

  if (occasionCats.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#e8e4dc]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#102a1c]" />
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'تصنيفات حسب المناسبات' : 'Categories by Occasion'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
            {isAr
              ? 'تصنيفات هذا المتجر من لوحة التحكم'
              : 'This store’s categories from the dashboard'}
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
        {occasionCats.map((occ) => (
          <div
            key={occ.id}
            onClick={() => navigateToCategory(occ.name)}
            className="group flex flex-col items-center text-center shrink-0 w-28 sm:w-36 cursor-pointer"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border border-[#e8e4dc] p-2 shadow-sm group-hover:shadow-xl group-hover:border-[#102a1c] group-hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center overflow-hidden">
              <img
                src={occ.image}
                alt={isAr ? occ.nameAr : occ.name}
                onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-[#1a1f1b] mt-3 group-hover:text-[#102a1c] transition-colors leading-tight line-clamp-2">
              {isAr ? occ.nameAr : occ.name}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};
