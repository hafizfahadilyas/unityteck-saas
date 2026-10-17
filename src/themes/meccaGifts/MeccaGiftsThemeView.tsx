import React, { useState, useEffect, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Product } from './index';
import { Header } from './components/Header';
import { MotionHeroSlider } from './components/MotionHeroSlider';
import { StoreFeaturesBar } from './components/StoreFeaturesBar';
import { TopCircularCategories } from './components/TopCircularCategories';
import { BestSellersSection } from './components/BestSellersSection';
import { PromoCountdownBanner } from './components/PromoCountdownBanner';
import { DiscountedBouquets3DGallery } from './components/DiscountedBouquets3DGallery';
import { ShopByCategorySection } from './components/ShopByCategorySection';
import { FeaturedCollectionsSection } from './components/FeaturedCollectionsSection';
import { OccasionAndWhyUsSection } from './components/OccasionAndWhyUsSection';
import { CustomGiftBanner } from './components/CustomGiftBanner';
import { TrendingThisWeekSection } from './components/TrendingThisWeekSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ProductSectionSlider } from './components/ProductSectionSlider';
import { PromoBannersPair } from './components/PromoBannersPair';
import { FaqSection } from './components/FaqSection';
import { OfferVideoBanner } from './components/OfferVideoBanner';
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
import { getLiveOrStoredBlocks, ThemeBlockElement } from '../../services/liveThemeSyncService';

interface MeccaGiftsThemeViewProps {
  initialPage?: string;
  onOpenStoreDashboard?: () => void;
  isAdmin?: boolean;
}

const MeccaGiftsInner: React.FC<MeccaGiftsThemeViewProps> = ({ initialPage, isAdmin = false }) => {
  const { currentPage, setCurrentPage, toastMessage, isAuthModalOpen, setIsAuthModalOpen, setLanguage, products } = useApp();
  const { locale } = usePrefs();
  const { activeStore } = useTenant();
  const [isAdminBypass, setIsAdminBypass] = useState(false);
  const [blocksTick, setBlocksTick] = useState(0);

  // Live reactivity: listen to page builder publishes and storage sync
  useEffect(() => {
    const handleSync = () => setBlocksTick((t) => t + 1);
    window.addEventListener('unityteck-theme-builder-published', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('unityteck-theme-builder-published', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const activeBlocks = useMemo(() => {
    return getLiveOrStoredBlocks(activeStore.id, 'theme-flora-luxe', activeStore).filter(
      (b) => b.visible !== false && b.type !== 'header' && b.type !== 'footer'
    );
  }, [activeStore.id, activeStore, blocksTick]);

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
      discounted: filterByKeywords(['مخفض', 'عرض', 'خصم', 'promo', 'discount'], DISCOUNTED_BOUQUETS, 6),
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

  const renderSectionBlock = (b: ThemeBlockElement) => {
    switch (b.type) {
      case 'hero_slider':
      case 'hero':
        return <MotionHeroSlider key={b.id} />;
      case 'store_features_bar':
      case 'features':
        return <StoreFeaturesBar key={b.id} />;
      case 'circle_categories':
        return <TopCircularCategories key={b.id} />;
      case 'best_sellers':
        return <BestSellersSection key={b.id} />;
      case 'promo_countdown_banner':
      case 'special_offer':
        return <PromoCountdownBanner key={b.id} />;
      case 'discounted_bouquets_3d':
        return <DiscountedBouquets3DGallery key={b.id} products={sectionProducts.discounted} />;
      case 'sec_natural_flowers':
      case 'product_section_natural':
        return (
          <ProductSectionSlider
            key={b.id}
            title={locale === 'ar' ? (b.settings?.titleAr || 'باقات الورود الطبيعية') : (b.settings?.titleEn || 'Natural Fresh Flower Bouquets')}
            titleEn={b.settings?.titleEn || 'Natural Fresh Flower Bouquets'}
            subtitle={locale === 'ar' ? (b.settings?.subtitleAr || 'أجود أنواع الجوري الهولندي والإكوادوري المنسق بأيدي أمهر الخبراء') : (b.settings?.subtitleEn || 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists')}
            subtitleEn={b.settings?.subtitleEn || 'Finest Dutch and Ecuadorian long-stem roses tailored by master florists'}
            products={sectionProducts.natural}
            categoryFilter="باقات الورود الطبيعية"
            limit={b.settings?.limit || 6}
            layout={b.settings?.layout || 'slider'}
          />
        );
      case 'sec_chocolate_roses':
      case 'product_section_chocolate':
        return (
          <ProductSectionSlider
            key={b.id}
            title={locale === 'ar' ? (b.settings?.titleAr || 'ورد وشوكولاتة بلجيكية فاخرة') : (b.settings?.titleEn || 'Roses & Luxury Belgian Chocolates')}
            titleEn={b.settings?.titleEn || 'Roses & Luxury Belgian Chocolates'}
            subtitle={locale === 'ar' ? (b.settings?.subtitleAr || 'أفخم تشكيلات باتشي وبستاني المنسقة مع باقات الجوري الساحرة') : (b.settings?.subtitleEn || 'Signature Patchi and Bostani chocolate boxes paired with fresh roses')}
            subtitleEn={b.settings?.subtitleEn || 'Signature Patchi and Bostani chocolate boxes paired with fresh roses'}
            products={sectionProducts.chocolate}
            categoryFilter="ورد وشوكولاتة بلجيكية فاخرة"
            limit={b.settings?.limit || 6}
            layout={b.settings?.layout || 'slider'}
          />
        );
      case 'sec_luxury_gifts':
      case 'product_section_luxury':
        return (
          <ProductSectionSlider
            key={b.id}
            title={locale === 'ar' ? (b.settings?.titleAr || 'هدايا ملكية فاخرة (رجالية ونسائية)') : (b.settings?.titleEn || 'Royal Luxury Gift Sets (Men & Women)')}
            titleEn={b.settings?.titleEn || 'Royal Luxury Gift Sets (Men & Women)'}
            subtitle={locale === 'ar' ? (b.settings?.subtitleAr || 'أطقم هدايا استثنائية تضم عطوراً فاخرة، ساعات، أطقم مجوهرات وباقات زهور نضرة') : (b.settings?.subtitleEn || 'Signature executive and feminine luxury gift sets with blooms and fine accessories')}
            subtitleEn={b.settings?.subtitleEn || 'Signature executive and feminine luxury gift sets with blooms and fine accessories'}
            products={sectionProducts.luxury}
            categoryFilter="هدايا رجالية"
            limit={b.settings?.limit || 6}
            layout={b.settings?.layout || 'slider'}
          />
        );
      case 'trending_this_week':
        return <TrendingThisWeekSection key={b.id} />;
      case 'occasion_why_us':
        return <OccasionAndWhyUsSection key={b.id} />;
      case 'custom_gift_banner':
        return <CustomGiftBanner key={b.id} />;
      case 'promo_banners_pair':
        return <PromoBannersPair key={b.id} />;
      case 'featured_collections':
      case 'metrics_section':
        return <FeaturedCollectionsSection key={b.id} />;
      case 'reviews':
      case 'testimonials':
        return <TestimonialsSection key={b.id} />;
      case 'faq':
        return <FaqSection key={b.id} />;
      case 'offer_video_banner':
        return <OfferVideoBanner key={b.id} />;
      case 'magazine_section':
        return <MagazineSection key={b.id} />;
      case 'shop_by_category':
        return <ShopByCategorySection key={b.id} />;
      default:
        return null;
    }
  };

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
      <Header customSettings={themeSettings.customHeader} />

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
            {activeBlocks.map((b) => renderSectionBlock(b))}
          </>
        )}

        {currentPage === 'catalog' && <CatalogPage />}
        {currentPage === 'product' && <ProductDetailPage />}
        {currentPage === 'cart' && <CartPage />}
        {currentPage === 'checkout' && <CheckoutPage />}
        {currentPage === 'thankyou' && <ThankYouPage />}
        {currentPage === 'crm' && <UserCrmPage />}
      </main>

      {/* Luxury Emerald Footer matching Image 2 */}
      <Footer />

      {/* Mobile-First Sticky Bottom Nav */}
      <MobileBottomNav />

      {/* Floating WhatsApp Concierge Button */}
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
