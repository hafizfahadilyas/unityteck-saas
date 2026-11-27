import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { isSouqCommonTenant } from '../../souqCommon/isSouqCommonTenant';
import { Users, Sparkles, Award, Clock, HeartHandshake, Headphones, PackageCheck, Star, ShieldCheck } from 'lucide-react';

export const MetricsSection: React.FC = () => {
  const { language } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isSouq = isSouqCommonTenant(activeStore) || (activeStore?.id && activeStore.id !== 'store-1' && activeStore.id !== 'store-coffee');

  const [hasAnimated, setHasAnimated] = useState(false);
  const [counts, setCounts] = useState({
    clients: 0,
    edits: 0,
    years: 0
  });

  const sectionRef = useRef<HTMLDivElement>(null);

  // Trigger counting animation when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Animate clients to 10,000
          const duration = 2000;
          const frameDuration = 1000 / 60;
          const totalFrames = Math.round(duration / frameDuration);
          let frame = 0;

          const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);

            setCounts({
              clients: Math.min(10000, Math.floor(easeOut * 10000)),
              edits: Math.min(250, Math.floor(easeOut * 250)),
              years: Math.min(5, Math.floor(easeOut * 5))
            });

            if (frame >= totalFrames) {
              clearInterval(timer);
            }
          }, frameDuration);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const floraStats = [
    {
      value: `+${counts.clients.toLocaleString()}`,
      label: isAr ? 'عميل سعيد ومميز' : 'Delighted Clients',
      sub: isAr ? 'مكة المكرمة والمنطقة الغربية' : 'Mecca & Western Province',
      icon: Users
    },
    {
      value: `+${counts.edits}`,
      label: isAr ? 'تنسيق زهور استثنائي' : 'Luxury Floral Edits',
      sub: isAr ? 'صناعة يدوية بأيدي خبراء' : 'Artisanal hand-crafted',
      icon: Sparkles
    },
    {
      value: `+${counts.years}`,
      label: isAr ? 'سنوات من العراقة والتميز' : 'Years of Heritage',
      sub: isAr ? 'إتقان متفرد في فن الإهداء' : 'Fine floristry excellence',
      icon: Award
    },
    {
      value: '24/7',
      label: isAr ? 'خدمة كونسيرج متواصلة' : 'Concierge Care',
      sub: isAr ? 'مساعد شخصي لخدمتك فوراً' : 'VIP personalized assistance',
      icon: Headphones
    }
  ];

  const retailStats = [
    {
      value: `+${counts.clients.toLocaleString()}`,
      label: isAr ? 'عميل سعيد وموثوق' : 'Happy Customers',
      sub: isAr ? 'في كافة مناطق ومدن المملكة' : 'Across all Saudi cities',
      icon: Users
    },
    {
      value: `+${(counts.edits * 6 || 1500).toLocaleString()}`,
      label: isAr ? 'طلب مكتمل وشحن سريع' : 'Delivered Orders',
      sub: isAr ? 'تغليف احترافي وضمان استبدال' : 'Insured delivery & easy returns',
      icon: PackageCheck
    },
    {
      value: '4.9 / 5',
      label: isAr ? 'تقييم رضا العملاء' : 'Customer Satisfaction',
      sub: isAr ? 'مبني على تقييمات موثوقة حقيقية' : 'Based on verified reviews',
      icon: Star
    },
    {
      value: '24/7',
      label: isAr ? 'خدمة عملاء ودعم متواصل' : 'Dedicated Support',
      sub: isAr ? 'مساعد فوري عبر الواتساب' : 'Instant WhatsApp assistance',
      icon: Headphones
    }
  ];

  const stats = isSouq ? retailStats : floraStats;

  const containerBg = isSouq
    ? 'bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white p-8 sm:p-12 shadow-2xl border border-slate-700/60'
    : 'bg-gradient-to-br from-[#0c2116] via-[#143522] to-[#0c2116] text-white p-8 sm:p-12 shadow-2xl border border-[#e6ca98]/30';

  const iconHaloStyle = isSouq
    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 group-hover:bg-teal-500/30'
    : 'bg-[#e6ca98]/15 border-[#e6ca98]/40 text-[#e6ca98] group-hover:bg-[#e6ca98]/25';

  const valueTextStyle = isSouq ? 'text-teal-400' : 'text-[#e6ca98]';

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Luxury Container */}
      <div className={`relative rounded-3xl overflow-hidden ${containerBg}`}>
        
        {/* Ambient Glow Accents */}
        <div className={`absolute top-0 right-0 w-80 h-80 bg-radial ${isSouq ? 'from-teal-500/10' : 'from-[#e6ca98]/15'} via-transparent to-transparent rounded-full -mr-32 -mt-32 pointer-events-none`} />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-radial from-[#102a1c] via-transparent to-transparent rounded-full -ml-32 -mb-32 pointer-events-none" />

        <div className={`relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse ${isSouq ? 'divide-slate-700/50' : 'divide-[#e6ca98]/20'}`}>
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="pt-6 sm:pt-0 px-2 sm:px-4 flex flex-col items-center justify-center group"
              >
                {/* Glowing Halo Icon Container */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center mb-3 shadow-inner group-hover:scale-110 transition-all duration-300 ${iconHaloStyle}`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8]" />
                </div>

                {/* Animated Value */}
                <span className={`text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif tracking-tight block drop-shadow-md ${valueTextStyle}`}>
                  {stat.value}
                </span>

                {/* Label */}
                <p className="text-sm sm:text-base font-bold text-[#FAF9F5] mt-2 font-sans">
                  {stat.label}
                </p>

                {/* Subtitle */}
                <p className="text-xs text-slate-300 mt-1 font-light max-w-[200px] leading-relaxed">
                  {stat.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
