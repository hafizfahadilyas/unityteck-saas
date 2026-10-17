import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { readAllThemeSettings } from '../../settings/themeSettingsStore';

export const PromoBannersPair: React.FC = () => {
  const { navigateToCategory, setCurrentPage } = useApp();
  const { activeStore } = useTenant();
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

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

  const customBanners = useMemo(() => {
    try {
      const cfg = readAllThemeSettings(activeStore.id, activeStore);
      if (cfg.banners && cfg.banners.enabled && cfg.banners.banners && cfg.banners.banners.length >= 2) {
        return cfg.banners.banners.slice(0, 2);
      }
    } catch {}
    return null;
  }, [activeStore.id, activeStore, tick]);

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
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
              </div>
              <div className="relative z-10 space-y-1 max-w-md">
                {banner.discountBadge && (
                  <span className="inline-block text-[10px] uppercase font-bold text-amber-300 tracking-widest px-2.5 py-0.5 rounded-full bg-black/40 border border-amber-300/30">
                    {banner.discountBadge}
                  </span>
                )}
                <h3 className="text-xl sm:text-2xl font-bold font-serif">{banner.title}</h3>
                {banner.subtitle && (
                  <p className="text-xs text-stone-200 font-light">{banner.subtitle}</p>
                )}
                {banner.buttonText && (
                  <div className="pt-2">
                    <span className="inline-block text-xs font-bold text-white bg-white/20 hover:bg-white/30 px-3.5 py-1 rounded-xl backdrop-blur-md transition-colors">
                      {banner.buttonText}
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
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#c88a58] tracking-widest block">ROAST MASTERS</span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif">محاصيل البن المختصة الفاخرة</h3>
              <p className="text-xs text-stone-300 font-light">إثيوبيا، كولومبيا والبرازيل بتحميص طازج</p>
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
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#c88a58] tracking-widest block">BREW GEAR</span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif">أدوات ومكائن الترشيح V60</h3>
              <p className="text-xs text-stone-300 font-light">معدات وموازين احترافية للباريستا المنزلي</p>
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
              alt="Hadaya Special Promotion 1"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
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
              alt="Hadaya Special Promotion 2"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </picture>
        </div>
      </div>
    </section>
  );
};
