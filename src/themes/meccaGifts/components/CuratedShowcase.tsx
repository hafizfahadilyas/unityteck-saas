import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { isSouqCommonTenant } from '../../souqCommon/isSouqCommonTenant';
import { PINK_PEONIES_IMAGE, LUXURY_GIFT_SET_IMAGE } from '../data/mockData';

export const CuratedShowcase: React.FC = () => {
  const { language, navigateToCategory, builderDevice } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isSouq = isSouqCommonTenant(activeStore) || (activeStore?.id && activeStore.id !== 'store-1' && activeStore.id !== 'store-coffee');

  const floraItems = [
    {
      id: 'romantic',
      title: 'Romantic',
      arabicTitle: 'اختيارات تُلهف',
      category: 'هدايا رومانسية',
      image: PINK_PEONIES_IMAGE,
      tag: isAr ? 'رومانسية' : 'Romantic'
    },
    {
      id: 'luxury',
      title: 'Luxury',
      arabicTitle: 'اختيارات تفتن',
      category: 'باقات فاخرة',
      image: '/images/hadaya_red_roses_bouquet_1791276749666.jpg',
      tag: isAr ? 'فخامة' : 'Luxury'
    },
    {
      id: 'signature',
      title: 'Signature',
      arabicTitle: 'اختيارات حصرية',
      category: 'ورد أبيض',
      image: '/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      tag: isAr ? 'حصري' : 'Signature'
    },
    {
      id: 'premium',
      title: 'Premium Gifts',
      arabicTitle: 'اختيارات صُممت',
      category: 'هدايا وخطوبة',
      image: LUXURY_GIFT_SET_IMAGE,
      tag: isAr ? 'هدايا فاخرة' : 'Premium'
    }
  ];

  const retailItems = [
    {
      id: 'timepieces',
      title: 'Timepieces',
      arabicTitle: 'ساعات وإكسسوارات عصرية',
      category: 'ساعات وإكسسوارات',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      tag: isAr ? 'ساعات' : 'Watches'
    },
    {
      id: 'audio',
      title: 'Smart Audio',
      arabicTitle: 'سماعات وإلكترونيات ذكية',
      category: 'إلكترونيات وأجهزة',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      tag: isAr ? 'صوتيات' : 'Audio'
    },
    {
      id: 'eyewear',
      title: 'Eyewear',
      arabicTitle: 'نظارات شمسية فاخرة',
      category: 'ساعات وإكسسوارات',
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
      tag: isAr ? 'نظارات' : 'Eyewear'
    },
    {
      id: 'giftsets',
      title: 'Gift Sets',
      arabicTitle: 'مجموعات وبوكسات إهداء',
      category: 'هدايا ومجموعات راقية',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
      tag: isAr ? 'أطقم هدايا' : 'Gift Sets'
    }
  ];

  const items = isSouq ? retailItems : floraItems;

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#102a1c] font-serif">
          {isAr
            ? (isSouq ? 'تشكيلات مختارة بعناية' : 'اختيارات صُممت لتُهدى')
            : (isSouq ? 'Curated Collections' : 'Curated to be Gifted')}
        </h2>
        <div className="w-16 h-0.5 bg-[#d4c19c] mx-auto mt-3" />
      </div>

      {/* 4 Cards Grid */}
      <div
        className={`grid ${
          builderDevice === 'mobile'
            ? 'grid-cols-2 gap-3.5'
            : builderDevice === 'tablet'
              ? 'grid-cols-2 sm:grid-cols-3 gap-4'
              : 'grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'
        }`}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigateToCategory(item.category)}
            className="group cursor-pointer flex flex-col items-center text-center bg-[#FAF9F5] border border-[#e8e4dc] rounded-3xl p-4 shadow-sm hover:shadow-xl hover:border-[#102a1c]/30 transition-all duration-300"
          >
            {/* Card Image Container with rounded top corners */}
            <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#ebe6dc] relative mb-4">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-base sm:text-lg font-bold text-[#102a1c] font-serif group-hover:text-[#8b263e] transition-colors">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#7a7164] mt-0.5 font-medium">
              {item.arabicTitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
