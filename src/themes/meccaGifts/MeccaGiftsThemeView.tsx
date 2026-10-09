import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Product } from './index';
import { Header } from './components/Header';
import { MotionHeroSlider } from './components/MotionHeroSlider';
import { DiscountedBouquets3DGallery } from './components/DiscountedBouquets3DGallery';
import { MarqueeBanner } from './components/MarqueeBanner';
import { TopCircularCategories } from './components/TopCircularCategories';
import { ProductSectionSlider } from './components/ProductSectionSlider';
import { PromoBannersPair } from './components/PromoBannersPair';
import { PromoCountdownBanner } from './components/PromoCountdownBanner';
import { SocialReelsSection } from './components/SocialReelsSection';
import { VideoSection } from './components/VideoSection';
import { StoreFeaturesBar } from './components/StoreFeaturesBar';
import { MetricsSection } from './components/MetricsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { NewsletterSection } from './components/NewsletterSection';
import { MagazineSection } from './components/MagazineSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { InvoiceAlertModal } from './components/InvoiceAlertModal';
import { AuthModal } from './components/AuthModal';

import {
  DISCOUNTED_BOUQUETS,
  NATURAL_BOUQUETS,
  CHOCOLATE_ROSES,
  CAKE_ROSES,
  COFFEE_SWEETS_ROSES,
  FLOWER_VASES,
  MAWAJEEB_PRODUCTS,
  LUXURY_SETS,
} from './data/mockData';

import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ThankYouPage } from './pages/ThankYouPage';
import { UserCrmPage } from './pages/UserCrmPage';
import { usePrefs } from '../../i18n/PrefsContext';
import { useTenant } from '../../context/TenantContext';
import { ThemePreloader } from '../../components/common/ThemePreloader';
import { UnderConstructionPage } from '../../components/storefront/UnderConstructionPage';
import { readAllThemeSettings } from '../settings/themeSettingsStore';
import { MECCA_LOGO } from '../../data/hadayaMeccaData';

interface MeccaGiftsThemeViewProps {
  initialPage?: string;
  onOpenStoreDashboard?: () => void;
  isAdmin?: boolean;
}

const MeccaGiftsInner: React.FC<MeccaGiftsThemeViewProps> = ({ initialPage, isAdmin = false }) => {
  const { currentPage, setCurrentPage, toastMessage, isAuthModalOpen, setIsAuthModalOpen, setLanguage, products } = useApp();
  const { locale } = usePrefs();
  const { activeStore, addToCart: tenantAddToCart } = useTenant();
  const [isAdminBypass, setIsAdminBypass] = useState(false);

  const themeSettings = useMemo(() => {
    return readAllThemeSettings(activeStore.id, activeStore);
  }, [activeStore.id, activeStore]);

  const isMaintenance = Boolean(themeSettings.maintenance?.enabled && !isAdminBypass);

  // Dynamic products per section derived from store catalog with rich fallbacks
  const sectionProducts = useMemo(() => {
    const list = products && products.length > 0 ? products : [];

    const filterByKeywords = (keywords: string[], fallback: Product[], maxLimit: number = 6) => {
      const matched = list.filter((p) => {
        const text = `${p.name} ${p.nameEn} ${p.category} ${p.categoryEn || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        return keywords.some((k) => text.includes(k.toLowerCase()));
      });
      if (matched.length >= maxLimit) return matched.slice(0, maxLimit);
      const existingIds = new Set(matched.map((m) => m.id));
      const rest = fallback.filter((f) => !existingIds.has(f.id));
      return [...matched, ...rest].slice(0, maxLimit);
    };

    return {
      natural: filterByKeywords(['طبيعي', 'باقة', 'rose', 'bouquet', 'peony', 'valent'], NATURAL_BOUQUETS, 6),
      luxury: filterByKeywords(['ملكي', 'سلة', 'طقم', 'vip', 'hamper', 'luxury', 'men', 'نساء'], LUXURY_SETS, 6),
      chocolate: filterByKeywords(['شوكول', 'باتشي', 'بستاني', 'choc'], CHOCOLATE_ROSES, 6),
      cake: filterByKeywords(['كيك', 'حلا', 'cake', 'ريد فيلفت', 'ميلاد'], CAKE_ROSES, 6),
      coffee: filterByKeywords(['قهوة', 'ضيافة', 'coffee'], COFFEE_SWEETS_ROSES, 6),
      vases: filterByKeywords(['فاز', 'كريستال', 'lily', 'orchid', 'vase'], FLOWER_VASES, 6),
      mawajeeb: filterByKeywords(['مواجيب', 'تراث', 'خشب', 'بخور'], MAWAJEEB_PRODUCTS, 4),
    };
  }, [products]);

  // Sync locale with prefs
  useEffect(() => {
    if (locale === 'ar' || locale === 'en') {
      setLanguage(locale);
    }
  }, [locale, setLanguage]);

  // Sync initialPage only when the prop itself changes from parent
  const initialPageRef = React.useRef(initialPage);
  useEffect(() => {
    if (initialPage && initialPage !== initialPageRef.current) {
      initialPageRef.current = initialPage;
      setCurrentPage(initialPage);
    }
  }, [initialPage, setCurrentPage]);

  if (isMaintenance) {
    return (
      <UnderConstructionPage
        config={themeSettings.maintenance}
        onBypassPreview={() => setIsAdminBypass(true)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#202521] font-sans relative selection:bg-[#102a1c]/20 overflow-x-hidden w-full max-w-[100vw]">
      {/* Branded Luxury Storefront Preloader */}
      <ThemePreloader
        enabled={themeSettings.colors?.enableLoadingScreen ?? false}
        isLoading={false}
        storeName={activeStore.name}
        storeNameAr={activeStore.name}
        title={themeSettings.colors?.loadingTitle}
        subtitle={themeSettings.colors?.loadingSubtitle}
        logoUrl={themeSettings.colors?.loadingLogoUrl || activeStore.logo || MECCA_LOGO}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#102a1c] text-[#e6ca98] text-xs font-semibold px-5 py-3 rounded-full shadow-2xl border border-[#e6ca98]/40 animate-in fade-in slide-in-from-top-4 duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Header with Logo, Search, User, Bag, Language & Mega Menu */}
      <Header />

      {/* Slide-out Cart Drawer with WhatsApp Order */}
      <CartDrawer />

      {/* Official ZATCA VAT Tax Electronic Invoice Popup Modal */}
      <InvoiceAlertModal />

      {/* Google 1-Click Sign In & Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Page Routing */}
      <main className="flex-1">
        {(currentPage === 'home' || !['catalog', 'product', 'cart', 'checkout', 'thankyou', 'crm'].includes(currentPage)) && (
          <>
            {/* 1. 3D Motion Hero Slider with Parallax and New Luxury Visuals */}
            <MotionHeroSlider />

            {/* 2. Running Marquee Announcement Bar */}
            <MarqueeBanner />

            {/* 3. Non-Duplicate 3 Dedicated Circular Collections (Store, Occasions, Offers) with Top 6 in each */}
            <TopCircularCategories />

            {/* 4. Section: باقات ورود طبيعية مخفضة (Discounted Natural Flower Bouquets) - 3D Card Stack Gallery */}
            <DiscountedBouquets3DGallery />

            {/* 5. Section: باقات الورود الطبيعية (6 Products) */}
            <ProductSectionSlider
              title="باقات الورود الطبيعية"
              titleEn="Natural Fresh Flower Bouquets"
              subtitle="أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء"
              subtitleEn="Finest Dutch and Ecuadorian long-stem roses tailored by master florists"
              products={sectionProducts.natural}
              categoryFilter="باقات الورود الطبيعية"
              limit={6}
              layout="slider"
            />

            {/* 6. Dual Promotional Banners Pair from Mecca Gifts */}
            <PromoBannersPair />

            {/* 7. Special Countdown Offer Banner (Matching Image 6) */}
            <PromoCountdownBanner />

            {/* 8. Section: هدايا ملكية فاخرة (رجالية ونسائية) (Matching Image 4 & 5) */}
            <ProductSectionSlider
              title="هدايا ملكية فاخرة (رجالية ونسائية)"
              titleEn="Royal Luxury Gift Sets (Men & Women)"
              subtitle="أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة"
              subtitleEn="Signature executive and feminine luxury gift sets with blooms and fine accessories"
              products={sectionProducts.luxury}
              categoryFilter="هدايا رجالية"
              limit={6}
              layout="slider"
            />

            {/* 9. Section: ورد وشوكولاتة بلجيكية فاخرة (6 Products) */}
            <ProductSectionSlider
              title="ورد وشوكولاتة بلجيكية فاخرة"
              titleEn="Roses & Luxury Belgian Chocolates"
              subtitle="أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة"
              subtitleEn="Signature Patchi and Bostani chocolate boxes paired with fresh roses"
              products={sectionProducts.chocolate}
              categoryFilter="ورد وشوكولاتة بلجيكية فاخرة"
              limit={6}
              layout="slider"
            />

            {/* 10. Section: ورد و كيك (6 Products) */}
            <ProductSectionSlider
              title="ورد و كيك"
              titleEn="Roses & Gourmet Celebration Cakes"
              subtitle="كيك كوري خاص وكعكات الريد فيلفيت الطازجة لمناسبات أعياد الميلاد والتخرج"
              subtitleEn="Korean lunchbox cakes and artisan bakery paired with celebratory bouquets"
              products={sectionProducts.cake}
              categoryFilter="ورد و كيك"
              limit={6}
              layout="slider"
            />

            {/* 11. Section: ورد و قهوة و حلا (6 Products) */}
            <ProductSectionSlider
              title="ورد و قهوة و حلا"
              titleEn="Roses, Arabic Coffee & Sweets"
              subtitle="أصالة الضيافة الحجازية مع القهوة العربية والتمور المحشوة والحلويات"
              subtitleEn="Authentic Hijazi hospitality blending Arabic cardamom coffee with blooms"
              products={sectionProducts.coffee}
              categoryFilter="ورد و قهوة و حلا"
              limit={6}
              layout="slider"
            />

            {/* 12. Section: فازات ورود طبيعية (6 Products) */}
            <ProductSectionSlider
              title="فازات ورود طبيعية"
              titleEn="Natural Flower Vases"
              subtitle="فازات كريستالية وسيراميك راقية تدوم طويلاً لتزيين المجالس والمكاتب"
              subtitleEn="Hand-cut crystal and fluted ceramic vases elevating homes and offices"
              products={sectionProducts.vases}
              categoryFilter="فازات ورود طبيعية"
              limit={6}
              layout="slider"
            />

            {/* 13. Section: لوحات مواجيب وتراث حجازي */}
            <ProductSectionSlider
              title="لوحات مواجيب وتراث حجازي"
              titleEn="Mawajeeb Wooden Plaques & Heritage"
              subtitle="لوحات تذكارية وتراث حجازي عريق مع ورد وبخور مروكي فاخر"
              subtitleEn="Hand-carved wooden heritage plaques with authentic Maroki oud and fresh roses"
              products={sectionProducts.mawajeeb}
              categoryFilter="لوحات مواجيب"
              limit={4}
              layout="grid"
            />

            {/* 13. Top 4 TikTok & Snapchat Social Media Video Reels */}
            <SocialReelsSection />

            {/* 14. Real Video Section: هدايا فريدة بروح الحجاز */}
            <VideoSection />

            {/* 15. Store Features with Animated Icons */}
            <StoreFeaturesBar />

            {/* 16. Metrics & Social Proof */}
            <MetricsSection />

            {/* 17. Real Mecca Gifts Testimonials */}
            <TestimonialsSection />

            {/* 18. FAQ Section */}
            <FaqSection />

            {/* 19. Sculptural Mecca Gifts Articles & Journal */}
            <MagazineSection />

            {/* 20. VIP Newsletter Subscription */}
            <NewsletterSection />
          </>
        )}

        {currentPage === 'catalog' && <CatalogPage />}
        {currentPage === 'product' && <ProductDetailPage />}
        {currentPage === 'cart' && <CartPage />}
        {currentPage === 'checkout' && <CheckoutPage />}
        {currentPage === 'thankyou' && <ThankYouPage />}
        {currentPage === 'crm' && <UserCrmPage />}
      </main>

      {/* Luxury Emerald Footer with Tax ID & Platform Verification */}
      <Footer />

      {/* Mobile-First Sticky Bottom Nav */}
      <MobileBottomNav />

      {/* Floating WhatsApp Concierge Button — Public storefront only, never in Admin Dashboard */}
      {!isAdmin && <WhatsAppFloatingButton isAdmin={isAdmin} />}
    </div>
  );
};

export const MeccaGiftsThemeView: React.FC<MeccaGiftsThemeViewProps> = (props) => {
  return (
    <AppProvider>
      <MeccaGiftsInner {...props} />
    </AppProvider>
  );
};
