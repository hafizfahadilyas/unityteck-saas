/**
 * Coffee page-builder preview — maps Word/canonical block types to the same
 * live HiBrew storefront components + theme settings (store-coffee only).
 * Theme Settings hub stays separate (WP Customize); this is Elementor canvas.
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Header as CoffeeHeader } from '../../../themes/coffeeRoasters/components/Header';
import { Footer as CoffeeFooter } from '../../../themes/coffeeRoasters/components/Footer';
import { HeroSlider3D as CoffeeHeroSlider3D } from '../../../themes/coffeeRoasters/components/HeroSlider3D';
import { FlagshipThreeJsSection as CoffeeFlagshipSection } from '../../../themes/coffeeRoasters/components/FlagshipThreeJsSection';
import { CoffeeHomeModules } from '../../../themes/coffeeRoasters/components/CoffeeHomeModules';
import { ExclusivePerksBar } from '../../../themes/coffeeRoasters/components/ExclusivePerksBar';
import {
  announcementMessageLabel,
  eligibleAnnouncements,
  type AllThemeSettings,
} from '../../../themes/settings/themeSettingsStore';
import { bi } from '../../../themes/settings/coffeeModularSettings';
import { resolveCoffeeThemeSettings } from '../../../themes/settings/coffeeThemeDefaults';
import { CoffeeFeatureIconsBar, featureItemsForDevice } from '../../../themes/coffeeRoasters/components/CoffeeFeatureIconsBar';
import { CartProvider as CoffeeCartProvider, useCart } from '../../../themes/coffeeRoasters/context/CartContext';
import { ReviewsWidget } from './widgets/ContentWidget';
import { subscribeStoreNewsletter } from '../../../api/tenantApi';

type BuilderDevice = 'desktop' | 'laptop' | 'tablet' | 'mobile';

function productThumb(p: { images?: string[]; colors?: { image?: string }[]; image?: string }): string {
  return p.colors?.[0]?.image || p.images?.[0] || p.image || '';
}

function matchCategory(category: string | undefined, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const cat = (category || '').toLowerCase().trim();
  const id = categoryId.toLowerCase().trim();
  if (!cat) return false;
  if (cat === id || cat.includes(id) || id.includes(cat)) return true;
  // Live catalog often stores Arabic/EN display labels instead of seed ids
  const aliases: Record<string, string[]> = {
    machines: ['machine', 'espresso', 'مكائن', 'اسبريسو', 'إسبريسو'],
    mills: ['mill', 'grinder', 'مطاحن', 'مطحنة'],
    cabinets: ['cabinet', 'bar', 'خزائن', 'خزانة', 'أركان', 'دواليب'],
    accessories: ['accessor', 'barista', 'مستلزم', 'أكواب', 'إكسسوار'],
    offers: ['offer', 'bundle', 'عروض', 'باقات'],
  };
  const keys = aliases[id] || [id];
  return keys.some((k) => cat.includes(k));
}

function productLabel(isAr: boolean, p: { name?: string; nameAr?: string }): string {
  if (isAr) return (p.nameAr || '').trim();
  return (p.name || '').trim();
}

export const COFFEE_FULL_BLEED_TYPES = new Set([
  'announcement_bar',
  'announcement',
  'header',
  'navbar',
  'hero_banners',
  'hero_slider',
  'hero',
  'footer',
]);

export const COFFEE_BUILDER_BLOCK_TYPES = new Set([
  ...COFFEE_FULL_BLEED_TYPES,
  'featured_categories_products',
  'featured_section_banners',
  'featured_products',
  'image_banners',
  'store_features_bar',
  'features',
  'exclusive_benefits',
  'product_carousel',
  // 'banners' / C-BAN stacked strip removed from HiBrew
  'product_carousel_banner',
  'newsletter',
  'custom_order',
  'reviews',
  'testimonials',
]);

function useCoffeeThemeSettings(store: { id?: string; name?: string } | null | undefined): AllThemeSettings | null {
  const [ver, setVer] = useState(0);
  useEffect(() => {
    const sync = () => setVer((v) => v + 1);
    window.addEventListener('unityteck-theme-settings', sync);
    return () => window.removeEventListener('unityteck-theme-settings', sync);
  }, []);
  return useMemo(() => {
    try {
      if (!store?.id) return null;
      return resolveCoffeeThemeSettings(store.id, store as any);
    } catch {
      return null;
    }
  }, [store, ver]);
}

/** Same light HiBrew shell as storefront — no colors.* page paint (UI locked). */
const Shell: React.FC<{ children: React.ReactNode; settings?: AllThemeSettings | null }> = ({
  children,
}) => (
  <div className="hibrew-theme-root coffee-builder-preview w-full max-w-full min-h-0 bg-white text-neutral-900">
    {children}
  </div>
);

function AnnouncementFromSettings({
  settings,
  isAr,
}: {
  settings: AllThemeSettings | null;
  isAr: boolean;
}) {
  const bar = settings?.announcementBar;
  if (!bar?.enabled) {
    // Compact — never a tall dark empty slab in the canvas
    return (
      <div className="w-full py-2 px-3 text-center text-[11px] text-neutral-400 bg-neutral-50 border-b border-neutral-100">
        {isAr ? 'شريط الإعلان معطّل' : 'Announcement bar off'}
      </div>
    );
  }
  const eligible = eligibleAnnouncements(bar);
  if (!eligible.length) {
    return (
      <div className="w-full py-2 px-3 text-center text-[11px] text-neutral-400 bg-neutral-50 border-b border-neutral-100">
        {isAr ? 'لا إعلانات مؤهلة' : 'No eligible announcements'}
      </div>
    );
  }
  const locale = isAr ? 'ar' : 'en';
  if (bar.displayMode === 'stacked') {
    return (
      <div className="w-full">
        {eligible.map((m) => (
          <div
            key={m.id}
            className="w-full text-xs font-bold py-2.5 px-4 text-center"
            style={{ background: m.bgColor || bar.bgColor, color: m.textColor || bar.textColor }}
          >
            {announcementMessageLabel(m, locale)}
          </div>
        ))}
      </div>
    );
  }
  const m = eligible[0];
  return (
    <div
      className="w-full text-xs font-bold py-2.5 px-4 text-center"
      style={{ background: m.bgColor || bar.bgColor, color: m.textColor || bar.textColor }}
    >
      {announcementMessageLabel(m, locale)}
    </div>
  );
}

function FeaturedCategoriesPreview({
  settings,
  isAr,
}: {
  settings: AllThemeSettings | null;
  isAr: boolean;
}) {
  const { products } = useCart();
  const lang = isAr ? 'ar' : 'en';
  const section = settings?.featuredCategoriesProducts;
  const sections = (section?.enabled ? section.sections : []).filter((s) => s.enabled !== false);
  if (!sections.length) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        {isAr
          ? 'لا أقسام تصنيفات بعد — أضفها من تخصيص الثيم'
          : 'No featured category sections yet — add them in Customize Themes'}
      </div>
    );
  }
  const first = sections[0];
  const cats = (first.categories || []).filter((c) => c.enabled !== false);
  const count = first.productCount || 4;
  const catalog = products || [];
  const resolved = (() => {
    if (first.productSource === 'selected' && first.productIds?.length) {
      const picked = first.productIds
        .map((id) => catalog.find((p) => p.id === id))
        .filter(Boolean)
        .slice(0, count) as typeof catalog;
      if (picked.length) return picked;
    }
    const categoryId =
      cats.find((c) => c.categoryId)?.categoryId ||
      cats[0]?.categoryId ||
      'all';
    const byCat = catalog.filter((p) => matchCategory(p.category, categoryId)).slice(0, count);
    if (byCat.length) return byCat;
    // Fallback: show latest catalog items so builder never shows empty stubs
    return catalog.slice(0, count);
  })();

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">
        {bi(lang, first.titleEn, first.titleAr, isAr ? 'التصنيفات والمنتجات' : 'Featured Categories & Products')}
      </h2>
      {(isAr ? first.descriptionAr : first.descriptionEn) && (
        <p className="text-sm text-neutral-500 text-center mb-6">
          {bi(lang, first.descriptionEn, first.descriptionAr)}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {cats.map((c) => (
          <span key={c.id} className="px-4 py-2 rounded-full bg-neutral-100 text-sm font-semibold">
            {bi(lang, c.labelEn, c.labelAr)}
          </span>
        ))}
      </div>
      {resolved.length === 0 ? (
        <div className="p-6 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
          {isAr ? 'لا منتجات مطابقة لهذا التصنيف بعد' : 'No matching products for this category yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {resolved.map((p) => {
            const img = productThumb(p);
            const label = productLabel(isAr, p);
            return (
              <div
                key={p.id}
                className="rounded-2xl bg-[#F9F9F9] border border-neutral-100 p-3 sm:p-4 min-h-[160px] flex flex-col items-center justify-center"
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-28 object-contain mb-3" />
                ) : (
                  <div className="w-full h-28 rounded-xl bg-neutral-200/60 mb-3" />
                )}
                {label ? (
                  <span className="text-xs font-bold text-neutral-700 text-center line-clamp-2">{label}</span>
                ) : null}
                {first.showPrice !== false && (
                  <span className="text-[10px] text-neutral-500 mt-1">
                    {isAr ? `${Number(p.basePrice || 0).toLocaleString()}ر.س` : `SAR ${Number(p.basePrice || 0).toLocaleString()}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {first.showViewMore && (
        <div className="text-center mt-6">
          <span className="inline-flex px-5 py-2 rounded-full bg-black text-white text-xs font-bold">
            {bi(lang, first.viewMoreEn, first.viewMoreAr, isAr ? 'عرض المزيد' : 'View More')}
          </span>
        </div>
      )}
    </section>
  );
}

function FeaturedProductsPreview({
  settings,
  isAr,
}: {
  settings: AllThemeSettings | null;
  isAr: boolean;
}) {
  const { products } = useCart();
  const lang = isAr ? 'ar' : 'en';
  const fp = settings?.featuredProducts;
  if (!fp?.enabled) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        {isAr ? 'قسم المنتجات المميزة معطّل' : 'Featured products section disabled'}
      </div>
    );
  }
  const tabs = (fp.tabs || []).filter((t) => t.enabled !== false);
  const activeTab = tabs[0];
  const count = fp.productCount || 4;
  const catalog = products || [];
  const categoryId = activeTab?.categoryId || 'all';
  const byCat = catalog.filter((p) => matchCategory(p.category, categoryId)).slice(0, count);
  const resolved = byCat.length ? byCat : catalog.slice(0, count);

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-center">
        {bi(lang, fp.titleEn, fp.titleAr, isAr ? 'المنتجات المميزة' : 'Featured Products')}
      </h2>
      {(isAr ? fp.descriptionAr : fp.descriptionEn) && (
        <p className="text-sm text-neutral-500 text-center mt-1 mb-5">
          {bi(lang, fp.descriptionEn, fp.descriptionAr)}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {tabs.map((t) => (
          <span key={t.id} className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-sm font-semibold shadow-sm">
            {bi(lang, t.labelEn, t.labelAr)}
          </span>
        ))}
      </div>
      {resolved.length === 0 ? (
        <div className="p-6 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
          {isAr ? 'لا منتجات مميزة بعد' : 'No featured products yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {resolved.map((p) => {
            const img = productThumb(p);
            const label = productLabel(isAr, p);
            return (
              <div key={p.id} className="rounded-2xl bg-white border border-neutral-100 p-3 sm:p-4 min-h-[180px] flex flex-col items-center">
                {img ? (
                  <img src={img} alt="" className="h-28 w-full object-contain mb-3" />
                ) : (
                  <div className="h-28 w-full rounded-xl bg-neutral-100 mb-3" />
                )}
                {label ? <div className="text-xs font-bold text-center line-clamp-2">{label}</div> : null}
                {fp.showPrice !== false ? (
                <div className="text-[10px] text-neutral-500 mt-1">
                  {isAr ? `${Number(p.basePrice || 0).toLocaleString()}ر.س` : `SAR ${Number(p.basePrice || 0).toLocaleString()}`}
                </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeaturesPreview({ settings, isAr }: { settings: AllThemeSettings | null; isAr: boolean }) {
  const feat = settings?.enhancedFeatures;
  if (!featureItemsForDevice(feat, 'responsive').length) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        {isAr ? 'أيقونات المميزات فارغة' : 'Feature icons empty'}
      </div>
    );
  }
  return <CoffeeFeatureIconsBar settings={feat} lang={isAr ? 'ar' : 'en'} device="responsive" />;
}

function NewsletterPreview({ settings, isAr, storeId }: { settings: AllThemeSettings | null; isAr: boolean; storeId: string }) {
  const n = settings?.newsletter;
  if (!n?.enabled) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        {isAr ? 'النشرة معطّلة' : 'Newsletter disabled'}
      </div>
    );
  }
  return (
    <section className="w-full max-w-[900px] mx-auto px-4 py-10 text-center">
      <h2 className="text-2xl font-bold">{bi(isAr ? 'ar' : 'en', n.titleEn, n.titleAr)}</h2>
      <p className="text-sm text-neutral-500 mt-2 mb-4">{bi(isAr ? 'ar' : 'en', n.subtitleEn, n.subtitleAr)}</p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
        <input
          id={`news-${storeId}`}
          placeholder={bi(isAr ? 'ar' : 'en', n.placeholderEn, n.placeholderAr) || (isAr ? 'البريد الإلكتروني' : 'Email')}
          className="flex-1 px-4 py-2.5 rounded-full border border-neutral-200 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById(`news-${storeId}`) as HTMLInputElement | null;
            const email = input?.value || '';
            if (email) void subscribeStoreNewsletter(storeId, email);
          }}
          className="px-5 py-2.5 rounded-full bg-black text-white text-xs font-bold"
        >
          {bi(isAr ? 'ar' : 'en', n.buttonEn, n.buttonAr) || (isAr ? 'اشترك' : 'Subscribe')}
        </button>
      </div>
    </section>
  );
}

function CustomOrderPreview({ settings, isAr }: { settings: AllThemeSettings | null; isAr: boolean }) {
  const c = settings?.customOrder;
  if (!c?.enabled) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        {isAr ? 'طلب مخصص معطّل' : 'Custom order disabled'}
      </div>
    );
  }
  return (
    <section className="w-full max-w-[720px] mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold text-center">{bi(isAr ? 'ar' : 'en', c.titleEn, c.titleAr)}</h2>
      <p className="text-sm text-neutral-500 text-center mt-2 mb-6">{bi(isAr ? 'ar' : 'en', c.subtitleEn, c.subtitleAr)}</p>
      <div className="space-y-3">
        {(c.fields || []).filter((f) => f.enabled !== false).map((f) => (
          <div key={f.id} className="rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-500">
            {bi(isAr ? 'ar' : 'en', f.labelEn, f.labelAr)}
            {f.required ? ' *' : ''}
          </div>
        ))}
      </div>
      <button type="button" className="mt-5 w-full py-3 rounded-full bg-[#25D366] text-white text-xs font-bold">
        {bi(isAr ? 'ar' : 'en', c.ctaEn, c.ctaAr) || 'WhatsApp'}
      </button>
    </section>
  );
}

function ReviewsPreview({ isAr, storeId }: { isAr: boolean; storeId: string }) {
  return (
    <section className="w-full max-w-[1100px] mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-2 text-center">{isAr ? 'تقييمات العملاء' : 'Customer reviews'}</h2>
      <ReviewsWidget isAr={isAr} storeId={storeId} />
    </section>
  );
}

/**
 * Returns coffee storefront preview for a builder block type, or null to use default flower/car renderers.
 */
export function renderCoffeeBuilderBlock(opts: {
  type: string;
  isAr: boolean;
  activeStore: { id?: string; name?: string; domain?: string } | null | undefined;
  builderDevice?: BuilderDevice;
  blockSettings?: Record<string, any> | null;
}): React.ReactNode | null {
  const { type, isAr, activeStore, builderDevice = 'desktop', blockSettings = null } = opts;
  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    activeStore?.domain?.includes('coffee') ||
    false;
  if (!isCoffee || !COFFEE_BUILDER_BLOCK_TYPES.has(type)) return null;

  return (
    <CoffeeBuilderBlockInner
      type={type}
      isAr={isAr}
      activeStore={activeStore}
      builderDevice={builderDevice}
      blockSettings={blockSettings}
    />
  );
}

const CoffeeBuilderBlockInner: React.FC<{
  type: string;
  isAr: boolean;
  activeStore: { id?: string; name?: string } | null | undefined;
  builderDevice: BuilderDevice;
  blockSettings?: Record<string, any> | null;
}> = ({ type, isAr, activeStore, builderDevice, blockSettings }) => {
  const settings = useCoffeeThemeSettings(activeStore);

  switch (type) {
    case 'announcement_bar':
    case 'announcement':
      return (
        <Shell settings={settings}>
          <AnnouncementFromSettings settings={settings} isAr={isAr} />
        </Shell>
      );
    case 'header':
    case 'navbar':
      return (
        <Shell settings={settings}>
          {/* Reserve top strip for cyan Elementor toolbar so nav never collides */}
          <div className="coffee-builder-header [&_[data-coffee-announcement]]:hidden">
            <CoffeeCartProvider>
              <CoffeeHeader />
            </CoffeeCartProvider>
          </div>
        </Shell>
      );
    case 'hero_banners':
    case 'hero_slider':
    case 'hero': {
      const slides = blockSettings?.heroBanners?.banners ?? blockSettings?.slides;
      return (
        <Shell settings={settings}>
          <CoffeeCartProvider>
            <CoffeeHeroSlider3D banners={Array.isArray(slides) ? slides : null} />
          </CoffeeCartProvider>
        </Shell>
      );
    }
    case 'featured_categories_products':
      return (
        <Shell settings={settings}>
          <FeaturedCategoriesPreview settings={settings} isAr={isAr} />
        </Shell>
      );
    case 'featured_section_banners':
      return (
        <Shell settings={settings}>
          <CoffeeCartProvider>
            <CoffeeFlagshipSection />
          </CoffeeCartProvider>
        </Shell>
      );
    case 'featured_products':
      return (
        <Shell settings={settings}>
          <FeaturedProductsPreview settings={settings} isAr={isAr} />
        </Shell>
      );
    case 'image_banners':
      return (
        <Shell settings={settings}>
          <CoffeeHomeModules settings={settings} only="imageBanners" />
        </Shell>
      );
    case 'product_carousel':
      return (
        <Shell settings={settings}>
          <CoffeeHomeModules settings={settings} only="productCarousel" />
        </Shell>
      );
    case 'banners':
      return null;
    case 'product_carousel_banner':
      return (
        <Shell settings={settings}>
          <CoffeeHomeModules settings={settings} only="productCarouselBanner" />
        </Shell>
      );
    case 'store_features_bar':
    case 'features':
      return (
        <Shell settings={settings}>
          <FeaturesPreview settings={settings} isAr={isAr} />
        </Shell>
      );
    case 'exclusive_benefits':
      return (
        <Shell settings={settings}>
          {settings?.exclusiveBenefits?.enabled === false ? (
            <div className="p-8 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl m-4">
              {isAr ? 'المزايا الحصرية معطّلة' : 'Exclusive benefits disabled'}
            </div>
          ) : (
            <CoffeeCartProvider>
              <ExclusivePerksBar />
            </CoffeeCartProvider>
          )}
        </Shell>
      );
    case 'newsletter':
      return (
        <Shell settings={settings}>
          <NewsletterPreview settings={settings} isAr={isAr} storeId={activeStore?.id || ''} />
        </Shell>
      );
    case 'custom_order':
      return (
        <Shell settings={settings}>
          <CustomOrderPreview settings={settings} isAr={isAr} />
        </Shell>
      );
    case 'reviews':
    case 'testimonials':
      return (
        <Shell settings={settings}>
          <ReviewsPreview isAr={isAr} storeId={activeStore?.id || ''} />
        </Shell>
      );
    case 'footer':
      return (
        <Shell settings={settings}>
          <CoffeeCartProvider>
            <CoffeeFooter />
          </CoffeeCartProvider>
        </Shell>
      );
    default:
      return null;
  }
};
