import React from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { ShieldCheck, Truck, Star, MessageCircle, Wrench, Layers } from 'lucide-react';

export const ExclusivePerksBar: React.FC = () => {
  const { language, storeIdentity } = useCart();
  const { activeStore } = useTenant();
  const isAr = language === 'AR';
  const storeName = activeStore?.name || (isAr ? 'المتجر' : 'Store');

  // Dynamic WhatsApp details from store owner settings
  const rawPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '+966549876543';

  let cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
  if (cleanPhone.startsWith('05')) {
    cleanPhone = '966' + cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
    cleanPhone = '966' + cleanPhone;
  }
  const displayPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '+966 54 987 6543';

  const handleOpenWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = isAr
      ? `السلام عليكم، أود الاستفسار والتواصل بخصوص متجر ${storeName}`
      : `Hello, I would like to get in touch with ${storeName}.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCustomOrderWhatsApp = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = isAr
      ? `السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم`
      : `Hello, I would like to inquire about placing a custom coffee corner order.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const perks = [
    {
      id: 'care',
      titleAr: 'ضمان الوكيل سنتين',
      titleEn: 'Store Care (2-Yr Warranty)',
      descAr: 'احمِ أجهزتك ومعداتك مع صيانة معتمدة لعدة أعوام.',
      descEn: 'Protect your coffee gear with certified 2-year warranty.',
      icon: ShieldCheck,
    },
    {
      id: 'delivery',
      titleAr: 'توصيل مجاني سريع',
      titleEn: 'Free Express Delivery',
      descAr: 'توصيل منزلي سريع ومجاني لجميع طلباتك في المملكة.',
      descEn: 'Fast & free doorstep delivery on all orders across Saudi Arabia.',
      icon: Truck,
    },
    {
      id: 'installments',
      titleAr: 'اشتر الآن، وادفع لاحقاً',
      titleEn: 'Buy Now, Pay Later',
      descAr: 'قسّم مشترياتك على دفعات ميسرة مع Tabby و Tamara.',
      descEn: 'Split your purchases into flexible installments with Tabby & Tamara.',
      isInstallments: true,
    },
    {
      id: 'custom-corner',
      titleAr: 'تفصيل أركان القهوة',
      titleEn: 'Custom Corner Orders',
      descAr: 'تفصيل خشب طبيعي وأسطح فاخرة حسب مقاساتك بدقة.',
      descEn: 'Handcrafted natural wood & bespoke sintered stone stations.',
      isCustomAction: true,
      icon: Layers,
    },
  ];

  return (
    <section className="w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 select-none">
      {/* SECTION HEADER */}
      <div className="text-start mb-4 sm:mb-6">
        <h2
          className={`text-xl sm:text-2xl lg:text-[28px] font-black text-[#2B1809] ${
            isAr ? 'tracking-normal' : 'tracking-tight'
          }`}
        >
          {isAr ? 'مزايا حصرية وخدمات مخصصة' : 'Exclusive Perks & Custom Services'}
        </h2>
      </div>

      {/* 
        GRID LAYOUT: 
        - Mobile: 4 boxes in 2 rows (2x2 grid via grid-cols-2), 
                  followed by the 5th consultation box spanning both columns (col-span-2) right underneath.
        - Desktop / Tablet: 5 equal columns in 1 single row (md:grid-cols-5).
      */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
        
        {/* The 4 Core Perks (Bronze Theme) */}
        {perks.map((perk) => {
          const Icon = perk.icon;
          return (
            <div
              key={perk.id}
              className="col-span-1 bg-gradient-to-b from-[#FDFBF7] via-[#F8F2EA] to-[#F1E5D6] border-0 rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group cursor-default min-h-[190px] sm:min-h-[235px]"
            >
              {/* Card Title */}
              <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#2B1809] line-clamp-1 mb-2 sm:mb-2.5">
                {isAr ? perk.titleAr : perk.titleEn}
              </h3>

              {/* Card Center: Icon / Installments pill */}
              <div className="my-auto flex items-center justify-center py-1 sm:py-2">
                {perk.isInstallments ? (
                  <div className="flex items-center gap-1 sm:gap-1.5 bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-0 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded bg-[#3DF0B0] text-black">
                      tabby
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black text-neutral-400">
                      &
                    </span>
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
                    {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#8C531B]" />}
                  </div>
                )}
              </div>

              {/* Card Description */}
              <p className="text-[10px] sm:text-xs text-[#5C422E] leading-snug sm:leading-relaxed font-medium mt-1 mb-2">
                {isAr ? perk.descAr : perk.descEn}
              </p>

              {/* Custom Order & WhatsApp Buttons in the 4th Box */}
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

        {/* 5TH BOX: CUSTOM ORDER & DIRECT WHATSAPP CONSULTATION */}
        <div
          className="col-span-2 md:col-span-1 bg-gradient-to-b from-[#FAF4EC] via-[#F3E7D7] to-[#EBD8C3] border-0 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between items-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group min-h-[190px] sm:min-h-[235px] relative overflow-hidden"
        >
          {/* Card Title */}
          <div className="w-full">
            <h3 className="font-bold text-xs sm:text-sm lg:text-[15px] text-[#2B1809] line-clamp-1">
              {isAr ? 'تفصيل واستشارة فورية' : 'Custom & VIP Care'}
            </h3>
            <p className="text-[9px] sm:text-[10px] text-[#7A593D] font-medium mt-0.5 line-clamp-1">
              {isAr ? 'استشارات باريستا وتفصيل أركان' : 'Barista Support & Corner Designs'}
            </p>
          </div>

          {/* Center: WhatsApp Icon + Phone Number (Clickable to open WhatsApp) */}
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
              {displayPhone}
            </span>
          </button>

          {/* Bottom Actions: Custom Order Button + WhatsApp Button directly underneath */}
          <div className="w-full space-y-1.5 mt-1 pt-1.5 border-0">
            {/* 1. Custom Order Button */}
            <button
              type="button"
              onClick={handleCustomOrderWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg sm:rounded-xl bg-[#2B1809] hover:bg-black text-white text-[10px] sm:text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366]" />
              <span>{isAr ? 'طلب تفصيل مخصص' : 'Custom Order'}</span>
            </button>

            {/* 2. WhatsApp Button Directly Underneath */}
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
