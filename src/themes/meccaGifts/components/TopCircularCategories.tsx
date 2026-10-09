import React from 'react';
import { useApp } from '../context/AppContext';
import { StoreCollections3DGallery } from './StoreCollections3DGallery';
import { RoundShapes3DMotionCarousel, RoundShapeItem } from './RoundShapes3DMotionCarousel';

export const TopCircularCategories: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  // 2. Categories By Occasion with 100% Round Shape 3D Motion Carousel
  const occasionItems: RoundShapeItem[] = [
    {
      id: 'occ-1',
      name: 'هدايا الزواج والعروس',
      nameEn: 'Wedding & Bride',
      image: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
      subtitle: 'باقات ملكية وتنسيقات زهور للعروسين',
      subtitleEn: 'Royal bridal bouquets & floral arrangements',
      badge: isAr ? 'ألف مبروك' : 'Wedding',
      badgeEn: 'Wedding',
      categoryFilter: 'ذكرى زواج'
    },
    {
      id: 'occ-2',
      name: 'هدايا التخرج والنجاح',
      nameEn: 'Graduation Milestones',
      image: 'https://cdn.salla.sa/form-builder/unEMJIoOHLnWigTn0DpvQZbQMxNjU4QgVOT2BdUM.png',
      subtitle: 'أطواق ووشاحات التخرج وباقات مبهجة',
      subtitleEn: 'Graduation floral sashes & congratulation sets',
      badge: isAr ? 'مبارك التخرج' : 'Graduation',
      badgeEn: 'Graduation',
      categoryFilter: 'هدايا وخطوبة'
    },
    {
      id: 'occ-3',
      name: 'هدايا المواليد واستقبال',
      nameEn: 'Newborn Welcome Gifts',
      image: 'https://cdn.salla.sa/form-builder/h7hTylc4cMiriSfxe2sGsX0mL5Sc7akjxHAAUqHp.png',
      subtitle: 'استقبال المواليد بأجمل باقات الزهور وأطقم الضيافة',
      subtitleEn: 'Joyous baby shower flowers & welcome gifts',
      badge: isAr ? 'مبروك المولود' : 'Newborn',
      badgeEn: 'Newborn',
      categoryFilter: 'باقات فاخرة'
    },
    {
      id: 'occ-4',
      name: 'لوحات مواجيب التراثية',
      nameEn: 'Mawajeeb Keepsakes',
      image: 'https://cdn.files.salla.network/products/246985580/539625c7-703f-4c13-aa4c-24d982e20865-original.webp',
      subtitle: 'لوحات تذكارية وتراث حجازي عريق',
      subtitleEn: 'Authentic Hijazi heritage keepsakes & art',
      badge: isAr ? 'تراث حجازي' : 'Heritage',
      badgeEn: 'Heritage',
      categoryFilter: 'هدايا رجالية'
    },
    {
      id: 'occ-5',
      name: 'هدايا عيد ميلاد سعيدة',
      nameEn: 'Birthday Blooms',
      image: 'https://cdn.salla.sa/form-builder/nm5BDgkXRslZvqTetu5wTrCTTTTLTrsBhWwjHMyI.png',
      subtitle: 'باقات ورود مبهجة وكيك وتنسيقات مفاجآت',
      subtitleEn: 'Delightful birthday bouquets & custom treats',
      badge: isAr ? 'كل عام وأنتم بخير' : 'Birthday',
      badgeEn: 'Birthday',
      categoryFilter: 'عيد ميلاد'
    },
    {
      id: 'occ-6',
      name: 'تمنيات الشفاء والسلامة',
      nameEn: 'Get Well Soon',
      image: 'https://cdn.salla.sa/form-builder/WnIswy3NAtj1b5CuPg0ESG1ONPIomfuzmnRfzPUD.png',
      subtitle: 'زهور نضرة تبهج النفس وتبث التفاؤل',
      subtitleEn: 'Uplifting blooms wishing speedy recovery',
      badge: isAr ? 'الحمد لله على السلامة' : 'Get Well',
      badgeEn: 'Get Well',
      categoryFilter: 'باقات الورود الطبيعية'
    },
    {
      id: 'occ-7',
      name: 'ذكرى زواج وحب',
      nameEn: 'Anniversary & Romance',
      image: 'https://cdn.salla.sa/form-builder/Y0Yt8LLfhRt46ljjaZjTaANumrZvYodYnv5CGQ7o.png',
      subtitle: 'جوري أحمر بلجيكي وتنسيقات رومانسية ساحرة',
      subtitleEn: 'Red roses & luxurious romantic statements',
      badge: isAr ? 'حب وامتنان' : 'Romance',
      badgeEn: 'Romance',
      categoryFilter: 'هدايا رومانسية'
    }
  ];

  // 3. Discounted & Special Offers with 100% Round Shape 3D Motion Carousel
  const offerItems: RoundShapeItem[] = [
    {
      id: 'off-1',
      name: 'باقات ورود طبيعية مخفضة',
      nameEn: 'Discounted Fresh Bouquets',
      image: '/src/assets/images/hadaya_white_roses_bouquet_1791276726730.jpg',
      subtitle: 'جوري هولندي فاخر بسعر ترويجي مميز',
      subtitleEn: 'Dutch long-stem roses at special promo rate',
      badge: isAr ? 'خصم حتى 35%' : 'Up to 35% Off',
      badgeEn: '35% Off',
      categoryFilter: 'باقات ورود طبيعية مخفضة'
    },
    {
      id: 'off-2',
      name: 'عروض باقات الورد والشكولاتة',
      nameEn: 'Roses & Chocolate Bundles',
      image: '/src/assets/images/hadaya_luxury_gift_noir_1791218956267.jpg',
      subtitle: 'باقة جوري أحمر مع بوكس باتشي مذهب',
      subtitleEn: 'Red roses paired with Patchi luxury box',
      badge: isAr ? 'وفر 70 ر.س' : 'Save 70 SAR',
      badgeEn: 'Save 70 SAR',
      categoryFilter: 'ورد وشوكولاتة بلجيكية فاخرة'
    },
    {
      id: 'off-3',
      name: 'باقات التوفير الملكية الكبرى',
      nameEn: 'Grand Royal Saver Bouquets',
      image: '/src/assets/images/hadaya_pink_peonies_1791216156090.jpg',
      subtitle: 'بيوني وزهور بيبي روز نادرة بتوفير مضاعف',
      subtitleEn: 'Imported pink peonies with royal savings',
      badge: isAr ? 'عرض حصري' : 'Exclusive Deal',
      badgeEn: 'Exclusive Deal',
      categoryFilter: 'باقات فاخرة'
    },
    {
      id: 'off-4',
      name: 'عروض فازات المكاتب والمجالس',
      nameEn: 'Office & Salon Vases Sale',
      image: '/src/assets/images/hadaya_white_orchid_penthouse_1791218732789.jpg',
      subtitle: 'فازات كريستال ملكية تدوم طويلاً',
      subtitleEn: 'Long-lasting handcrafted crystal orchid vases',
      badge: isAr ? 'لفترة محدودة' : 'Limited Time',
      badgeEn: 'Limited Time',
      categoryFilter: 'فازات ورود طبيعية'
    },
    {
      id: 'off-5',
      name: 'بكجات هدايا التخرج المخفضة',
      nameEn: 'Graduation Combo Packages',
      image: 'https://cdn.salla.sa/form-builder/Z8aMbQ8cDkf9OnQakCZwnH4GvpnqLlXsCqBk70ik.png',
      subtitle: 'طقم هدية تخرج فاخر مع باقة ورد طبيعي',
      subtitleEn: 'Graduation keepsakes bundle & fresh flowers',
      badge: isAr ? 'هدية + ورد' : 'Combo Pack',
      badgeEn: 'Combo Pack',
      categoryFilter: 'هدايا رجالية'
    },
    {
      id: 'off-6',
      name: 'عروض عطلة نهاية الأسبوع',
      nameEn: 'Weekend Flash Deals',
      image: '/src/assets/images/hadaya_promo_banner_1791216140411.jpg',
      subtitle: 'توصيل فوري مجاني خلال ساعتين بمكة المكرمة',
      subtitleEn: 'Express 2-hr free delivery across Mecca',
      badge: isAr ? 'شحن مجاني' : 'Free Shipping',
      badgeEn: 'Free Shipping',
      categoryFilter: 'باقات الورود الطبيعية'
    },
    {
      id: 'off-7',
      name: 'عرض كيك وباقة الورد',
      nameEn: 'Cake & Flower Celebration',
      image: '/src/assets/images/hadaya_luxury_velvet_cake_1791218716453.jpg',
      subtitle: 'كيك كوري طازج مع باقة ورود مختارة',
      subtitleEn: 'Fresh bakery paired with fresh roses',
      badge: isAr ? 'كيك + باقة' : 'Cake & Flowers',
      badgeEn: 'Cake & Flowers',
      categoryFilter: 'ورد و كيك'
    }
  ];

  return (
    <div className="space-y-12 sm:space-y-16 py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      {/* Ambient Radial Floral Aura */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#e6ca98]/12 via-[#FAF9F5]/40 to-transparent pointer-events-none rounded-full blur-2xl -z-10" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#102a1c]/8 via-[#FAF9F5]/40 to-transparent pointer-events-none rounded-full blur-2xl -z-10" />

      {/* 1. STORE COLLECTIONS: 3D Card Carousel with Smooth Motion Animation */}
      <section className="relative bg-gradient-to-b from-white/70 via-[#fcfaf4] to-white/70 rounded-3xl p-4 sm:p-7 border border-[#e6ca98]/35 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-[#102a1c] to-[#d4af37] shadow-xs" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-[#102a1c]">
                {isAr ? 'تشكيلات المتجر' : 'Store Collections'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
              {isAr ? 'أفخم تشكيلات الزهور والهدايا الفاخرة المنسقة بأعلى معايير الإتقان' : 'Curated premium fresh blooms and signature luxury collections'}
            </p>
          </div>
        </div>

        {/* 3D Interactive Card Carousel */}
        <StoreCollections3DGallery />
      </section>

      {/* 2. CATEGORIES BY OCCASION: Round Shapes 3D Motion Carousel (ZERO SCROLLBARS) */}
      <RoundShapes3DMotionCarousel
        title="تصنيفات حسب المناسبة"
        titleEn="Categories by Occasion"
        subtitle="شاركهم أجمل اللحظات باختيار هديتك حسب المناسبة الخاصة"
        subtitleEn="Celebrate life milestones with dedicated theme arrangements"
        items={occasionItems}
        themeColor="rose"
      />

      {/* 3. DISCOUNTED & SPECIAL OFFERS: Round Shapes 3D Motion Carousel (ZERO SCROLLBARS) */}
      <RoundShapes3DMotionCarousel
        title="عروض وتخفيضات خاصة"
        titleEn="Special Offers & Promotions"
        subtitle="توفير استثنائي على باقات الورد والهدايا الملكية لفترة محدودة"
        subtitleEn="Limited-time discounts on royal flower bouquets and luxury gift packages"
        items={offerItems}
        themeColor="gold"
      />
    </div>
  );
};
