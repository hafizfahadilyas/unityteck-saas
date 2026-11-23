import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { ShieldCheck, Truck, Star, MessageCircle, Wrench, Layers, CreditCard, Palette } from 'lucide-react';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { bi, coffeeWhatsAppDigits } from '../../settings/coffeeModularSettings';
import { resolveStoreContact } from '../../settings/storeContact';
import { benefitCardFaded, visibleBenefitItems } from './coffeeBenefitsLogic';
import cornerCabinetImg from '../assets/images/hero_coffee_corner_cabinet_1791217199146.jpg';
import baristaSupportImg from '../assets/images/saudi_cafe_machine_1791363309148.jpg';

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
    window.addEventListener('unityteck-store-contact', sync);
    return () => {
      window.removeEventListener('unityteck-theme-settings', sync);
      window.removeEventListener('unityteck-store-contact', sync);
    };
  }, []);

  const settings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, tick]);

  const benefits = settings?.exclusiveBenefits;
  const visibleItems = useMemo(() => visibleBenefitItems(benefits), [benefits]);

  const storeContact = useMemo(() => {
    if (!activeStore?.id) return null;
    return resolveStoreContact(activeStore.id, activeStore, storeIdentity);
  }, [activeStore, storeIdentity, tick]);

  /** Identity / store contact wins; theme mirrors are fallback only. */
  const cleanPhone = useMemo(() => {
    return (
      storeContact?.whatsappDigits ||
      coffeeWhatsAppDigits(storeIdentity?.whatsapp || storeIdentity?.phone || '') ||
      coffeeWhatsAppDigits(settings?.customOrder?.whatsappNumber) ||
      coffeeWhatsAppDigits(settings?.heroBanners?.whatsappNumber) ||
      coffeeWhatsAppDigits((activeStore as { whatsapp?: string } | null)?.whatsapp || activeStore?.phone || '') ||
      ''
    );
  }, [storeContact, storeIdentity, settings, activeStore]);

  const displayPhone =
    storeContact?.whatsapp ||
    storeIdentity?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    (cleanPhone ? `+${cleanPhone}` : '');

  if (benefits?.enabled === false) return null;
  if (!visibleItems.length) return null;

  const handleOpenWhatsApp = (e?: React.MouseEvent, customMsg?: string) => {
    if (e) e.stopPropagation();
    if (!cleanPhone) return;
    const msg =
      customMsg ||
      (isAr
        ? `السلام عليكم، أود الاستفسار والتواصل بخصوص متجر ${storeName}`
        : `Hello, I would like to get in touch with ${storeName}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const customCornerMsg = isAr
    ? `السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم`
    : `Hello, I would like to inquire about placing a custom coffee corner order.`;

  const perks = visibleItems
    .map((it) => {
      const titleEn = (it.titleEn || '').trim();
      const titleAr = (it.titleAr || '').trim();
      const descEn = (it.descriptionEn || '').trim();
      const descAr = (it.descriptionAr || '').trim();
      const blob = `${titleEn} ${titleAr} ${descEn} ${descAr}`.toLowerCase();
      const buttons = (it.buttons || []).filter(
        (b) => b.enabled !== false && ((b.labelEn || '').trim() || (b.labelAr || '').trim()),
      );
      return {
        id: it.id,
        titleEn: titleEn || titleAr,
        titleAr: titleAr || titleEn,
        descEn: descEn || descAr,
        descAr: descAr || descEn,
        icon: it.icon || 'ShieldCheck',
        faded: benefitCardFaded(it),
        buttons,
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
  const showTitle = benefits?.showTitle !== false;
  const showDescription = benefits?.showDescription !== false;

  const WhatsAppBtn = ({
    label,
    onClick,
    enabled,
  }: {
    label: string;
    onClick: (e: React.MouseEvent) => void;
    enabled: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className="w-full py-1.5 px-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#25D366]"
    >
      <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
      <span>{label}</span>
    </button>
  );

  return (
    <section data-customize-section="C-BEN" className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 select-none">
      {(showTitle || showDescription) && (
        <div className="text-start mb-4 sm:mb-6">
          {showTitle ? (
            <h2
              className={`text-xl sm:text-2xl lg:text-[28px] font-black text-[#2B1809] ${
                isAr ? 'tracking-normal' : 'tracking-tight'
              }`}
            >
              {sectionTitle}
            </h2>
          ) : null}
          {showDescription && sectionSubtitle ? (
            <p className="text-xs sm:text-sm text-[#5C422E] mt-1.5 max-w-2xl">{sectionSubtitle}</p>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
        {perks.map((perk) => {
          const Icon = ICON_MAP[perk.icon] || ShieldCheck;
          const waOnlyButtons = perk.buttons.filter(
            (btn) => btn.style === 'whatsapp' || /wa\.me|whatsapp/i.test(btn.url || ''),
          );
          return (
            <div
              key={perk.id}
              className={`col-span-1 bg-gradient-to-b from-[#FDFBF7] via-[#F8F2EA] to-[#F1E5D6] border-0 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between items-center text-center transition-all duration-300 group cursor-default min-h-[190px] sm:min-h-[235px] ${
                perk.faded ? 'opacity-45 grayscale-[0.65] pointer-events-none' : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
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
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-0 shadow-2xs group-hover:scale-105 transition-transform duration-300 bg-white">
                    <img
                      src={cornerCabinetImg}
                      alt={isAr ? perk.titleAr : perk.titleEn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
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

              {perk.faded ? (
                <div className="text-[10px] font-bold text-[#7A593D] mt-1">{isAr ? 'غير متاح حالياً' : 'Currently unavailable'}</div>
              ) : waOnlyButtons.length > 0 ? (
                <div className="w-full space-y-1.5 pt-1 border-0">
                  {waOnlyButtons.slice(0, 1).map((btn) => {
                    const label = isAr ? btn.labelAr || btn.labelEn : btn.labelEn || btn.labelAr;
                    return (
                      <WhatsAppBtn
                        key={btn.id}
                        label={label || (isAr ? 'واتساب' : 'WhatsApp')}
                        enabled={Boolean(cleanPhone)}
                        onClick={(e) => handleOpenWhatsApp(e)}
                      />
                    );
                  })}
                </div>
              ) : perk.isCustomAction ? (
                <div className="w-full space-y-1.5 pt-1 border-0">
                  <WhatsAppBtn
                    label={isAr ? 'تواصل واتساب' : 'WhatsApp'}
                    enabled={Boolean(cleanPhone)}
                    onClick={(e) => handleOpenWhatsApp(e, customCornerMsg)}
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {/* VIP Care — always enabled chrome; WhatsApp uses store number */}
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
            onClick={(e) => handleOpenWhatsApp(e, customCornerMsg)}
            disabled={!cleanPhone}
            className="my-auto flex flex-col items-center justify-center py-1 sm:py-2 gap-1.5 group/phone cursor-pointer focus:outline-hidden disabled:cursor-not-allowed"
            title={isAr ? 'تواصل عبر واتساب' : 'Chat via WhatsApp'}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-md group-hover/phone:scale-105 transition-transform duration-300 relative">
              <img
                src={baristaSupportImg}
                alt={isAr ? 'تفصيل واستشارة فورية' : 'Custom & VIP Care'}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute bottom-1 end-1 w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow">
                <MessageCircle className="w-3.5 h-3.5 fill-white text-[#25D366]" />
              </span>
            </div>
            {cleanPhone ? (
              <span className="font-sans font-bold text-[11px] sm:text-xs text-[#2B1809] group-hover/phone:text-[#25D366] tracking-tight dir-ltr transition-colors">
                {displayPhone}
              </span>
            ) : (
              <span className="font-sans font-bold text-[11px] sm:text-xs text-[#7A593D] tracking-tight">
                {isAr ? 'رقم واتساب غير متوفر' : 'WhatsApp number unavailable'}
              </span>
            )}
          </button>

          <div className="w-full space-y-1.5 mt-1 pt-1.5 border-0">
            <WhatsAppBtn
              label={isAr ? 'تواصل عبر واتساب' : 'WhatsApp Chat'}
              enabled={Boolean(cleanPhone)}
              onClick={(e) => handleOpenWhatsApp(e, customCornerMsg)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
