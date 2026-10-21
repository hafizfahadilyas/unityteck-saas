import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';

export interface PromoBannersPairProps {
  settings?: Record<string, any>;
  isBuilderMode?: boolean;
}

export const PromoBannersPair: React.FC<PromoBannersPairProps> = ({
  settings,
  isBuilderMode = false,
}) => {
  const { navigateToCategory, setCurrentPage, language } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const s = settings || {};

  const isCoffee =
    activeStore?.id === 'store-coffee' ||
    Boolean(activeStore?.category && activeStore.category.includes('قهوة')) ||
    Boolean(s.isCoffee);

  const isCarStore =
    activeStore?.id?.includes('transport') ||
    activeStore?.id?.includes('car') ||
    Boolean(
      activeStore?.category &&
        (activeStore.category.includes('سيارات') ||
          activeStore.category.toLowerCase().includes('car') ||
          activeStore.category.toLowerCase().includes('transport'))
    );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handleSync = () => setTick((t) => t + 1);
    window.addEventListener('unityteck-theme-settings', handleSync);
    window.addEventListener('unityteck-data', handleSync);
    return () => {
      window.removeEventListener('unityteck-theme-settings', handleSync);
      window.removeEventListener('unityteck-data', handleSync);
    };
  }, []);

  // Check if settings has explicit banners from Visual Page Builder
  const builderBanners = useMemo(() => {
    if (s.banner1Image || s.banner2Image || s.banner1TitleAr || s.banner1TitleEn) {
      return [
        {
          id: 'b1',
          image:
            s.banner1Image ||
            (isCoffee
              ? 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
              : isCarStore
              ? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
              : 'https://cdn.salla.sa/form-builder/UyrjLKc6fqzpog6pXVMOtIgt2Qe27ELnq45h9Q6W.png'),
          title: isAr
            ? s.banner1TitleAr || s.titleAr || (isCoffee ? 'محاصيل البن المختصة الفاخرة' : isCarStore ? 'أغطية المقاعد الفاخرة' : 'باقات الورد الطبيعي الفاخرة')
            : s.banner1TitleEn || s.titleEn || (isCoffee ? 'Specialty Single Origins' : isCarStore ? 'Luxury Seat Covers' : 'Fresh Floral Bouquets'),
          subtitle: isAr
            ? s.banner1SubtitleAr || (isCoffee ? 'إثيوبيا، كولومبيا والبرازيل بتحميص طازج' : isCarStore ? 'تفصيل ملكي مقاوم للحرارة والسوائل' : 'منسقة بأيدي خبراء الزهور')
            : s.banner1SubtitleEn || (isCoffee ? 'Fresh roasted beans from global origins' : isCarStore ? 'Bespoke custom vehicle interiors' : 'Tailored by master florists'),
          buttonText: isAr ? s.banner1BtnAr || 'تسوق الآن' : s.banner1BtnEn || 'Shop Now',
          link: s.banner1Link || '#catalog',
        },
        {
          id: 'b2',
          image:
            s.banner2Image ||
            (isCoffee
              ? 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80'
              : isCarStore
              ? 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
              : 'https://cdn.salla.sa/form-builder/wrkohrPk90xTpC7DzSnsRoDKINz8GRcQxxBCaWyu.png'),
          title: isAr
            ? s.banner2TitleAr || (isCoffee ? 'أدوات ومكائن الترشيح V60' : isCarStore ? 'دعاسات السيارات المقاومة' : 'ورد وشوكولاتة بلجيكية فاخرة')
            : s.banner2TitleEn || (isCoffee ? 'Barista Brew Gear & Tools' : isCarStore ? 'Heavy-Duty 7D Floor Mats' : 'Roses & Luxury Belgian Chocolates'),
          subtitle: isAr
            ? s.banner2SubtitleAr || (isCoffee ? 'معدات وموازين احترافية للباريستا المنزلي' : isCarStore ? 'حماية فائقة لأرضيات سيارتك' : 'توليفة راقية للمناسبات السعيدة')
            : s.banner2SubtitleEn || (isCoffee ? 'Pro equipment for home baristas' : isCarStore ? 'Ultimate interior protection' : 'Signature pairs for special moments'),
          buttonText: isAr ? s.banner2BtnAr || 'اكتشف المزيد' : s.banner2BtnEn || 'Discover More',
          link: s.banner2Link || '#catalog',
        },
      ];
    }
    return null;
  }, [s, isAr, isCoffee, isCarStore]);

  const customBanners = useMemo(() => {
    if (builderBanners) return builderBanners;
    try {
      const cfg = readAllThemeSettings(activeStore.id, activeStore);
      if (cfg.banners && cfg.banners.enabled && cfg.banners.banners && cfg.banners.banners.length >= 2) {
        return cfg.banners.banners.slice(0, 2);
      }
    } catch {}
    return null;
  }, [activeStore.id, activeStore, tick, builderBanners]);

  if (customBanners && customBanners.length >= 2) {
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {customBanners.map((banner, bIdx) => (
            <div
              key={banner.id || bIdx}
              onClick={() => {
                if (banner.link && banner.link.startsWith('#')) {
                  setCurrentPage(banner.link.replace('#', '') as any);
                } else if (banner.link) {
                  navigateToCategory(banner.link);
                } else {
                  setCurrentPage('catalog');
                }
              }}
              className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a0f0a] min-h-[190px] sm:min-h-[230px] flex items-end p-6 text-white"
            >
              <div className="absolute inset-0">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.75]"
                  loading="lazy" decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              </div>
              <div className="relative z-10 space-y-1 max-w-md">
                {(banner as any).discountBadge && (
                  <span className="inline-block text-[10px] uppercase font-bold text-amber-300 tracking-widest px-2.5 py-0.5 rounded-full bg-black/40 border border-amber-300/30">
                    {(banner as any).discountBadge}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl font-bold font-serif">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-xs text-stone-200 font-light">{banner.subtitle}</p>
                )}
                {(banner as any).buttonText && (
                  <div className="pt-2">
                    <span className="inline-block text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3.5 py-1 rounded-xl backdrop-blur-md transition-colors">
                      {(banner as any).buttonText}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isCoffee) {
    return (
      <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Coffee Banner 1 */}
          <div
            onClick={() => navigateToCategory('حبوب القهوة المختصة')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a0f0a] min-h-[180px] sm:min-h-[220px] flex items-end p-6 text-white"
          >
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                alt="Specialty Coffee Micro-Lots"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.7]"
                loading="lazy" decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#c88a58] tracking-widest block">ROAST MASTERS</span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif">
                {isAr ? 'محاصيل البن المختصة الفاخرة' : 'Specialty Single Origins'}
              </h3>
              <p className="text-xs text-stone-300 font-light">
                {isAr ? 'إثيوبيا، كولومبيا والبرازيل بتحميص طازج' : 'Freshly roasted micro-lots from top origins'}
              </p>
            </div>
          </div>

          {/* Coffee Banner 2 */}
          <div
            onClick={() => navigateToCategory('أدوات التحضير المقطرة')}
            className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a0f0a] min-h-[180px] sm:min-h-[220px] flex items-end p-6 text-white"
          >
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"
                alt="Barista Pour-Over Tools"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.7]"
                loading="lazy" decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#c88a58] tracking-widest block">BREW GEAR</span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif">
                {isAr ? 'أدوات ومكائن الترشيح V60' : 'Pour-Over Brew Gear'}
              </h3>
              <p className="text-xs text-stone-300 font-light">
                {isAr ? 'معدات وموازين احترافية للباريستا المنزلي' : 'Pro equipment and scales for home baristas'}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Banner 1 */}
        <div
          onClick={() => navigateToCategory('باقات الورود الطبيعية')}
          className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a2b20]"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="https://cdn.salla.sa/form-builder/mypBuAvVrV6ns12LvQX99vVEToDW0JU2xP3pCijx.png"
            />
            <img
              src="https://cdn.salla.sa/form-builder/UyrjLKc6fqzpog6pXVMOtIgt2Qe27ELnq45h9Q6W.png"
              alt="Special Promotion 1"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy" decoding="async"
            />
          </picture>
        </div>

        {/* Banner 2 */}
        <div
          onClick={() => navigateToCategory('ورد وشوكولاتة بلجيكية فاخرة')}
          className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a2b20]"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="https://cdn.salla.sa/form-builder/elgP0ELiGIk2ONO9lmsZv2TYxlzbnzj1UyVkVQbb.png"
            />
            <img
              src="https://cdn.salla.sa/form-builder/wrkohrPk90xTpC7DzSnsRoDKINz8GRcQxxBCaWyu.png"
              alt="Special Promotion 2"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
              loading="lazy" decoding="async"
            />
          </picture>
        </div>
      </div>
    </section>
  );
};

