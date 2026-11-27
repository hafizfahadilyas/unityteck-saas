import React from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { Sparkles, CreditCard, Tag, Coffee, ShoppingBag, ShieldCheck } from 'lucide-react';
import { isSouqCommonTenant } from '../../souqCommon/isSouqCommonTenant';

export const MarqueeBanner: React.FC = () => {
  const { language } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));
  const isSouq = !isCoffee && (isSouqCommonTenant(activeStore) || (activeStore?.id && activeStore.id !== 'store-1'));

  const flowerMessages = [
    {
      icon: CreditCard,
      text: isAr ? 'خيار دفع ولا بالأحلام.. قسّط فاتورتك على أربع دفعات مع تابي وتمارا بدون فوائد' : 'Split your bill into 4 interest-free payments with Tabby & Tamara',
      code: '0% INTEREST'
    },
    {
      icon: Tag,
      text: isAr ? 'الافتتاح الكبير بخصومات استثنائية: استخدم الكود MK5 واحصل على خصم إضافي 5% على كافة الباقات' : 'Grand celebration: Use code MK5 for an extra 5% discount on all bouquets',
      code: 'MK5'
    },
    {
      icon: Sparkles,
      text: isAr ? 'توصيل مجاني فوري داخل مكة المكرمة لكافة الطلبات فوق 299 ريال' : 'Complimentary express delivery across Mecca on orders above 299 ⃁',
      code: 'FREE DELIVERY'
    }
  ];

  const coffeeMessages = [
    {
      icon: CreditCard,
      text: isAr ? 'قسّط طلبات القهوة والمكائن على 4 دفعات بدون فوائد مع تابي وتمارا' : 'Split your coffee & espresso gear order into 4 interest-free payments',
      code: '0% INTEREST'
    },
    {
      icon: Tag,
      text: isAr ? 'كود الخصم الحصري: استخدم COFFEE10 واحصل على خصم 10% على كافة المحاصيل والأدوات' : 'Special promo: Use code COFFEE10 for 10% off all specialty beans & gear',
      code: 'COFFEE10'
    },
    {
      icon: Coffee,
      text: isAr ? 'شحن سريع لجميع مدن المملكة بصمام حماية النكهة مجاناً للطلبات فوق 250 ريال' : 'Free express delivery across KSA on orders above 250 ⃁',
      code: 'FREE SHIPPING'
    }
  ];

  const retailMessages = [
    {
      icon: CreditCard,
      text: isAr ? 'قسّط مشترياتك بكل سهولة على 4 دفعات بدون فوائد عبر تابي وتمارا' : 'Split your purchases into 4 interest-free payments with Tabby & Tamara',
      code: '0% INTEREST'
    },
    {
      icon: Tag,
      text: isAr ? 'عرض خاص: استخدم الكود SOUQ10 واحصل على خصم إضافي 10% على كافة المنتجات' : 'Special promo: Use code SOUQ10 for 10% off all catalog items',
      code: 'SOUQ10'
    },
    {
      icon: ShieldCheck,
      text: isAr ? 'منتجات أصلية 100% مع ضمان الجودة وسرعة التوصيل لكافة مدن المملكة' : '100% authentic products with warranty and fast delivery across KSA',
      code: 'GUARANTEED'
    },
    {
      icon: ShoppingBag,
      text: isAr ? 'شحن مجاني سريع لجميع مناطق المملكة للطلبات بقيمة 200 ريال وأكثر' : 'Fast and free shipping across Saudi Arabia on orders above 200 SAR',
      code: 'FREE SHIPPING'
    }
  ];

  const messages = isCoffee ? coffeeMessages : isSouq ? retailMessages : flowerMessages;

  const bgStyle = isCoffee
    ? 'bg-[#1e1009] border-[#382114]'
    : isSouq
    ? 'bg-[#0f172a] border-slate-800'
    : 'bg-[#122e1f] border-[#264b36]';

  return (
    <div className={`${bgStyle} text-[#FAF9F5] border-y py-3 overflow-hidden select-none`}>
      <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
        {[...messages, ...messages, ...messages].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 shrink-0">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center ${isSouq ? 'bg-teal-500/20 text-teal-300' : 'bg-[#e6ca98]/20 text-[#e6ca98]'}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-medium tracking-wide">
                {item.text}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${isSouq ? 'bg-teal-500 text-slate-950' : 'bg-[#e6ca98] text-[#102a1c]'}`}>
                {item.code}
              </span>
              <span className={isSouq ? 'text-teal-400/50 text-xs' : 'text-[#e6ca98]/50 text-xs'}>✦</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
