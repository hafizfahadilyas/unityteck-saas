import React from 'react';
import { useCart } from '../context/CartContext';
import { Sparkles, Gauge, Flame, Layers, Zap, ChevronRight, ShieldCheck } from 'lucide-react';

export const MachineStoryCinematic: React.FC = () => {
  const { language, navigateTo } = useCart();
  const [isVisible, setIsVisible] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.12 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const engineeringHighlights = [
    {
      titleEn: 'Dual Independent Brass Boilers',
      titleAr: 'نظام دبل بويلر نحاسي مزدوج',
      specEn: 'Dual 1450W Thermoblocks',
      specAr: 'سخانات مزدوجة 1450 واط',
      descEn: 'Simultaneous 20-bar espresso extraction and continuous dry microfoam steam without temperature drop.',
      descAr: 'استخلاص متزامن للإسبريسو وتبخير مستمر للحليب بنفس اللحظة دون هبوط بالضغط أو الحرارة.',
      icon: <Layers className="w-5 h-5 text-neutral-800" />
    },
    {
      titleEn: 'Italian ULKA 20-Bar Pump',
      titleAr: 'مضخة أولكا الإيطالية 20 بار',
      specEn: '20 Bar Peak Pressure',
      specAr: 'ضغط أقصى 20 بار',
      descEn: 'Ultra-stable electromagnetic pump delivering consistent pressure for thick hazelnut golden crema.',
      descAr: 'مضخة كهرومغناطيسية فائقة الثبات تضمن تدفق الكريمة الذهبية الكثيفة بدون تذبذب.',
      icon: <Gauge className="w-5 h-5 text-neutral-800" />
    },
    {
      titleEn: '58mm Commercial Brass Group',
      titleAr: 'رأس استخلاص تجاري 58 ملم',
      specEn: '58mm E61 Standard',
      specAr: 'معيار تجاري E61',
      descEn: 'Heavy commercial brass mass retains optimal thermal stability during back-to-back barista extractions.',
      descAr: 'كتلة نحاسية ثقيلة تحافظ على ثبات درجات الحرارة أثناء تحضير عدة أكواب متتالية.',
      icon: <Flame className="w-5 h-5 text-neutral-800" />
    },
    {
      titleEn: 'Micro-PID Intelligent Chip',
      titleAr: 'شريحة المعالجة الرقمية PID',
      specEn: '±0.5°C Precision Control',
      specAr: 'دقة حرارية ±0.5° مئوية',
      descEn: 'Real-time temperature feedback maintaining water temperature with microsecond digital regulation.',
      descAr: 'حساسات رقمية دقيقة تضبط حرارة الاستخلاص بدقة متناهية لمنع حرق النكهات والزيوت العطرية.',
      icon: <Zap className="w-5 h-5 text-neutral-800" />
    }
  ];

  return (
    <section
      ref={sectionRef}
      id="machine-story-section"
      className={`w-full max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-20 select-none transition-all duration-700 ease-out overflow-hidden ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Header: Honor-Style Minimal Clean Typography */}
      <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{language === 'AR' ? 'قصة الماكينة والحرفية الفاخرة' : 'The Machine Story & Craftsmanship'}</span>
        </div>

        <h2 className={`honor-heading text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-black text-center ${
          language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-tight tracking-[-0.01em]'
        }`}>
          {language === 'AR' ? 'هندسة دقيقة وتجربة قهوة ملكية' : 'Precision Engineering & The Coffee Journey'}
        </h2>
      </div>

      {/* Unified Single Stage Showcase (No Toggles, Honor Style Clean Card) */}
      <div className="rounded-3xl overflow-hidden bg-white group w-full">
        {/* Main Cutaway Architecture Visual */}
        <div className="relative w-full h-[240px] sm:h-[380px] lg:h-[480px] bg-neutral-100 overflow-hidden">
          <img
            src="./src/assets/images/coffee_machine_parts_reveal_1791221110232.jpg"
            alt="HiBrew Commercial Engineering Cutaway"
            className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy" decoding="async"
          />

          {/* Floating Badges */}
          <div className="absolute bottom-3 sm:bottom-6 inset-x-3 sm:inset-x-8 flex flex-wrap items-center justify-between gap-2 sm:gap-3 opacity-100">
            <span className="px-3 py-1 rounded-full bg-black text-white text-[11px] sm:text-xs font-bold opacity-100 truncate max-w-[220px] sm:max-w-none">
              {language === 'AR' ? 'المكونات الهندسية الداخلية للفئة الرائدة' : 'HiBrew Flagship Internal Cutaway'}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-emerald-800 text-[11px] sm:text-xs font-bold opacity-100 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{language === 'AR' ? 'ضمان الوكيل سنتين' : '2-Year Agency Warranty'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Clean Component Architecture Pillars */}
        <div className="p-4 sm:p-8 lg:p-10 bg-white w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-start w-full">
            {engineeringHighlights.map((item, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FA] space-y-2 transition-all w-full overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-neutral-800 bg-white px-2 py-0.5 rounded truncate max-w-[140px]">
                    {language === 'AR' ? item.specAr : item.specEn}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-neutral-900 pt-1 leading-snug">
                  {language === 'AR' ? item.titleAr : item.titleEn}
                </h3>

                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  {language === 'AR' ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>

          {/* Bottom Action Strip with Buy & Learn More */}
          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-neutral-600 font-medium text-center sm:text-start">
              {language === 'AR'
                ? 'تم اختبار ومعايرة كل ماكينة لضمان استخلاص متزن وضغط 20 بار حقيقي مع البورتافلتر 58 مم.'
                : 'Calibrated for home baristas: Dual thermoblocks deliver instant heat and commercial steam.'}
            </p>

            <div className="flex items-center gap-6 sm:gap-7 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigateTo('product-buy', 'hb-h10a-dualboiler')}
                className="h-10 px-7 sm:px-8 rounded-full bg-black hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm transition-all duration-200 active:scale-95 cursor-pointer text-center inline-flex items-center justify-center shadow-none"
              >
                <span>{language === 'AR' ? 'شراء' : 'Buy'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('product-detail', 'hb-h10a-dualboiler')}
                className="group/learn text-xs sm:text-sm font-medium text-neutral-900 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 text-center"
              >
                <span>{language === 'AR' ? 'تعرف على المزيد' : 'Learn More'}</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200 ${
                    language === 'AR' ? 'rotate-180 group-hover/learn:-translate-x-1' : 'group-hover/learn:translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

