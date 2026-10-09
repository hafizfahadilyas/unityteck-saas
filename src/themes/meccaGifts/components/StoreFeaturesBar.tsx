import React from 'react';
import { useApp } from '../context/AppContext';

export const StoreFeaturesBar: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const features = [
    {
      icon: 'https://cdn.salla.sa/form-builder/YTk7soYWpqATCTQMdhQFNbpVRd6q1BH6aDThO56a.gif',
      title: isAr ? 'جميع المنتجات أصلية' : '100% Authentic Fresh Blooms',
      desc: isAr ? 'ضمان نضارة وأصالة على جميع الباقات' : 'Freshness & botanical quality guarantee'
    },
    {
      icon: 'https://cdn.salla.sa/form-builder/i86cej8qEVFxCgAxcnulZu8ysNWKKs6WWmPNbcdX.gif',
      title: isAr ? 'شحن سريع ومبرد' : 'Express Chilled Delivery',
      desc: isAr ? 'توصيل فوري داخل مكة وفي نفس اليوم' : 'Same-day express delivery across Mecca'
    },
    {
      icon: 'https://cdn.salla.sa/form-builder/MaDGzkP6DK84Tlix9d7EgX5gw9Kf5088TYHqQKu6.gif',
      title: isAr ? 'تسوق ودفع آمن 100%' : '100% Secure Checkout',
      desc: isAr ? 'مدى، Apple Pay، وبطاقات الائتمان' : 'Mada, Apple Pay & encrypted gateways'
    },
    {
      icon: 'https://cdn.salla.sa/form-builder/lA1WGskWYRFLzIMfJdipVN4zuYxSxFTXc2uQDyJp.gif',
      title: isAr ? 'تقسيط المشتريات مريح' : 'Interest-Free Installments',
      desc: isAr ? 'على 4 دفعات ميسرة مع تابي وتمارا' : 'Split in 4 easy payments with Tabby & Tamara'
    }
  ];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-[#102a1c] text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-white/10">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4 first:pt-0 first:px-0">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15 p-2">
                <img
                  src={feat.icon}
                  alt={feat.title}
                  className="w-full h-full object-contain filter brightness-110"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#f5f1e8] font-serif leading-snug">
                  {feat.title}
                </h4>
                <p className="text-xs text-[#a9bcae] mt-0.5">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
