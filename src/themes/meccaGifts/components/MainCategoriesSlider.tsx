import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MAIN_CATEGORIES } from '../data/mockData';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export const MainCategoriesSlider: React.FC = () => {
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
    <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title & Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#102a1c]" />
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
              {isAr ? 'تصنيفات المتجر' : 'Store Collections'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
            {isAr ? 'اختر نوع الهدية والزهور المفضلة لتصفح أحدث التنسيقات' : 'Select your desired floral and gourmet gift categories'}
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

      {/* Categories Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        {MAIN_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateToCategory(cat.name)}
            className="group flex flex-col items-center text-center shrink-0 w-28 sm:w-36 cursor-pointer"
          >
            {/* Hexagonal/Rounded Icon Box */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border border-[#e8e4dc] p-3 shadow-sm group-hover:shadow-xl group-hover:border-[#102a1c] group-hover:-translate-y-1.5 transition-all duration-300 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#102a1c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <img
                src={cat.image}
                alt={isAr ? cat.name : cat.nameEn}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Label */}
            <h3 className="text-xs sm:text-sm font-bold text-[#1a1f1b] mt-3 group-hover:text-[#102a1c] transition-colors leading-tight line-clamp-2">
              {isAr ? cat.name : cat.nameEn}
            </h3>
            <span className="text-[10px] text-[#8c8275] mt-0.5">
              {cat.count} {isAr ? 'تصميم' : 'edits'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
