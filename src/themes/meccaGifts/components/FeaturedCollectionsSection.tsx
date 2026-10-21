import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';

export interface FeaturedCollectionsSectionProps {
  settings?: Record<string, any>;
  isBuilderMode?: boolean;
}

export const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({
  settings,
  isBuilderMode = false,
}) => {
  const { language, builderDevice } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const s = settings || {};
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({
    customers: 0,
    orders: 0,
    years: 0,
    categories: 0,
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800;
          const frameDuration = 1000 / 60;
          const totalFrames = Math.round(duration / frameDuration);
          let frame = 0;

          const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCounts({
              customers: Math.min(10000, Math.floor(easeOut * 10000)),
              orders: Math.min(250, Math.floor(easeOut * 250)),
              years: Math.min(5, Math.floor(easeOut * 5)),
              categories: Math.min(24, Math.floor(easeOut * 24)),
            });

            if (frame >= totalFrames) {
              clearInterval(timer);
            }
          }, frameDuration);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const items = isCoffee
    ? [
        {
          id: 'stat-1',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
          value: `+${counts.customers.toLocaleString()}`,
          label: 'Coffee Enthusiasts',
          labelAr: 'عاشق للقهوة المختصة',
        },
        {
          id: 'stat-2',
          image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
          value: `+${counts.orders * 4}`,
          label: 'Daily Brews Served',
          labelAr: 'كوب قهوة محضر يومياً',
        },
        {
          id: 'stat-3',
          image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80',
          value: `+${counts.years}`,
          label: 'Years Roasting Mastery',
          labelAr: 'سنوات من خبرة التحميص',
        },
        {
          id: 'stat-4',
          image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
          value: `+${counts.categories}`,
          label: 'Single Origin Lots',
          labelAr: 'محصول عالمي مختار',
        },
      ]
    : [
        {
          id: 'stat-1',
          image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
          value: `+${counts.customers.toLocaleString()}`,
          label: 'Happy Customers',
          labelAr: 'عميل سعيد ومميز',
        },
        {
          id: 'stat-2',
          image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
          value: `+${counts.orders}`,
          label: 'Daily Orders',
          labelAr: 'طلب يومي متجدد',
        },
        {
          id: 'stat-3',
          image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
          value: `+${counts.years}`,
          label: 'Years of Experience',
          labelAr: 'سنوات من الخبرة والعراقة',
        },
        {
          id: 'stat-4',
          image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
          value: `+${counts.categories}`,
          label: 'Gift Categories',
          labelAr: 'تصنيف هدايا حصري',
        },
      ];

  return (
    <section ref={sectionRef} className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Title matching site-wide uniform styling */}
      <div className="mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c] text-start">
          {isAr ? 'تشكيلات مميزة وإنجازات' : 'Featured Collections'}
        </h2>
      </div>

      {/* 4 Cards Grid */}
      <div
        className={`grid ${
          builderDevice === 'mobile'
            ? 'grid-cols-2 gap-3.5'
            : builderDevice === 'tablet'
              ? 'grid-cols-2 sm:grid-cols-3 gap-4'
              : 'grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'
        }`}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#eee8df] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center"
          >
            {/* Image on Top */}
            <div className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf8f5] mb-4">
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                loading="lazy" decoding="async"
              />
            </div>

            {/* Stat Number */}
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-serif text-[#102a1c] tracking-tight">
              {item.value}
            </span>

            {/* Stat Label */}
            <p className="text-xs sm:text-sm text-[#70685c] mt-1 font-medium">
              {isAr ? item.labelAr : item.label}
            </p>
          </div>
        ))}
      </div>

      {/* Slider Indicator Pill */}
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <div className="w-10 h-1 bg-[#d4af37] rounded-full" />
        <div className="w-2.5 h-1 bg-[#d6cfc0] rounded-full" />
      </div>
    </section>
  );
};

