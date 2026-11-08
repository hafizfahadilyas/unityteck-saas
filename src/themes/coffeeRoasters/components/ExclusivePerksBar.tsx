import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { ShieldCheck, Truck, Star, MessageCircle, Wrench, Layers, CreditCard, Palette } from 'lucide-react';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { bi, coffeeModularSeed, coffeeWhatsAppDigits } from '../../settings/coffeeModularSettings';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShieldCheck,
  Truck,
  Star,
  MessageCircle,
  Wrench,
  Layers,
  CreditCard,
  Palette,
};

export const ExclusivePerksBar: React.FC = () => {
  const { language, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const isAr = language === 'AR';
  const storeName = activeStore?.name || (isAr ? 'المتجر' : 'Store');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener('unityteck-theme-settings', sync);
    return () => window.removeEventListener('unityteck-theme-settings', sync);
  }, []);

  const settings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, tick]);

  const benefits = useMemo(() => {
    const raw = settings?.exclusiveBenefits;
    const hasItems = (raw?.items || []).some(
      (it) => it.enabled !== false && ((it.titleEn || '').trim() || (it.titleAr || '').trim()),
    );
    if (hasItems) return raw;
    // Unconfigured coffee C-BEN → HiBrew seed for display only (merchant clear stays empty via enabled:false)
    if (raw?.enabled === false) return raw;
    return coffeeModularSeed().exclusiveBenefits;
  }, [settings?.exclusiveBenefits]);

  if (benefits?.enabled === false) return null;

  const displayPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '';
  const cleanPhone = coffeeWhatsAppDigits(displayPhone);

  const handleOpenWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cleanPhone) return;
    const msg = isAr
      ? `السلام عليكم، أود الاستفسار والتواصل بخصوص متجر${storeName}`
      : `Hello, I would like to get in touch with ${storeName}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCustomOrderWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!cleanPhone) return;
    const msg = isAr
      ? `السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم`
      : `Hello, I would like to inquire about placing a custom coffee corner order.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const perks = (benefits?.items || [])
    .filter((it) => it.enabled !== false)
    .map((it) => {
      const titleEn = (it.titleEn || '').trim();
      const titleAr = (it.titleAr || '').trim();
      const descEn = (it.descriptionEn || '').trim();
      const descAr = (it.descriptionAr || '').trim();
      const blob = `${titleEn} ${titleAr} ${descEn} ${descAr}`.toLowerCase();
      return {
        id: it.id,
        titleEn: titleEn || titleAr,
        titleAr: titleAr || titleEn,
        descEn: descEn || descAr,
        descAr: descAr || descEn,
        icon: it.icon || 'ShieldCheck',
        isInstallments: /tabby|tamara|install|تقسيط|ادفع لاحقا/.test(blob),
        isCustomAction: /custom|corner|تفصيل|ركن/.test(blob),
      };
    })
    .filter((p) => p.titleEn || p.titleAr);

  if (!perks.length) return null;

  const sectionTitle = bi(
    language,
    benefits?.titleEn,
    benefits?.titleAr,
    isAr ? 'مزايا حصرية وخدمات مخصصة' : 'Exclusive Perks & Custom Services',
  );
  const sectionSubtitle = bi(language, benefits?.subtitleEn, benefits?.subtitleAr);

  return (
    <section data-customize-section="C-BEN" className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 select-none">
      <div className="text-start mb-4 sm:mb-6">
        <h2
          className={`text-xl sm:text-2xl lg:text-[28px] font-black text-[#2B1809] ${
            isAr ? 'tracking-normal' : 'tracking-tight'
          }`}
        >
          {sectionTitle}
        </h2>
        {sectionSubtitle ? (
          <p className="text-xs sm:text-sm text-[#5C422E] mt-1.5 max-w-2xl">{sectionSubtitle}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
        {perks.map((perk) => {
          const Icon = ICON_MAP[perk.icon] || ShieldCheck;
          return (
            <div
              key={perk.id}
              className="col-span-1 bg-gradient-to-b from-[#FDFBF7] via-[#F8F2EA] to-[#F1E5D6] border-0 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default min-h-[190px] sm:min-h-[235px]"
            >
              <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#2B1809] line-clamp-1 mb-2 sm:mb-2.5">
                {isAr ? perk.titleAr : perk.titleEn}
              </h3>

              <div className="my-auto flex items-center justify-center py-1 sm:py-2">
                {perk.isInstallments ? (
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-0 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-[#3DF0B0] text-black">
                      tabby
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black text-neutral-400">&</span>
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-rose-400 text-white">
                      tamara
                    </span>
                  </div>
                ) : perk.isCustomAction ? (
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white border-0 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-300">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C531B]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-white border-0 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C531B]" />
                  </div>
                )}
              </div>

              <p className="text-[10px] sm:text-xs text-[#5C422E] leading-snug sm:leading-relaxed font-medium mt-1 mb-2">
                {isAr ? perk.descAr : perk.descEn}
              </p>

              {perk.isCustomAction ? (
                <div className="w-full space-y-1.5 pt-1 border-0">
                  <button
                    type="button"
                    onClick={handleCustomOrderWhatsApp}
                    className="w-full py-1.5 px-2 bg-[#2B1809] hover:bg-black text-white rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
                    <span>{isAr ? 'طلب تفصيل مخصص' : 'Custom Order'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenWhatsApp}
                    className="w-full py-1.5 px-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
                    <span>{isAr ? 'تواصل واتساب' : 'WhatsApp'}</span>
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="col-span-2 md:col-span-1 bg-gradient-to-b from-[#FAF4EC] via-[#F3E7D7] to-[#EBD8C3] border-0 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between items-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group min-h-[190px] sm:min-h-[235px] relative overflow-hidden">
          <div className="w-full">
            <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#2B1809] line-clamp-1">
              {isAr ? 'تفصيل واستشارة فورية' : 'Custom & VIP Care'}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[#7A593D] font-medium mt-0.5 line-clamp-1">
              {isAr ? 'استشارات باريستا وتفصيل أركان' : 'Barista Support & Corner Designs'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCustomOrderWhatsApp}
            className="my-auto flex flex-col items-center justify-center py-1 sm:py-2 gap-1 group/phone cursor-pointer focus:outline-hidden"
            title={isAr ? 'تواصل عبر واتساب لطلب تفصيل مخصص' : 'Chat via WhatsApp for custom order'}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover/phone:scale-110 transition-transform duration-300 relative">
              <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping opacity-75" />
            </div>
            <span className="font-sans font-bold text-[11px] sm:text-xs text-[#2B1809] group-hover/phone:text-[#25D366] tracking-tight dir-ltr transition-colors">
              {displayPhone || (isAr ? 'واتساب غير مُعدّ' : 'WhatsApp not set')}
            </span>
          </button>

          <div className="w-full space-y-1.5 mt-1 pt-1.5 border-0">
            <button
              type="button"
              onClick={handleCustomOrderWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg sm:rounded-xl bg-[#2B1809] hover:bg-black text-white text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
              <span>{isAr ? 'طلب تفصيل مخصص' : 'Custom Order'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg sm:rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
              <span>{isAr ? 'تواصل عبر واتساب' : 'WhatsApp Chat'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
