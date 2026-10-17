import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const FLOWER_CATEGORIES = [
  {
    id: 'cat-1',
    name: 'باقات ورد',
    nameEn: 'Flower Bouquets',
    image: '/src/assets/images/hadaya_saudi_luxury_bouquet_1791300211553.jpg',
    categoryKey: 'باقات الورود الطبيعية',
  },
  {
    id: 'cat-2',
    name: 'جوري أحمر',
    nameEn: 'Red Roses',
    image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
    categoryKey: 'ورد أحمر',
  },
  {
    id: 'cat-3',
    name: 'جوري أبيض',
    nameEn: 'White Roses',
    image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
    categoryKey: 'ورد أبيض',
  },
  {
    id: 'cat-4',
    name: 'سلات هدايا',
    nameEn: 'Gift Hampers',
    image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
    categoryKey: 'ورد وشوكولاتة بلجيكية فاخرة',
  },
  {
    id: 'cat-5',
    name: 'كيك',
    nameEn: 'Cakes',
    image: '/src/assets/images/hadaya_luxury_velvet_cake_1791218716453.jpg',
    categoryKey: 'ورد و كيك',
  },
  {
    id: 'cat-6',
    name: 'مجوهرات',
    nameEn: 'Jewelry',
    image: '/src/assets/images/hadaya_women_luxury_gift_1791219815272.jpg',
    categoryKey: 'هدايا ملكية فاخرة',
  },
  {
    id: 'cat-7',
    name: 'هدايا مواليد',
    nameEn: 'Baby Gifts',
    image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
    categoryKey: 'هدايا رومانسية',
  },
  {
    id: 'cat-8',
    name: 'هدايا رجالية',
    nameEn: "Men's Gifts",
    image: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
    categoryKey: 'هدايا رجالية',
  },
];

const COFFEE_CATEGORIES = [
  {
    id: 'cat-cof-1',
    name: 'حبوب القهوة المختصة',
    nameEn: 'Specialty Coffee Beans',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'حبوب القهوة المختصة',
  },
  {
    id: 'cat-cof-2',
    name: 'أدوات التحضير المقطرة',
    nameEn: 'Manual Pour-Over (V60)',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'أدوات التحضير المقطرة',
  },
  {
    id: 'cat-cof-3',
    name: 'معدات وإكسسوارات الإسبريسو',
    nameEn: 'Espresso Equipment',
    image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'معدات الإسبريسو',
  },
  {
    id: 'cat-cof-4',
    name: 'القهوة الباردة (كولد برو)',
    nameEn: 'Cold Brew Reserve',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'القهوة الباردة',
  },
  {
    id: 'cat-cof-5',
    name: 'أكواب سيراميك وباريستا',
    nameEn: 'Ceramic Cups & Tumblers',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'أكواب سيراميك',
  },
  {
    id: 'cat-cof-6',
    name: 'مطاحن القهوة الاحترافية',
    nameEn: 'Precision Coffee Grinders',
    image: 'https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'مطاحن القهوة',
  },
  {
    id: 'cat-cof-7',
    name: 'موازين ومؤقتات رقمية',
    nameEn: 'Digital Scales & Gear',
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'موازين ومؤقتات',
  },
  {
    id: 'cat-cof-8',
    name: 'محاصيل نادرة واشتراكات',
    nameEn: 'Rare Single Origins',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80',
    categoryKey: 'حبوب القهوة المختصة',
  },
];

export const CategoryGrid: React.FC = () => {
  const { language, navigateToCategory, setCurrentPage, setSelectedCategory, builderDevice } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const categories = useMemo(() => {
    if (isCoffee) return COFFEE_CATEGORIES;
    if (activeStore?.id === 'store-1') return FLOWER_CATEGORIES;

    // Dynamic fallback for any other new merchant store
    if (currentProducts && currentProducts.length > 0) {
      const map = new Map<string, { id: string; name: string; nameEn: string; image: string; categoryKey: string }>();
      currentProducts.forEach((p, idx) => {
        const cat = p.category || 'General';
        if (!map.has(cat)) {
          map.set(cat, {
            id: `cat-dyn-${idx}`,
            name: cat,
            nameEn: (p as any).categoryEn || cat,
            image: p.image || 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
            categoryKey: cat,
          });
        }
      });
      if (map.size >= 2) return Array.from(map.values()).slice(0, 8);
    }
    return FLOWER_CATEGORIES;
  }, [isCoffee, activeStore?.id, currentProducts]);

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header: Categories with View All */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'التصنيفات الرئيسية' : 'Categories'}
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

      {/* 8 Rounded Category Cards Grid (4 cols on desktop, 2 cols on mobile/tablet) */}
      <div
        className={`grid ${
          builderDevice === 'mobile'
            ? 'grid-cols-2 gap-3 sm:gap-3.5'
            : builderDevice === 'tablet'
              ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5'
        }`}
      >
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigateToCategory(cat.categoryKey)}
            className={`group relative ${
              builderDevice === 'mobile' ? 'h-40 rounded-2xl' : 'h-44 sm:h-52 md:h-60 rounded-2xl sm:rounded-3xl'
            } overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#102419]`}
          >
            {/* Background Photography */}
            <img
              src={cat.image}
              alt={isAr ? cat.name : cat.nameEn}
              className="w-full h-full object-cover object-center filter brightness-[0.82] group-hover:scale-108 group-hover:brightness-[0.92] transition-transform duration-500 ease-out"
              loading="lazy"
            />

            {/* Dark Gradient Scrim overlay at bottom for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {/* Content overlay with Category Name and Arrow */}
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4.5 flex items-center justify-between text-white pointer-events-none">
              <span className="text-sm sm:text-base font-bold tracking-tight drop-shadow-md">
                {isAr ? cat.name : cat.nameEn}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white/90 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform drop-shadow-md">
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
