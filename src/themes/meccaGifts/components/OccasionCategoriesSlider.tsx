import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { OCCASIONS_CATEGORIES } from '../data/mockData';
import { ChevronRight, ChevronLeft, Gift } from 'lucide-react';

export const OccasionCategoriesSlider: React.FC = () => {
  const { language, navigateToCategory } = useApp();
  const isAr = language === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: isAr ? -offset : offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#e8e4dc]">
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#102a1c]" />
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'تصنيفات حسب المناسبات' : 'Categories by Occasion'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
            {isAr ? 'اختر مناسبتك الخاصة ودعنا نوصل مشاعرك بأفخم طريقة' : 'Select your celebratory milestone and let us deliver your affection in style'}
          </p>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label="Scroll next"
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label="Scroll previous"
          >
            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Occasion badges carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        {OCCASIONS_CATEGORIES.map((occ) => (
          <div
            key={occ.id}
            onClick={() => navigateToCategory(occ.name)}
            className="group flex flex-col items-center text-center shrink-0 w-28 sm:w-32 cursor-pointer"
          >
            {/* Hexagonal/Circular Occasion Tile */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white border-2 border-[#e8e4dc] p-3 shadow-sm group-hover:shadow-xl group-hover:border-[#102a1c] group-hover:scale-108 transition-all duration-300 flex items-center justify-center relative overflow-hidden">
              <img
                src={occ.image}
                alt={isAr ? occ.name : occ.nameEn}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#1a1f1b] mt-3 group-hover:text-[#102a1c] transition-colors leading-tight line-clamp-2">
              {isAr ? occ.name : occ.nameEn}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
};
