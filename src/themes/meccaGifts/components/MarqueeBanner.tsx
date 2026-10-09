import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, CreditCard, Tag } from 'lucide-react';

export const MarqueeBanner: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const messages = [
    {
      icon: CreditCard,
      text: isAr ? 'خيار دفع ولا بالأحلام .. قسّط فاتورتك على أربع دفعات مع تابي وتمارا بدون فوائد' : 'Split your bill into 4 interest-free payments with Tabby & Tamara',
      code: '0% INTEREST'
    },
    {
      icon: Tag,
      text: isAr ? 'الافتتاح الكبير بخصومات استثنائية: استخدم الكود MK5 واحصل على خصم إضافي 5% على كافة الباقات' : 'Grand celebration: Use code MK5 for an extra 5% discount on all bouquets',
      code: 'MK5'
    },
    {
      icon: Sparkles,
      text: isAr ? 'توصيل مجاني فوري داخل مكة المكرمة لكافة الطلبات فوق 299 ريال' : 'Complimentary express delivery across Mecca on orders above 299 SAR',
      code: 'FREE DELIVERY'
    }
  ];

  return (
    <div className="bg-[#122e1f] text-[#FAF9F5] border-y border-[#264b36] py-3 overflow-hidden select-none">
      <div className="flex items-center gap-12 whitespace-nowrap animate-marquee">
        {[...messages, ...messages, ...messages].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="flex items-center gap-3 shrink-0">
              <span className="w-6 h-6 rounded-full bg-[#e6ca98]/20 text-[#e6ca98] flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-medium tracking-wide">
                {item.text}
              </span>
              <span className="bg-[#e6ca98] text-[#102a1c] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                {item.code}
              </span>
              <span className="text-[#e6ca98]/50 text-xs">✦</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
