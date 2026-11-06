import React, { Suspense, lazy, type ComponentType } from 'react';

type FormProps = { onBack?: () => void; embedded?: boolean };

type Loader = () => Promise<{ default: ComponentType<FormProps> }>;

const loaders: Record<string, Loader> = {
  '00_header_builder': () =>
    import('../themeSettings/HeaderElementsForm').then((m) => ({ default: m.HeaderElementsForm })),
  '01_store_identity': () =>
    import('../themeSettings/StoreIdentityForm').then((m) => ({ default: m.StoreIdentityForm })),
  '02_general_options': () =>
    import('../themeSettings/GeneralOptionsForm').then((m) => ({ default: m.GeneralOptionsForm })),
  '03_store_colors': () =>
    import('../themeSettings/StoreColorsForm').then((m) => ({ default: m.StoreColorsForm })),
  '04_category_cart_customer': () =>
    import('../themeSettings/CategoryCartCustomerForm').then((m) => ({
      default: m.CategoryCartCustomerForm,
    })),
  '05_advanced_slider': () =>
    import('../themeSettings/AdvancedSliderForm').then((m) => ({ default: m.AdvancedSliderForm })),
  '06_product_videos': () =>
    import('../themeSettings/ProductVideosForm').then((m) => ({ default: m.ProductVideosForm })),
  '07_product_tabs': () =>
    import('../themeSettings/ProductTabsForm').then((m) => ({ default: m.ProductTabsForm })),
  '08_detailed_products': () =>
    import('../themeSettings/DetailedProductsForm').then((m) => ({ default: m.DetailedProductsForm })),
  '09_image_grid': () =>
    import('../themeSettings/ImageGridForm').then((m) => ({ default: m.ImageGridForm })),
  '10_custom_links': () =>
    import('../themeSettings/CustomLinksForm').then((m) => ({ default: m.CustomLinksForm })),
  '11_banners': () =>
    import('../themeSettings/BannersForm').then((m) => ({ default: m.BannersForm })),
  '12_blog': () => import('../themeSettings/BlogForm').then((m) => ({ default: m.BlogForm })),
  '13_announcement_bar': () =>
    import('../themeSettings/AnnouncementBarForm').then((m) => ({ default: m.AnnouncementBarForm })),
  '14_enhanced_features': () =>
    import('../themeSettings/EnhancedFeaturesForm').then((m) => ({
      default: m.EnhancedFeaturesForm,
    })),
  '15_product_cards': () =>
    import('../themeSettings/ProductCardsForm').then((m) => ({ default: m.ProductCardsForm })),
  '16_custom_products': () =>
    import('../themeSettings/CustomProductsForm').then((m) => ({ default: m.CustomProductsForm })),
  '17_special_offer_countdown': () =>
    import('../themeSettings/SpecialOfferCountdownForm').then((m) => ({
      default: m.SpecialOfferCountdownForm,
    })),
  '18_store_statistics': () =>
    import('../themeSettings/StoreStatisticsForm').then((m) => ({ default: m.StoreStatisticsForm })),
  '19_custom_code': () =>
    import('../themeSettings/CustomCodeForm').then((m) => ({ default: m.CustomCodeForm })),

  'C-ANN': () =>
    import('../themeSettings/coffee/CoffeeAnnouncementsForm').then((m) => ({
      default: m.CoffeeAnnouncementsForm,
    })),
  'C-FCP': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.FeaturedCategoriesProductsForm,
    })),
  'C-HERO': () =>
    import('../themeSettings/coffee/CoffeeHeroBannersForm').then((m) => ({
      default: m.HeroBannersForm,
    })),
  'C-FSB': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.FeaturedSectionBannersForm,
    })),
  'C-FP': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.FeaturedProductsForm,
    })),
  'C-SHOP': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.CatalogControlsForm,
    })),
  'C-IMG': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.ImageBannersForm,
    })),
  'C-FOOT': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.CoffeeFooterForm,
    })),
  'C-ICON': () =>
    import('../themeSettings/coffee/CoffeeFeatureIconsForm').then((m) => ({
      default: m.CoffeeFeaturesForm,
    })),
  'C-BEN': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.ExclusiveBenefitsForm,
    })),
  'C-PC': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.ProductCarouselForm,
    })),
  'C-PCB': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.ProductCarouselBannerForm,
    })),
  'C-EDIT': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.CoffeeProductEditForm,
    })),
  'C-NEWS': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.NewsletterForm,
    })),
  'C-CPB': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.CustomOrderBuilderForm,
    })),
  'C-REV': () =>
    import('../themeSettings/coffee/CoffeeSectionForms').then((m) => ({
      default: m.CoffeeReviewsForm,
    })),
};

const lazyCache = new Map<string, React.LazyExoticComponent<ComponentType<FormProps>>>();

function getLazyForm(sectionId: string) {
  const existing = lazyCache.get(sectionId);
  if (existing) return existing;
  const loader = loaders[sectionId];
  if (!loader) return null;
  const Lazy = lazy(loader);
  lazyCache.set(sectionId, Lazy);
  return Lazy;
}

function FormFallback({ isAr }: { isAr: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 animate-pulse space-y-3">
      <div className="h-4 w-2/5 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-800/80" />
      <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
      <p className="text-[11px] font-bold text-slate-400">
        {isAr ? 'جاري تحميل لوحة التخصيص…' : 'Loading customizer panel…'}
      </p>
    </div>
  );
}

export const CustomizerSectionForm: React.FC<{ sectionId: string; isAr: boolean; onBack?: () => void }> = ({
  sectionId,
  isAr,
  onBack,
}) => {
  const LazyForm = getLazyForm(sectionId);
  if (!LazyForm) return null;
  return (
    <Suspense fallback={<FormFallback isAr={isAr} />}>
      {/* embedded: compact layout inside WordPress customizer sidebar */}
      <LazyForm onBack={onBack} embedded />
    </Suspense>
  );
};
