import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

export const TrendingThisWeekSection: React.FC = () => {
  const { language, products, addToCart, navigateToProduct } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Exact 5 products from Image 2
  const defaultTrending: Product[] = [
    {
      id: 'trend-1',
      name: 'بوكس الورد الملكي الفاخر',
      nameEn: 'Luxury Flower Box',
      price: 349,
      rating: 4.9,
      reviewsCount: 110,
      description: 'بوكس خشبي أنيق يحتوي على أزهار الجوري والبيبي روز الفاخرة.',
      descriptionEn: 'Luxury keepsake box filled with premium fresh blooms.',
      flowerTypes: ['جوري هولندي', 'بيبي روز'],
      image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      category: 'باقات فاخرة',
      categoryEn: 'Luxury Bouquets',
      inStock: true,
    },
    {
      id: 'trend-2',
      name: 'باقة الجوري الأحمر الإكوادوري',
      nameEn: 'Red Rose Bouquet',
      price: 199,
      rating: 4.9,
      reviewsCount: 145,
      description: 'جوري أحمر إكوادوري طويل الساق بتغليف أنيق.',
      descriptionEn: 'Long-stem red roses in signature elegant wrapping.',
      flowerTypes: ['جوري أحمر'],
      image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
      category: 'ورد أحمر',
      categoryEn: 'Red Roses',
      inStock: true,
    },
    {
      id: 'trend-3',
      name: 'سلة الهدايا الملكية الفاخرة',
      nameEn: 'Gift Hamper',
      price: 299,
      rating: 4.9,
      reviewsCount: 92,
      description: 'سلة إهداء متكاملة تضم زهوراً طبيعية وشوكولاتة فاخرة.',
      descriptionEn: 'Gourmet gift hamper paired with fresh blooms and Belgian chocolates.',
      flowerTypes: ['أزهار منوعة'],
      image: '/src/assets/images/hadaya_luxury_gift_set_1791216170853.jpg',
      category: 'ورد وشوكولاتة بلجيكية فاخرة',
      categoryEn: 'Roses & Chocolates',
      inStock: true,
    },
    {
      id: 'trend-4',
      name: 'باقة زهور مشكلة موسمية',
      nameEn: 'Mixed Flowers',
      price: 249,
      rating: 4.8,
      reviewsCount: 78,
      description: 'مزيج رائع من أزهار البيوني والجوري واليوكاليبتوس الطبيعي.',
      descriptionEn: 'Vibrant mix of seasonal garden peonies and fresh foliage.',
      flowerTypes: ['بيوني', 'جوري'],
      image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
      category: 'باقات الورود الطبيعية',
      categoryEn: 'Natural Bouquets',
      inStock: true,
    },
    {
      id: 'trend-5',
      name: 'طقم إهداء رجالي ملكي فاخر',
      nameEn: "Men's Gift Set",
      price: 279,
      rating: 5.0,
      reviewsCount: 64,
      description: 'طقم رجالي فاخر يجمع بين العطور والعود الطبيعي وتنسيق الورد.',
      descriptionEn: 'Bespoke executive gift set featuring authentic oud and floral accents.',
      flowerTypes: ['ورد بيبي روز'],
      image: '/src/assets/images/hadaya_men_luxury_gift_1791219799100.jpg',
      category: 'هدايا رجالية',
      categoryEn: 'Men Gifts',
      inStock: true,
    },
  ];

  const items: Product[] = React.useMemo(() => {
    if (products && products.length > 0) {
      // Use products from store catalog preserving their real name, price and images
      return products.slice(0, 8);
    }
    return isCoffee ? [] : defaultTrending;
  }, [products, isCoffee]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: isAr ? -offset : offset, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Prev / Next Arrow Controls */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'الأكثر رواجاً هذا الأسبوع' : 'Trending This Week'}
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Previous"
            className="w-8 h-8 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Next"
            className="w-8 h-8 rounded-full border border-[#d6cfc0] bg-white hover:bg-[#102a1c] hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Horizontal Carousel (Exact 5 cards matching Image 2) */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth"
      >
        {items.map((item) => {
          const name = isAr ? item.name : item.nameEn;
          return (
            <div
              key={item.id}
              onClick={() => navigateToProduct(item)}
              className="group min-w-[210px] sm:min-w-[230px] max-w-[240px] bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#eee8df] hover:border-[#d4af37]/60 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer shrink-0"
            >
              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf8f5] mb-3">
                <img
                  src={item.image}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                  loading="lazy"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#1b251e] line-clamp-1 group-hover:text-[#0d2f24]">
                  {name}
                </h3>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs sm:text-sm font-extrabold text-[#102a1c] font-mono">
                    {isAr ? `${item.price} ر.س` : `SAR ${item.price}`}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item, 1);
                    }}
                    aria-label="Add to cart"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#d6cfc0] hover:border-[#102a1c] bg-white hover:bg-[#102a1c] text-[#102a1c] hover:text-[#f3e5c8] flex items-center justify-center transition-all cursor-pointer active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
