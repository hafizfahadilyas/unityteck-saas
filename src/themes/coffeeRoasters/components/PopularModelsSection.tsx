import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { HonorProductCard } from './HonorProductCard';
import { Sparkles, Tag, ArrowRight, ArrowLeft } from 'lucide-react';

export const PopularModelsSection: React.FC = () => {
  const { navigateTo, language, products } = useCart();
  const isAr = language === 'AR';

  // Category filter for the popular models
  const [activeTab, setActiveTab] = useState<'all' | 'machines' | 'mills' | 'cabinets' | 'accessories'>('all');

  const storeProducts = products && products.length > 0 ? products : PRODUCTS;

  // Curated popular models
  const filteredList = storeProducts.filter((p) => {
    if (activeTab === 'all') return true;
    const pid = String(p.id || '').toLowerCase();
    const pcat = String(p.category || '').toLowerCase();
    const pname = String(p.name || '').toLowerCase();
    const ptags = ((p as any).tags || []).map((t: any) => String(t).toLowerCase());
    const pbadge = String((p as any).badge || '').toLowerCase();

    if (activeTab === 'machines') {
      return (
        pid.includes('h10') ||
        pid.includes('barista') ||
        pid.includes('espresso') ||
        pcat.includes('machine') ||
        pcat.includes('مكائن') ||
        pname.includes('machine') ||
        ptags.includes('machines')
      );
    }
    if (activeTab === 'mills') {
      return (
        pid.includes('mill') ||
        pid.includes('grinder') ||
        pcat.includes('mill') ||
        pcat.includes('grinder') ||
        pcat.includes('مطاحن') ||
        pname.includes('grinder') ||
        ptags.includes('mills')
      );
    }
    if (activeTab === 'cabinets') {
      return (
        pid.includes('cabinet') ||
        pid.includes('station') ||
        pid.includes('corner') ||
        pcat.includes('cabinet') ||
        pcat.includes('أركان') ||
        pname.includes('cabinet') ||
        ptags.includes('cabinets')
      );
    }
    if (activeTab === 'accessories') {
      return (
        pid.includes('accessories') ||
        pid.includes('scale') ||
        pid.includes('cup') ||
        pid.includes('kit') ||
        pcat.includes('accessories') ||
        pcat.includes('ملحقات') ||
        pname.includes('tool') ||
        ptags.includes('accessories')
      );
    }
    return true;
    return true;
  });

  // Display top 3 to 6 popular models matching the 3-column layout in Images 4 & 5
  const displayProducts = filteredList.slice(0, 6);

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8 select-none">
      {/* ========================================================================= */}
      {/* 1. CAMPAIGN BANNER: "الموديلات الشائعة" (Pure White Theme with Black Text)   */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-[24px] sm:rounded-[36px] bg-white border-0 p-4 sm:p-10 lg:p-12 overflow-hidden shadow-xs text-center">
        {/* Floating Discount Ticket 1 (Left) */}
        <div className="absolute top-2 sm:top-4 left-3 sm:left-12 -rotate-12 bg-neutral-900 text-white font-black text-[9px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg border-0 shadow-xs flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
          <span>OFF 4%</span>
        </div>

        {/* Floating Discount Ticket 2 (Right) */}
        <div className="absolute top-2 sm:top-4 right-3 sm:right-12 rotate-12 bg-neutral-900 text-white font-black text-[9px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg border-0 shadow-xs flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300" />
          <span>OFF 4%</span>
        </div>

        {/* Left Decorative Element: 3D Box (Hidden on small mobile to isolate text & prevent overlap) */}
        <div className="hidden md:flex absolute -bottom-2 sm:-bottom-4 left-4 sm:left-12 w-20 sm:w-32 h-20 sm:h-32 opacity-85 pointer-events-none drop-shadow-md items-center justify-center">
          <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-xl sm:rounded-2xl bg-neutral-50 border-0 p-1 sm:p-2 flex flex-col items-center justify-center relative shadow-xs">
            <div className="w-8 sm:w-10 h-5 sm:h-7 border-0 rounded-t-full -mt-5 sm:-mt-6 mb-0.5 sm:mb-1" />
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-black" />
            <span className="text-[8px] sm:text-[10px] font-bold text-neutral-800 mt-0.5">HiBrew</span>
          </div>
        </div>

        {/* Right Decorative Element: 3D Box (Hidden on small mobile to isolate text & prevent overlap) */}
        <div className="hidden md:flex absolute -bottom-2 sm:-bottom-4 right-4 sm:right-12 w-20 sm:w-32 h-20 sm:h-32 opacity-85 pointer-events-none drop-shadow-md items-center justify-center">
          <div className="w-16 sm:w-24 h-16 sm:h-24 rounded-xl sm:rounded-2xl bg-neutral-50 border-0 p-1 sm:p-2 flex flex-col items-center justify-center relative shadow-xs">
            <div className="w-16 sm:w-28 h-4 sm:h-5 bg-black text-white rounded-md sm:rounded-lg absolute -top-1 sm:-top-2 border-0 shadow-2xs flex items-center justify-center">
              <span className="text-[7px] sm:text-[9px] font-black text-amber-300">✦ SPECIAL GIFT ✦</span>
            </div>
            <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-black mt-2 sm:mt-3" />
          </div>
        </div>

        {/* Center Main Headline (Pure Black Text, Readable) */}
        <div className="relative z-10 max-w-2xl mx-auto space-y-1.5 sm:space-y-2 py-2 sm:py-4">
          <h2
            className={`text-xl sm:text-4xl lg:text-[42px] font-black text-black tracking-tight ${
              isAr ? 'font-sans leading-[1.3]' : 'font-sans'
            }`}
          >
            {isAr ? 'الموديلات الشائعة' : 'Popular Models & Flagships'}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-neutral-600 max-w-lg mx-auto">
            {isAr
              ? 'أحدث مكائن الإسبريسو ومطاحن القهوة الأكثر طلباً مع هدايا حصرية وضمان الوكيل سنتين'
              : 'Our most sought-after commercial espresso machines and precision mills with exclusive gifts'}
          </p>

          {/* Quick Sub-Filter Tabs */}
          <div className="pt-2 sm:pt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'machines', labelAr: 'مكائن الإسبريسو', labelEn: 'Espresso Machines' },
              { id: 'mills', labelAr: 'مطاحن البن', labelEn: 'Coffee Mills' },
              { id: 'cabinets', labelAr: 'أركان القهوة', labelEn: 'Coffee Stations' },
              { id: 'accessories', labelAr: 'مستلزمات الباريستا', labelEn: 'Barista Tools' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-0'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE PRODUCTS GRID: 2 COLUMNS ON MOBILE & 3 COLUMNS ON DESKTOP        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
        {displayProducts.map((product) => (
          <HonorProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Products Action */}
      <div className="pt-4 text-center">
        <button
          type="button"
          onClick={() => navigateTo('products')}
          className="inline-flex items-center gap-2 px-8 py-3 bg-white hover:bg-neutral-50 text-[#2D1B0E] border border-[#DECBB8] hover:border-[#8C531B] rounded-full font-bold text-xs sm:text-sm shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
        >
          <span>{isAr ? 'عرض جميع المنتجات والموديلات' : 'View All Products & Models'}</span>
          {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
};
