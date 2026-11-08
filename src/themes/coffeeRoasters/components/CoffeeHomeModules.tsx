import React from 'react';
import { useCart } from '../context/CartContext';
import { bi } from '../../settings/coffeeModularSettings';
import type { AllThemeSettings } from '../../settings/themeSettingsStore';

function productImage(p: { images?: string[]; colors?: { image?: string }[] }): string {
  return p.colors?.[0]?.image || p.images?.[0] || '';
}

function matchCategory(category: string | undefined, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;
  const cat = (category || '').toLowerCase().trim();
  const id = categoryId.toLowerCase().trim();
  if (!cat) return false;
  if (cat === id || cat.includes(id) || id.includes(cat)) return true;
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

export type CoffeeHomeModuleKey =
  | 'imageBanners'
  | 'exclusiveBenefits'
  | 'productCarousel'
  | 'productCarouselBanner';

export const CoffeeHomeModules: React.FC<{
  settings: AllThemeSettings | null;
  /** When set (page builder), render only that module — avoid duplicating the whole homepage. */
  only?: CoffeeHomeModuleKey;
}> = ({ settings, only }) => {
  const { language, navigateTo, products } = useCart();
  const lang = language === 'AR' ? 'ar' : 'en';
  if (!settings) return null;
  // On full homepage, ExclusivePerksBar owns C-BEN pixel UI — skip duplicate here unless `only` is set.
  const show = (key: CoffeeHomeModuleKey) => {
    if (only) return only === key;
    if (key === 'exclusiveBenefits') return false;
    return true;
  };

  const images = settings.imageBanners;
  const imageItems = images?.enabled ? (images.items || []).filter((it) => it.enabled !== false && it.image) : [];

  const benefits = settings.exclusiveBenefits;
  const benefitItems = benefits?.enabled ? (benefits.items || []).filter((it) => it.enabled) : [];

  const carousel = settings.productCarousel;
  const carouselProducts =
    carousel?.enabled
      ? (products || [])
          .filter((p) => matchCategory(p.category, carousel.categoryId))
          .slice(0, Math.max(carousel.productCount || 0, (products || []).length, 12))
      : [];

  const combo = settings.productCarouselBanner;
  const comboProducts =
    combo?.enabled
      ? (products || [])
          .filter((p) => matchCategory(p.category, combo.categoryId))
          .slice(0, Math.max(combo.productCount || 0, (products || []).length, 8))
      : [];

  const emptyHint = (ar: string, en: string) =>
    only ? (
      <div className="p-8 text-center text-sm text-neutral-400 border border-dashed border-neutral-200 rounded-2xl m-4">
        {language === 'AR' ? ar : en}
      </div>
    ) : null;

  return (
    <>
      {show('imageBanners') && imageItems.length === 0 && emptyHint('بانرات الصور فارغة — اضبطها من تخصيص الثيم', 'Image banners empty — configure in Customize Themes')}
      {show('imageBanners') && imageItems.length > 0 && (
        <section data-customize-section="C-IMG" className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8">
          <div className={`grid gap-4 ${images.columnsMobile === 2 ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-3`}>
            {imageItems.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => navigateTo(it.link === 'custom-order' ? 'custom-order' : 'products')}
                className="relative overflow-hidden rounded-3xl min-h-[220px] text-start text-white"
              >
                <img src={it.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                <div className="relative z-10 p-5 h-full flex flex-col justify-end">
                  <h3 className="font-bold text-lg">{bi(lang, it.titleEn, it.titleAr)}</h3>
                  <p className="text-xs text-white/80">{bi(lang, it.subtitleEn, it.subtitleAr)}</p>
                  {(it.buttonEn || it.buttonAr) && (
                    <span className="mt-2 text-xs font-bold underline">{bi(lang, it.buttonEn, it.buttonAr)}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {show('exclusiveBenefits') && benefitItems.length === 0 && emptyHint('المزايا الحصرية فارغة — اضبطها من تخصيص الثيم', 'Exclusive benefits empty — configure in Customize Themes')}
      {show('exclusiveBenefits') && benefitItems.length > 0 && (
        <section className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-6">
          {(benefits.titleEn || benefits.titleAr) && (
            <h2 className="text-2xl font-bold text-center mb-2">{bi(lang, benefits.titleEn, benefits.titleAr)}</h2>
          )}
          {(benefits.subtitleEn || benefits.subtitleAr) && (
            <p className="text-sm text-neutral-500 text-center mb-6">{bi(lang, benefits.subtitleEn, benefits.subtitleAr)}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefitItems.map((it) => (
              <div key={it.id} className="rounded-2xl bg-[#F8F9FA] p-4 text-start">
                <h3 className="font-bold text-sm">{bi(lang, it.titleEn, it.titleAr)}</h3>
                <p className="text-xs text-neutral-500 mt-1">{bi(lang, it.descriptionEn, it.descriptionAr)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {show('productCarousel') && !(carousel?.enabled && carouselProducts.length > 0) && emptyHint('كاروسيل المنتجات فارغ — اضبطه من تخصيص الثيم', 'Product carousel empty — configure in Customize Themes')}
      {show('productCarousel') && carousel?.enabled && carouselProducts.length > 0 && (
        <section data-customize-section="C-PC" className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8">
          <h2 className="text-2xl font-bold text-center">{bi(lang, carousel.titleEn, carousel.titleAr)}</h2>
          {(carousel.subtitleEn || carousel.subtitleAr) && (
            <p className="text-sm text-neutral-500 text-center mt-1 mb-5">{bi(lang, carousel.subtitleEn, carousel.subtitleAr)}</p>
          )}
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
            {carouselProducts.map((p) => (
              <button key={p.id} type="button" onClick={() => navigateTo('product-detail', p.id)} className="shrink-0 w-56 rounded-2xl bg-white border border-neutral-100 p-4 text-center">
                {productImage(p) ? <img src={productImage(p)} alt="" className="h-32 w-full object-contain" /> : null}
                <div className="font-bold text-sm mt-2">
                  {language === 'AR' ? (p.nameAr || '').trim() : (p.name || '').trim()}
                </div>
                <div className="text-xs mt-1">{language === 'AR' ? `${p.basePrice.toLocaleString()}ر.س` : `SAR ${p.basePrice.toLocaleString()}`}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* C-BAN stacked promo strip removed from HiBrew home — do not render */}

      {show('productCarouselBanner') && !(combo?.enabled && (combo.bannerImage || comboProducts.length > 0)) && emptyHint('كاروسيل مع بانر فارغ — اضبطه من تخصيص الثيم', 'Carousel + banner empty — configure in Customize Themes')}
      {show('productCarouselBanner') && combo?.enabled && (combo.bannerImage || comboProducts.length > 0) && (
        <section data-customize-section="C-PCB" className="w-full max-w-[1360px] mx-auto px-4 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {combo.bannerImage ? (
            <button type="button" onClick={() => navigateTo('products')} className="relative min-h-[280px] rounded-3xl overflow-hidden text-start text-white">
              <img src={combo.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 p-6">
                <h3 className="text-2xl font-bold">{bi(lang, combo.titleEn, combo.titleAr)}</h3>
                <p className="text-sm mt-1">{bi(lang, combo.subtitleEn, combo.subtitleAr)}</p>
                <span className="inline-block mt-3 text-xs font-bold underline">{bi(lang, combo.buttonEn, combo.buttonAr)}</span>
              </div>
            </button>
          ) : null}
          {comboProducts.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {comboProducts.map((p) => (
                <button key={p.id} type="button" onClick={() => navigateTo('product-detail', p.id)} className="rounded-2xl bg-[#F8F9FA] p-3 text-center">
                  {productImage(p) ? <img src={productImage(p)} alt="" className="h-24 w-full object-contain" /> : null}
                  <div className="text-xs font-bold mt-1">
                    {language === 'AR' ? (p.nameAr || '').trim() : (p.name || '').trim()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
};
