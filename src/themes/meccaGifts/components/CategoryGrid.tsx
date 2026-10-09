import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EIGHT_FEATURED_CATEGORIES } from '../data/mockData';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

export const CategoryGrid: React.FC = () => {
  const { language, navigateToCategory, setSelectedCategory, setCurrentPage } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<string>('all');

  const topFiveTabs = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'باقات فاخرة', label: isAr ? 'باقات فاخرة' : 'Luxury Bouquets' },
    { id: 'ورد أحمر', label: isAr ? 'ورد أحمر' : 'Red Roses' },
    { id: 'ورد أبيض', label: isAr ? 'ورد أبيض' : 'White Roses' },
    { id: 'هدايا رومانسية', label: isAr ? 'هدايا رومانسية' : 'Romantic Gifts' },
    { id: 'هدايا رجالية', label: isAr ? 'هدايا رجالية' : 'Men Gifts' }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'all') {
      setSelectedCategory(null);
    } else {
      navigateToCategory(tabId);
    }
  };

  return (
    <section className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-8 border-b border-[#e8e4dc] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#e6ca98]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8c8275]">
              {isAr ? 'أقسامنا الحصرية' : 'Exclusive Collections'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
            {isAr ? 'اختيارات صُممت لتُهدى' : 'Curated to be Gifted'}
          </h2>
        </div>

        {/* Top 5 Quick Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#ede8df] rounded-2xl overflow-x-auto max-w-full no-scrollbar">
          {topFiveTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#102a1c] text-[#e6ca98] shadow-sm'
                  : 'text-[#555] hover:text-[#102a1c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exactly 8 Rounded Cards Grid matching Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {EIGHT_FEATURED_CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateToCategory(cat.name)}
            className="group relative h-48 sm:h-56 md:h-64 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 bg-[#1b261e]"
          >
            {/* Background Photography */}
            <img
              src={cat.image}
              alt={isAr ? cat.name : cat.nameEn}
              className="w-full h-full object-cover object-center filter brightness-[0.8] group-hover:scale-108 group-hover:brightness-[0.92] transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />

            {/* Dark Scrim overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

            {/* Content overlay with label and -> indicator */}
            <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-wide group-hover:text-[#e6ca98] transition-colors">
                  {isAr ? cat.name : cat.nameEn}
                </span>
                <span className="text-xs text-[#e6ca98] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-all">
                  {isAr ? '←' : '→'}
                </span>
              </div>

              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center group-hover:bg-[#e6ca98] group-hover:text-[#102a1c] transition-all duration-300">
                {isAr ? (
                  <ArrowLeft className="w-3.5 h-3.5 text-white group-hover:text-[#102a1c]" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-white group-hover:text-[#102a1c]" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
