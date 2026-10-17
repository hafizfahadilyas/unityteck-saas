import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { Heart, Star, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Product } from '../types';

export const BestSellersSection: React.FC = () => {
  const { language, products, addToCart, wishlist, toggleWishlist, navigateToProduct, setCurrentPage, setSelectedCategory, builderDevice } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  // Fallback products matching Image 2 exactly if catalog is empty
  const defaultBestSellers: Product[] = [
    {
      id: 'best-1',
      name: 'باقة الرومانسية المخملية',
      nameEn: 'Romantic Bouquet',
      price: 199,
      originalPrice: 285,
      rating: 4.9,
      reviewsCount: 124,
      image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
      category: 'باقات فاخرة',
      categoryEn: 'Luxury Bouquets',
      badge: 'خصم 30%',
      badgeEn: 'Save 30%',
      description: 'باقة فاخرة تجمع بين أجود أنواع البيوني والورود المخملية.',
      descriptionEn: 'Luxury bouquet blending finest peonies and velvet fresh roses.',
      flowerTypes: ['بيوني وردي', 'بيبي روز'],
      inStock: true,
    },
    {
      id: 'best-2',
      name: 'الأناقة البيضاء الملكية',
      nameEn: 'White Elegance',
      price: 149,
      originalPrice: 199,
      rating: 4.9,
      reviewsCount: 98,
      image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      category: 'ورد أبيض',
      categoryEn: 'White Roses',
      badge: 'خصم 20%',
      badgeEn: 'Save 20%',
      description: 'جوري أبيض نقي يعبر عن أسمى معاني النقاء والتقدير.',
      descriptionEn: 'Pure white long-stem roses expressing elegance and sincerity.',
      flowerTypes: ['جوري هولندي أبيض'],
      inStock: true,
    },
    {
      id: 'best-3',
      name: 'باقة حب أبدي',
      nameEn: 'Forever Love',
      price: 249,
      originalPrice: 329,
      rating: 4.9,
      reviewsCount: 156,
      image: '/src/assets/images/hadaya_red_roses_bouquet_1791276749666.jpg',
      category: 'ورد أحمر',
      categoryEn: 'Red Roses',
      badge: 'خصم 25%',
      badgeEn: 'Save 25%',
      description: 'جوري أحمر إكوادوري مفعم بالحياة في تغليف أسود ملكي.',
      descriptionEn: 'Ecuadorian crimson roses presented in signature royal noir wrap.',
      flowerTypes: ['جوري أحمر إكوادوري'],
      inStock: true,
    },
    {
      id: 'best-4',
      name: 'رويال وايت ريفلكشن',
      nameEn: 'Royal White',
      price: 179,
      originalPrice: 239,
      rating: 4.9,
      reviewsCount: 87,
      image: '/src/assets/images/hadaya_royal_wedding_flowers_1791300194084.jpg',
      category: 'ورد أبيض',
      categoryEn: 'White Roses',
      badge: 'جديد',
      badgeEn: 'New',
      description: 'تنسيق زفاف راقي يجمع بين ورود الحديقة والأوركيد العاجي.',
      descriptionEn: 'Royal white bridal bouquet featuring Dutch orchids and garden blooms.',
      flowerTypes: ['أوركيد عاجي', 'جوري أبيض'],
      inStock: true,
    },
  ];

  // Dynamic products from store with smart matching
  const items: Product[] = React.useMemo(() => {
    if (products && products.length > 0) {
      return products.slice(0, 4).map((p, idx) => ({
        ...p,
        badge: idx === 0 ? 'خصم 30%' : idx === 1 ? 'خصم 20%' : idx === 2 ? 'خصم 25%' : 'جديد',
        badgeEn: idx === 0 ? 'Save 30%' : idx === 1 ? 'Save 20%' : idx === 2 ? 'Save 25%' : 'New',
        originalPrice: p.originalPrice || Math.round(p.price * (idx === 0 ? 1.43 : idx === 1 ? 1.25 : idx === 2 ? 1.33 : 1.3)),
      }));
    }
    return isCoffee ? [] : defaultBestSellers;
  }, [products, isCoffee]);

  const handleViewAll = () => {
    setSelectedCategory(null);
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header: Best Sellers with View All -> */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
          {isAr ? 'الأكثر مبيعاً' : 'Best Sellers'}
        </h2>

        <button
          type="button"
          onClick={handleViewAll}
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

      {/* 4 Clean Product Cards Grid (Matching Image 2 left bottom) */}
      <div
        className={`grid ${
          builderDevice === 'mobile'
            ? 'grid-cols-2 gap-3.5'
            : builderDevice === 'tablet'
              ? 'grid-cols-2 sm:grid-cols-3 gap-4'
              : 'grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6'
        }`}
      >
        {items.map((item) => {
          const isWish = wishlist.includes(item.id);
          const name = isAr ? item.name : item.nameEn;
          const badge = isAr ? item.badge : item.badgeEn;

          return (
            <div
              key={item.id}
              onClick={() => navigateToProduct(item)}
              className="group bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#eee8df] hover:border-[#d4af37]/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              {/* Image & Badges Container */}
              <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#faf8f5] mb-3">
                <img
                  src={item.image}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Discount Badge Pill */}
                {badge && (
                  <span className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fbf5e7] text-[#936d29] border border-[#e8d7ae] shadow-2xs">
                    {badge}
                  </span>
                )}

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(item.id);
                  }}
                  aria-label="Wishlist"
                  className={`absolute top-2.5 end-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all ${
                    isWish
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 shadow-2xs'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Title, Rating, Price */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1b251e] line-clamp-1 group-hover:text-[#0d2f24]">
                    {name}
                  </h3>

                  <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-[#202521]">{item.rating || 4.9}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({item.reviewsCount || 120})</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1.5 mb-2.5">
                    <span className="text-sm sm:text-base font-extrabold text-[#102a1c] font-mono">
                      {isAr ? `${item.price} ر.س` : `SAR ${item.price}`}
                    </span>
                    {item.originalPrice && (
                      <span className="text-xs text-slate-400 line-through font-mono">
                        {isAr ? `${item.originalPrice} ر.س` : `SAR ${item.originalPrice}`}
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Pill Button (Matching exact image pill with cart icon) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(item, 1);
                    }}
                    className="w-full py-2 px-3 rounded-full border border-[#d6cfc0] hover:border-[#102a1c] bg-white hover:bg-[#102a1c] text-[#102a1c] hover:text-[#f3e5c8] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-2xs cursor-pointer active:scale-95"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
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
