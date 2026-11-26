import React, { Suspense, lazy, useState, useMemo, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { HeroSlider3D } from './HeroSlider3D';
import { CoffeeHomeModules } from './CoffeeHomeModules';
import { CoffeeFeatureIconsBar, featureItemsForDevice } from './CoffeeFeatureIconsBar';
import { ExclusivePerksBar } from './ExclusivePerksBar';
import { CoffeeEventsSection } from './CoffeeEventsSection';
import { CoffeeFeaturesSection } from './CoffeeFeaturesSection';
import { CoffeeModelComparisonSection } from './CoffeeModelComparisonSection';
import { CoffeeCustomerReviewsHome } from './CoffeeCustomerReviewsHome';
import { CoffeeFaqSection } from './CoffeeFaqSection';
import { CoffeeCommercialHeroSection } from './CoffeeCommercialHeroSection';
import { CoffeeProductSliderSection } from './CoffeeProductSliderSection';
import { CoffeeProductCollectionSection } from './CoffeeProductCollectionSection';
import { CoffeeEquipmentRailSection } from './CoffeeEquipmentRailSection';

const FlagshipThreeJsSection = lazy(() =>
  import('./FlagshipThreeJsSection').then((m) => ({ default: m.FlagshipThreeJsSection })),
);

export const HomePage: React.FC = () => {
  const { navigateTo, language, products, storeIdentity, addToCart } = useCart();
  const { activeStore } = useTenant();
  const [settingsVersion, setSettingsVersion] = useState(0);

  useEffect(() => {
    const handleSync = () => setSettingsVersion((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'UNITYTECK_PREVIEW_SYNC') handleSync();
    });
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
    };
  }, []);

  const themeSettings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, settingsVersion]);


  const heroMode = themeSettings?.heroBanners?.contentMode || 'full';
  // `both` = image-only full-bleed strip only — never stack the legacy text+coffee-machine hero.
  const showImageOnlyHero = heroMode === 'image_only' || heroMode === 'both';
  const showFullHero = heroMode === 'full';

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-20 selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-clip">
      {/* Dual coffee heroes: image-only and/or full text+buttons (Customize Themes → C-HERO) */}
      {showImageOnlyHero ? (
        <HeroSlider3D variant="home" forceContentMode="image_only" bannersKey="imageOnlyBanners" />
      ) : null}
      {showFullHero ? (
        <HeroSlider3D variant="home" forceContentMode="full" bannersKey="banners" />
      ) : null}

      {showImageOnlyHero ? (
        <div className="w-full max-w-full bg-gradient-to-b from-[#0c0c0c] via-[#1a1a1c] to-[#cfcfd3] h-3 sm:h-4" aria-hidden />
      ) : null}

      {/* Commercial Hero (C-COMM) — ≠ Hero Banners / FSB; empty slides hide */}
      <CoffeeCommercialHeroSection
        settings={themeSettings?.commercialHero}
        lang={language === 'AR' ? 'ar' : 'en'}
        onBuyNow={(slide) => {
          if (slide.productId) navigateTo('product-buy', slide.productId);
          else navigateTo('products');
        }}
        onAddToCart={(slide) => {
          if (!slide.productId) return;
          const p = (products || []).find((row) => row.id === slide.productId);
          if (p) addToCart(p);
        }}
      />

      {/* Product Slider (C-PSL) — PNG product shots below hero; empty hides */}
      <CoffeeProductSliderSection
        settings={themeSettings?.productSlider}
        catalog={products || []}
        lang={language === 'AR' ? 'ar' : 'en'}
        onBuyNow={(id) => navigateTo('product-buy', id)}
        onOpenProduct={(id) => navigateTo('product-detail', id)}
        onAddToCart={(id) => {
          const p = (products || []).find((row) => row.id === id);
          if (p) addToCart(p);
        }}
      />

      {/* Product Collection (C-COLL) — promo + products + benefits; ≠ slider / PCB */}
      <CoffeeProductCollectionSection
        settings={themeSettings?.productCollection}
        catalog={products || []}
        lang={language === 'AR' ? 'ar' : 'en'}
        onBuyNow={(id) => navigateTo('product-buy', id)}
        onOpenProduct={(id) => navigateTo('product-detail', id)}
        onAddToCart={(id) => {
          const p = (products || []).find((row) => row.id === id);
          if (p) addToCart(p);
        }}
        onPromoClick={(url) => {
          if (url.startsWith('http')) window.open(url, '_blank', 'noopener,noreferrer');
          else navigateTo('products');
        }}
      />

      {/* 2. Key Products Showcase — lazy so customizer/home first paint stays light */}
      <Suspense fallback={<div className="w-full min-h-[240px] bg-[#F9F9F9]" aria-hidden />}>
        <div data-customize-section="C-FSB">
          <FlagshipThreeJsSection />
        </div>
      </Suspense>

      <CoffeeEquipmentRailSection themeSettings={themeSettings} />
      {/* Theme Settings modules (C-IMG / C-PC / C-BAN / C-PCB) — same look, editable via Customize Themes */}
      <CoffeeHomeModules settings={themeSettings} />

      {/* Exclusive benefits (C-BEN) */}
      {themeSettings?.exclusiveBenefits?.enabled !== false && <ExclusivePerksBar />}

      {/* 5. Events & Masterclasses — C-EVT / eventsMasterclasses only (DF-01: no HONOR/Mixkit invent) */}
      <CoffeeEventsSection settings={themeSettings?.eventsMasterclasses} />

      {/* Features Section (C-FEAT) — ≠ Feature Icons; empty hides */}
      <CoffeeFeaturesSection
        settings={themeSettings?.featuresSection}
        lang={language === 'AR' ? 'ar' : 'en'}
      />

      {/* Model Comparison (C-CMP) — settings models only; empty hides */}
      <CoffeeModelComparisonSection
        settings={themeSettings?.modelComparison}
        lang={language === 'AR' ? 'ar' : 'en'}
      />

      {/* Customer Reviews (C-REV) — chrome from settings; rows from reviews API */}
      <CoffeeCustomerReviewsHome settings={themeSettings?.customerReviews} />

      {/* FAQ (C-FAQ) — bilingual Q/A from theme settings only */}
      <CoffeeFaqSection
        settings={themeSettings?.faq}
        lang={language === 'AR' ? 'ar' : 'en'}
      />

      {/* 6. Feature icons (C-ICON) — settings only; empty hides (DF-01) */}
      {featureItemsForDevice(themeSettings?.enhancedFeatures, 'responsive').length > 0 ? (
        <CoffeeFeatureIconsBar
          settings={themeSettings?.enhancedFeatures}
          lang={language === 'AR' ? 'ar' : 'en'}
          device="responsive"
          phone={
            storeIdentity?.whatsapp ||
            (activeStore as any)?.whatsapp ||
            storeIdentity?.phone ||
            activeStore?.phone ||
            ''
          }
        />
      ) : null}
    </div>
  );
};

