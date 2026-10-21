import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const FLOWER_SHOP_CATEGORIES = [
  {
    id: 'cat-rom',
    title: 'Romantic Bouquets',
    titleAr: 'باقات رومانسية',
    sub: 'Fresh natural blooms',
    subAr: 'زهور طبيعية فريش',
    image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
    categoryKey: 'هدايا رومانسية',
  },
  {
    id: 'cat-lux',
    title: 'Luxury Gifts',
    titleAr: 'هدايا فاخرة',
    sub: 'Curated royal sets',
    subAr: 'أطقم إهداء ملكية',
    image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
    categoryKey: 'هدايا ملكية فاخرة',
  },
  {
    id: 'cat-sig',
    title: 'Signature Collections',
    titleAr: 'تشكيلات مميزة',
    sub: 'Exquisite arrangements',
    subAr: 'تنسيقات حصرية راقية',
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    categoryKey: 'باقات فاخرة',
  },
  {
    id: 'cat-prem',
    title: 'Premium Gifts',
    titleAr: 'هدايا بريميوم',
    sub: 'Executive VIP hampers',
    subAr: 'هدايا كبار الشخصيات',
    image: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
    categoryKey: 'هدايا رجالية',
  },
];

const COFFEE_SHOP_CATEGORIES = [
  {
    id: 'cat-cof-beans',
    title: 'Specialty Coffee Beans',
    titleAr: 'حبوب القهوة المختصة',
    sub: 'Single origin roasted fresh',
    subAr: 'محاصيل سنجل أوريجن طازجة',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'حبوب القهوة المختصة',
  },
  {
    id: 'cat-cof-pour',
    title: 'Pour-Over V60 Brewing',
    titleAr: 'أدوات التقطير V60',
    sub: 'Drippers, carafes & filters',
    subAr: 'أقماع وفلاتر وسيرفرات مقطرة',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'أدوات التحضير المقطرة',
  },
  {
    id: 'cat-cof-esp',
    title: 'Espresso Equipment',
    titleAr: 'مكائن وإكسسوارات الإسبريسو',
    sub: 'Commercial & home espresso',
    subAr: 'مطاحن دقيقة ومكائن ضغط عالي',
    image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'معدات الإسبريسو',
  },
  {
    id: 'cat-cof-cold',
    title: 'Cold Brew & Barista Gear',
    titleAr: 'كولد برو وأكواب باريستا',
    sub: 'Steeped bottles & ceramic cups',
    subAr: 'منقوع بارد وأكواب سيراميك أنيقة',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'القهوة الباردة',
  },
];

export const ShopByCategorySection: React.FC = () => {
  const { language, navigateToCategory, setCurrentPage, setSelectedCategory, builderDevice } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const categories = useMemo(() => {
    if (isCoffee) return COFFEE_SHOP_CATEGORIES;
    if (activeStore?.id === 'store-1') return FLOWER_SHOP_CATEGORIES;

    if (currentProducts && currentProducts.length > 0) {
      const map = new Map<string, any>();
      currentProducts.forEach((p, idx) => {
        const cat = p.category || 'General';
        if (!map.has(cat)) {
          map.set(cat, {
            id: `cat-dyn-shop-${idx}`,
            title: (p as any).categoryEn || cat,
            titleAr: cat,
            sub: 'Exclusive Collection',
            subAr: 'تشكيلة حصرية',
            image: p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
            categoryKey: cat,
          });
        }
      });
      if (map.size >= 2) return Array.from(map.values()).slice(0, 4);
    }
    return FLOWER_SHOP_CATEGORIES;
  }, [isCoffee, activeStore?.id, currentProducts]);

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header matching site-wide uniform styling */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'تسوق حسب التصنيف' : 'Shop by Category'}
        </h2>

        <button
          type="button"
          onClick={() => {
            setSelectedCategory(null);
            setCurrentPage('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102a1c] hover:text-[#b8860b] transition-colors cursor-pointer group"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          {isAr ? (
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          ) : (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>

      {/* 4 Cards Grid — Exactly matching Featured Collections structure */}
      <div
        className={`grid ${
          builderDevice === 'mobile'
            ? 'grid-cols-2 gap-3.5'
            : builderDevice === 'tablet'
              ? 'grid-cols-2 sm:grid-cols-3 gap-4'
              : 'grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'
        }`}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateToCategory(cat.categoryKey)}
            className="group bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-[#eee8df] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center cursor-pointer hover:-translate-y-1"
          >
            {/* Image on Top — Same to Same as Featured Collections */}
            <div className="w-full aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf8f5] mb-4">
              <img
                src={cat.image}
                alt={isAr ? cat.titleAr : cat.title}
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                loading="lazy" decoding="async"
              />
            </div>

            {/* Title in Serif Bold — Same to Same */}
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold font-serif text-[#102a1c] tracking-tight group-hover:text-[#0d2f24] transition-colors">
              {isAr ? cat.titleAr : cat.title}
            </h3>

            {/* Subtitle with subtle arrow */}
            <p className="text-xs sm:text-sm text-[#70685c] mt-1 font-medium flex items-center justify-center gap-1 group-hover:text-[#b8860b] transition-colors">
              <span>{isAr ? cat.subAr : cat.sub}</span>
              <span className="group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform text-[11px]">
                {isAr ? <ArrowLeft className="w-3.5 h-3.5 inline" /> : <ArrowRight className="w-3.5 h-3.5 inline" />}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Slider Indicator Pill — Same to Same as Featured Collections */}
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <div className="w-10 h-1 bg-[#d4af37] rounded-full" />
        <div className="w-2.5 h-1 bg-[#d6cfc0] rounded-full" />
      </div>
    </section>
  );
};

