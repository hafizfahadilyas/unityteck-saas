import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  Wrench,
  ShieldCheck,
  Truck,
  RotateCcw,
  X
} from 'lucide-react';
import { ProductPartShowcase } from '../types';
import { PRODUCTS, CATEGORIES } from '../data/products';

interface PartShowcaseBannerProps {
  part: ProductPartShowcase;
  index: number;
  language: string;
}

const PartShowcaseBanner: React.FC<PartShowcaseBannerProps> = ({ part, index, language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className={`space-y-6 sm:space-y-8 transition-all duration-700 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.99]'
      }`}
    >
      {/* 1. TEXT STORY BLOCK - Cleanly positioned ABOVE the banner (NO text overlay on top of image) */}
      <div className="space-y-4 max-w-4xl text-start">
        {/* Category & Feature Number Badge - Matching Hero Banner Badge Style */}
        <div className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span>
            {language === 'AR'
              ? `الميزة 0${index + 1} · ${part.tagAr}`
              : `FEATURE 0${index + 1} · ${part.tagEn}`}
          </span>
        </div>

        {/* Big Bold Headline - Exact Same Font Family, Size & Color as Hero Banner */}
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {language === 'AR' ? part.titleAr : part.titleEn}
        </h2>

        {/* Slogan / Subtitle Description - Matching Hero Banner Typography & Contrast */}
        <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-3xl leading-relaxed">
          {language === 'AR' ? part.descriptionAr : part.descriptionEn}
        </p>

        {/* Technical Stats Callout Chips - Matching Hero Banner 4-Chips Style */}
        {part.stats && part.stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            {part.stats.map((stat, sIdx) => (
              <div
                key={sIdx}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-neutral-300 font-medium">
                  {language === 'AR' ? stat.labelAr : stat.labelEn}:
                </span>
                <span className="text-white font-bold font-mono">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. FULL-WIDTH CLEAN BANNER IMAGE - 100% UNOBSTRUCTED, NO TEXT OVERLAY */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[620px] rounded-3xl overflow-hidden bg-neutral-900 border-0 shadow-2xl group">
        <img
          src={part.image}
          alt={part.titleEn}
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy" decoding="async"
        />
      </div>
    </article>
  );
};

export const ProductDetailPage: React.FC = () => {
  const { selectedProduct, navigateTo, goBack, language } = useCart();
  const product = selectedProduct;

  const categoryObj = CATEGORIES.find(c => c.id === product.category);
  const categoryLabel = language === 'AR' ? (categoryObj?.nameAr || 'مكائن القهوة') : (categoryObj?.name || 'Coffee Machines');

  type TabType = 'overview' | 'features' | 'video' | 'specs' | 'warranty';
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showFloatingCard, setShowFloatingCard] = useState(false);
  const [isCardDismissed, setIsCardDismissed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const scrollToSection = (sectionId: string, tab: TabType) => {
    setActiveTab(tab);
    if (sectionId === 'hero-section') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -145;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Scroll listener for sticky sub-bar tab highlighting & floating card
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        setShowFloatingCard(true);
      } else {
        setShowFloatingCard(false);
      }

      // Track active section automatically
      const sections: { id: string; tab: TabType }[] = [
        { id: 'warranty-section', tab: 'warranty' },
        { id: 'specs-section', tab: 'specs' },
        { id: 'video-demo-section', tab: 'video' },
        { id: 'parts-showcase-section', tab: 'features' },
        { id: 'hero-section', tab: 'overview' },
      ];

      const scrollPosition = window.scrollY + 160;
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveTab(sec.tab);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Video demo controls
  const productVideoUrl = product.category === 'machines'
    ? 'https://assets.mixkit.co/videos/preview/mixkit-coffee-being-poured-into-a-cup-from-a-coffee-machine-42861-large.mp4'
    : product.category === 'mills'
    ? 'https://assets.mixkit.co/videos/preview/mixkit-making-coffee-with-an-espresso-machine-42862-large.mp4'
    : 'https://assets.mixkit.co/videos/preview/mixkit-pouring-milk-into-a-cup-of-coffee-to-make-latte-42865-large.mp4';

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Default fallback parts in case a product has incomplete showcase data
  const defaultParts: ProductPartShowcase[] = [
    {
      id: 'part-core-engineering',
      tagEn: 'PRECISION CORE ARCHITECTURE',
      tagAr: 'الهندسة الداخلية المتطورة',
      titleEn: 'Dual PID Independent Thermoblocks & 20-Bar Pump',
      titleAr: 'نظام دبل بويلر المستقل ومضخة 20 بار إيطالية',
      descriptionEn: 'Engineered with dual independent thermoblocks for simultaneous 93°C extraction and continuous dry microfoam steaming with zero recovery lag.',
      descriptionAr: 'وحدتا تسخين إلكترونيتان مستقلتان تعملان بتقنية PID الذكية؛ وحدة للاستخلاص عند حرارة 92°-94° مئوية، ووحدة مستقلة للتبخير الفوري عند 130° مئوية في آن واحد دون انخفاض في الضغط.',
      image: './src/assets/images/hibrew_barista_pro_exploded_parts_1791364960592.jpg',
      stats: [
        { labelEn: 'Pump System', labelAr: 'قوة المضخة', value: '20-Bar ULKA' },
        { labelEn: 'Heating Architecture', labelAr: 'وحدات التسخين', value: 'Dual PID' },
        { labelEn: 'Thermal Variance', labelAr: 'ثبات الحرارة', value: '±0.5°C' }
      ]
    },
    {
      id: 'part-extraction-group',
      tagEn: '58MM COMMERCIAL STANDARD',
      tagAr: 'مقبس تجاري 58 ملم',
      titleEn: 'Commercial 58.4mm Stainless Grouphead & Velvet Crema Flow',
      titleAr: 'مقبس تجاري 58 ملم وتدفق كريمة ذهبية مخملية',
      descriptionEn: 'Industry-standard 58.4mm commercial grouphead compatible with pro barista portafilters. Features programmable 1-10s low-pressure pre-infusion to prevent water channeling.',
      descriptionAr: 'رأس استخلاص تجاري حقيقي من الستانلس ستيل والنحاس مقاس 58 ملم مطابق لمكائن المقاهي المختصة، مع نظام ترطيب مسبق قابل للبرمجة لمنع القنوات المائية.',
      image: './src/assets/images/coffee_making_crema_flow_1791221127339.jpg',
      stats: [
        { labelEn: 'Portafilter Size', labelAr: 'مقاس البورتافلتر', value: '58.4mm' },
        { labelEn: 'Pre-Infusion', labelAr: 'الترطيب المسبق', value: '1-10s' },
        { labelEn: 'Filter Basket', labelAr: 'الباسكت الدقيق', value: '18g Precision' }
      ]
    },
    {
      id: 'part-pressure-meter',
      tagEn: 'ANALOG BARISTA GAUGE',
      tagAr: 'مقياس ضغط الباريستا',
      titleEn: 'Real-Time Visual Barista Pressure Extraction Gauge',
      titleAr: 'مقياس ضغط استخلاص حقيقي لمراقبة تدفق القهوة',
      descriptionEn: 'Analog pressure meter monitoring real extraction resistance between 9 and 15 bar in real-time, helping dial in grind size with laboratory precision.',
      descriptionAr: 'مؤشر عقارب كلاسيكي أنيق يعرض ضغط الاستخلاص الفعلي لحظة بلحظة؛ يمنحك رؤية فورية لمنطقة الاستخلاص الذهبي بين 9 و 12 بار.',
      image: './src/assets/images/hibrew_barista_pro_details_showcase_1791364980884.jpg',
      stats: [
        { labelEn: 'Optimal Zone', labelAr: 'المنطقة الذهبية', value: '9 – 12 Bar' },
        { labelEn: 'Max Pressure', labelAr: 'الضغط الأقصى', value: '20 Bar' },
        { labelEn: 'Dial Body', labelAr: 'خامة المؤشر', value: 'Solid Brass' }
      ]
    },
    {
      id: 'part-steam-wand',
      tagEn: 'COMMERCIAL STEAM WAND',
      tagAr: 'عصا التبخير التجارية',
      titleEn: '3-Hole Commercial Cool-Touch Microfoam Steam Wand',
      titleAr: 'عصا تبخير تجارية 3 فتحات لرسم اللاتيه آرت',
      descriptionEn: 'Stainless steel 3-hole commercial nozzle delivering dry 135°C steam for silky microfoam velvet texture, perfect for pouring intricate latte art rosettas.',
      descriptionAr: 'عصا تبخير ستانلس ستيل عازلة للحرارة Cool-Touch مزودة بـ 3 فتحات دقيقة لتوليد بخار جاف قوي لرغوة ميكروفوم حريرية.',
      image: './src/assets/images/barista_milk_steaming_1791363367164.jpg',
      stats: [
        { labelEn: 'Steam Nozzle', labelAr: 'فتحات التبخير', value: '3-Hole Precision' },
        { labelEn: 'Steam Temp', labelAr: 'حرارة البخار', value: '135°C Dry' },
        { labelEn: 'Grip Sleeve', labelAr: 'مقبض الأمان', value: 'Cool-Touch Silicon' }
      ]
    },
    {
      id: 'part-chassis-warranty',
      tagEn: '2-YEAR KSA AGENCY WARRANTY',
      tagAr: 'ضمان الوكيل سنتين',
      titleEn: 'Hand-Polished Stainless Steel Chassis & Official Warranty',
      titleAr: 'هيكل ستانلس ستيل فاخر وضمان شامل سنتين بالمملكة',
      descriptionEn: 'Constructed from heavy gauge 304 food-grade stainless steel with luxury walnut hardwood accents, backed by 2-year authorized agency warranty in KSA.',
      descriptionAr: 'هيكل معدني متين من الفولاذ المقاوم للصدأ 304 مع لمسات خشب الجوز الطبيعي، مدعوم بضمان الوكيل المعتمد في المملكة لمدة سنتين.',
      image: './src/assets/images/coffee_machine_story_craft_1791221163767.jpg',
      stats: [
        { labelEn: 'Agency Warranty', labelAr: 'ضمان الوكيل', value: '2 Years Full' },
        { labelEn: 'Water Tank', labelAr: 'سعة الخزان', value: '2.5L BPA-Free' },
        { labelEn: 'Chassis Material', labelAr: 'خامة الهيكل', value: '304 Solid Steel' }
      ]
    }
  ];

  // Exact 5 to 6 Full-Width Showcases
  const showcaseParts: ProductPartShowcase[] = product.partsShowcase && product.partsShowcase.length >= 5
    ? product.partsShowcase.slice(0, 5)
    : defaultParts.slice(0, 5);

  const heroBanner = product.heroBanner || {
    headlineEn: product.name,
    headlineAr: product.nameAr || product.name,
    sloganEn: product.tagline,
    sloganAr: product.taglineAr || product.tagline,
    badgeEn: product.badge || 'OFFICIAL KSA EDITION',
    badgeAr: product.badge || 'الإصدار الرسمي بالمملكة',
    bgGradient: 'from-[#061838] via-[#092558] to-[#030d22]',
    heroImage: (product as any).image || product.colors?.[0]?.image || product.images?.[0] || '/src/assets/images/hibrew_h7a_flagship_machine.png',
    featuresEn: product.specs.slice(0, 4).map(s => `${s.label}: ${s.value}`),
    featuresAr: product.specs.slice(0, 4).map(s => `${s.labelAr || s.label}: ${s.valueAr || s.value}`)
  };

  // Honor style heading: First word(s) BOLD, next words LIGHT
  const renderHonorHeading = () => {
    if (language === 'AR') {
      const titleAr = heroBanner.headlineAr || product.nameAr || product.name;
      // Clean prefix if present
      const cleanTitle = titleAr.replace(/^(ماكينة قهوة\s+|ماكينة\s+)/i, '');
      const words = cleanTitle.trim().split(/\s+/);
      const boldWord = words[0] || 'هايبرو';
      const restWords = words.slice(1).join(' ') || 'بارستا برو H7A دبل بويلر';
      return (
        <span className="inline-flex flex-wrap items-baseline gap-x-2.5 sm:gap-x-3 gap-y-1">
          <span className="font-black text-white text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight">
            {boldWord}
          </span>
          <span className="font-light text-white/95 text-2xl xs:text-3xl sm:text-5xl lg:text-6xl tracking-tight">
            {restWords}
          </span>
          {product.category === 'machines' && (
            <span className="text-[11px] xs:text-xs sm:text-sm font-mono px-2 sm:px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-white/80 font-normal">
              20 بار
            </span>
          )}
        </span>
      );
    }

    const titleEn = heroBanner.headlineEn || product.name;
    const words = titleEn.trim().split(/\s+/);
    const boldWord = words[0] || 'HiBrew';
    const restWords = words.slice(1).filter(w => !w.toLowerCase().includes('20-bar')).join(' ') || 'Barista Pro H7A';

    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-2.5 sm:gap-x-3 gap-y-1">
        <span className="font-black tracking-tight text-white uppercase text-2xl xs:text-3xl sm:text-5xl lg:text-6xl">
          {boldWord}
        </span>
        <span className="font-light tracking-normal text-white/95 text-2xl xs:text-3xl sm:text-5xl lg:text-6xl">
          {restWords}
        </span>
        {product.category === 'machines' && (
          <span className="text-[11px] xs:text-xs sm:text-sm font-mono px-2 sm:px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-white/80 font-normal">
            20-BAR
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#050B16] text-white text-start pb-28 sm:pb-24 selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-clip font-sans">
      {/* ========================================================================= */}
      {/* 1. HONOR-STYLE STICKY SUB-BAR (Breadcrumbs, Back Button, Multi-Sections, Buy CTA) */}
      {/* ========================================================================= */}
      <header className="sticky top-16 z-40 bg-[#050B16]/95 backdrop-blur-md border-b border-white/10 w-full max-w-full shadow-lg">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Row: Back button, Breadcrumbs, and Price/Buy Action */}
          <div className="h-11 sm:h-12 flex items-center justify-between gap-3 w-full min-w-0 border-b border-white/5 py-1 sm:py-1.5">
            {/* Left/Start: Back Button & Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
              {/* Prominent Back Button */}
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer shrink-0 shadow-xs active:scale-95"
                title={language === 'AR' ? 'الرجوع للصفحة السابقة' : 'Go back'}
              >
                {language === 'AR' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{language === 'AR' ? 'رجوع' : 'Back'}</span>
              </button>

              <span className="text-white/25 shrink-0 hidden xs:inline">|</span>

              {/* Breadcrumbs Trail */}
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400 whitespace-nowrap min-w-0">
                <button
                  onClick={() => navigateTo('home')}
                  className="hover:text-white transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {language === 'AR' ? 'الرئيسية' : 'Home'}
                </button>
                <span className="text-white/20 shrink-0">/</span>
                <button
                  onClick={() => navigateTo('products')}
                  className="hover:text-white transition-colors cursor-pointer shrink-0 font-medium"
                >
                  {language === 'AR' ? 'المنتجات' : 'Products'}
                </button>
                <span className="text-white/20 shrink-0 hidden sm:inline">/</span>
                <button
                  onClick={() => navigateTo('products')}
                  className="hover:text-white transition-colors cursor-pointer shrink-0 font-medium text-neutral-400 hidden sm:inline"
                >
                  {categoryLabel}
                </button>
                <span className="text-white/20 shrink-0">/</span>
                <span className="font-bold text-white truncate max-w-[130px] sm:max-w-[240px] md:max-w-xs text-neutral-100">
                  {language === 'AR' && product.nameAr ? product.nameAr : product.name}
                </span>
              </nav>
            </div>

            {/* Right/End: Price & Buy Now CTA */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-black text-white font-sans hidden sm:inline">
                {language === 'AR' ? `${product.basePrice.toLocaleString()}.00 ر.س` : `SAR ${product.basePrice.toLocaleString()}.00`}
              </span>
              <button
                onClick={() => navigateTo('product-buy', product.id)}
                className="px-3.5 sm:px-4 py-1 sm:py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Multi-Sections Navigation Bar (Visible and scrollable on both mobile & desktop) */}
          <div className="py-1 sm:py-1.5 overflow-x-auto no-scrollbar flex items-center gap-1 sm:gap-1.5">
            {[
              { id: 'hero-section', tab: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview' },
              { id: 'parts-showcase-section', tab: 'features', labelAr: 'المميزات والهندسة', labelEn: 'Features' },
              { id: 'video-demo-section', tab: 'video', labelAr: 'العرض العملي', labelEn: 'Live Demo' },
              { id: 'specs-section', tab: 'specs', labelAr: 'المواصفات الفنية', labelEn: 'Tech Specs' },
              { id: 'warranty-section', tab: 'warranty', labelAr: 'الضمان والوكيل', labelEn: 'Warranty' },
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => scrollToSection(item.id, item.tab as TabType)}
                className={`px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === item.tab
                    ? 'bg-white text-neutral-950 font-bold shadow-xs'
                    : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {language === 'AR' ? item.labelAr : item.labelEn}
              </button>
            ))}

            {/* Quick jump to Buy Options */}
            <button
              onClick={() => navigateTo('product-buy', product.id)}
              className="ltr:ml-auto rtl:mr-auto hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer px-2 py-0.5"
            >
              <Sparkles className="w-3 h-3" />
              <span>{language === 'AR' ? 'تخصيص الخيارات والملحقات ←' : 'Configure & Buy Options →'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HONOR-STYLE FULL-WIDTH HERO COVER BANNER (SIDE TEXT + BOLD/LIGHT TITLE) */}
      {/* ========================================================================= */}
      <section id="hero-section" className="relative w-full min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center overflow-hidden border-0 select-none scroll-mt-28">
        {/* Full Cover Hero Background Image */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          <img
            src={heroBanner.heroImage}
            alt={heroBanner.headlineEn}
            className={`w-full h-full object-cover ${
              language === 'AR'
                ? 'object-center lg:object-[25%_center]'
                : 'object-center lg:object-[75%_center]'
            } transform scale-100 transition-transform duration-1000 ease-out`}
            fetchPriority="high"
            loading="eager"
          />

          {/* Cinematic Directional Gradient Scrim: Deep dark on text side, revealing the machine on the other side */}
          <div
            className={`absolute inset-0 z-10 ${
              language === 'AR'
                ? 'bg-gradient-to-l from-[#050B16] via-[#050B16]/85 via-45% sm:via-55% to-transparent'
                : 'bg-gradient-to-r from-[#050B16] via-[#050B16]/85 via-45% sm:via-55% to-transparent'
            }`}
          />

          {/* Top and Bottom soft atmospheric fading */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050B16] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#050B16] to-transparent z-10 pointer-events-none" />
        </div>

        {/* Hero Content: Placed on the side (left in LTR, right in RTL) matching Honor Magic8 Pro */}
        <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-8 lg:px-14 relative z-20 py-12 sm:py-20 lg:py-24">
          <div className="max-w-xl lg:max-w-2xl space-y-5 sm:space-y-7 text-start">
            {/* Model Title: Honor Typography (Brand BOLD, Model LIGHT) */}
            <h1 className={`honor-heading text-white ${
              language === 'AR' ? 'leading-[1.3] sm:leading-[1.4] tracking-normal' : 'leading-tight tracking-[-0.01em]'
            }`}>
              {renderHonorHeading()}
            </h1>

            {/* Buy Now & Video Buttons Directly Underneath */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pt-1">
              <button
                onClick={() => navigateTo('product-buy', product.id)}
                className="px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-black text-xs sm:text-sm transition-all transform active:scale-95 shadow-xl hover:shadow-2xl cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-black" />
                <span>{language === 'AR' ? 'شراء الآن' : 'Buy Now'}</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('video-demo-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current text-white" />
                <span>{language === 'AR' ? 'مشاهدة الفيديو' : 'Click to Watch Video'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Cart Shortcut Icon in Corner */}
        <div className={`absolute bottom-4 sm:bottom-6 ${language === 'AR' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} z-20 flex items-center gap-2.5`}>
          <button
            onClick={() => navigateTo('cart')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105"
            title="Cart"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LEARN MORE PAGE SHOWCASE: 5 TO 6 CINEMATIC BANNERS & IMAGES (NO OVERLAYS)*/}
      {/* ========================================================================= */}
      <main className="max-w-[1360px] mx-auto px-4 lg:px-8 py-12 sm:py-20 space-y-20 sm:space-y-28">
        {/* SECTION HEADER */}
        {/* SECTION HEADER */}
        <section id="parts-showcase-section" className="space-y-16 sm:space-y-24 scroll-mt-28">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              {language === 'AR' ? 'المواصفات والاستخدام' : 'FEATURES & HARDWARE BREAKDOWN'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              {language === 'AR' ? 'استكشف تقنيات وأجزاء الماكينة وطريقة الاستخدام' : 'Precision Hardware, Extraction & Usage'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {language === 'AR'
                ? 'استكشف أدق تفاصيل الهندسة الداخلية للماكينة وطريقة استخدامها لتحضير ألذ كوب قهوة متطابق مع المواصفات السعودية.'
                : 'Explore authentic high-resolution component breakdowns, machine operation, and commercial café extraction.'}
            </p>
          </div>

          {/* 5 Full-Width Showcase Banners (Text Above, Image Clean Below) */}
          <div className="space-y-20 sm:space-y-28">
            {showcaseParts.map((part, index) => (
              <PartShowcaseBanner
                key={part.id}
                part={part}
                index={index}
                language={language}
              />
            ))}
          </div>

          {/* 6th BANNER: CINEMATIC 4K VIDEO DEMONSTRATION (CLEAN PLAYER, NO OVERLAYS) */}
          <article id="video-demo-section" className="space-y-6 sm:space-y-8 pt-6 scroll-mt-28">
            {/* Text story above video player */}
            <div className="space-y-3 max-w-4xl text-start">
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                {language === 'AR'
                  ? 'الميزة 06 · استعراض الأداء المباشر'
                  : 'FEATURE 06 · LIVE EXTRACTION PERFORMANCE'}
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {language === 'AR'
                  ? 'عالم الاستخلاص المثالي والكريمة الذهبية 4K'
                  : 'Pure Extraction & Golden Crema Precision 4K'}
              </h2>

              <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-3xl leading-relaxed">
                {language === 'AR'
                  ? 'شاهد تدفق الإسبريسو الناعم مع ثبات الضغط ونعومة الطحن المتوازنة لمنع احتراق النكهات الطبيعية للبن وتحقيق أعلى معايير الباريستا.'
                  : 'Experience silky espresso flow under calibrated pressure and active thermal equilibrium, preserving origin tasting notes.'}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-neutral-300 font-medium">{language === 'AR' ? 'الجودة' : 'Resolution'}:</span>
                  <span className="text-white font-bold font-mono">4K Cinema HDR</span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-neutral-300 font-medium">{language === 'AR' ? 'معدل الإطارات' : 'Frame Rate'}:</span>
                  <span className="text-white font-bold font-mono">60 FPS Smooth</span>
                </div>
              </div>
            </div>

            {/* Clean 4K Video Banner Container */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] max-h-[620px] rounded-3xl overflow-hidden bg-black border-0 shadow-2xl group">
              <video
                ref={videoRef}
                src={productVideoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Video control buttons placed in clean top-corner bar */}
              <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex items-center justify-between z-10 pointer-events-auto">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/90 text-[11px] font-mono border border-white/10">
                  LIVE 4K DEMO
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleVideoPlay}
                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors border border-white/15"
                    title={isVideoPlaying ? 'Pause' : 'Play'}
                  >
                    {isVideoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors border border-white/15"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* ========================================================================= */}
        {/* 4. TECHNICAL HARDWARE SPECIFICATIONS SUMMARY                              */}
        {/* ========================================================================= */}
        <section id="specs-section" className="space-y-8 pt-10 border-t border-white/10 scroll-mt-28">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              {language === 'AR' ? 'المعايير والمواصفات' : 'Technical Specifications'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              {language === 'AR' ? 'المواصفات الفنية المعتمدة' : 'Official Hardware Specs'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto">
              {language === 'AR'
                ? 'المعايير الهندسية المصنعية المعتمدة لماكينة هاي برو معتمدة من الوكيل الرسمي.'
                : 'Certified industrial engineering specifications for optimal espresso performance.'}
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white/5 border-0">
            <div className="divide-y divide-white/10">
              {product.specs.map((spec, sIdx) => (
                <div key={sIdx} className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-white/5 transition-colors">
                  <div className="sm:col-span-4 font-bold text-xs sm:text-sm text-neutral-200">
                    {language === 'AR' && spec.labelAr ? spec.labelAr : spec.label}
                  </div>
                  <div className="sm:col-span-8 text-xs sm:text-sm text-neutral-300 mt-1 sm:mt-0 font-mono">
                    {language === 'AR' && spec.valueAr ? spec.valueAr : spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. BOTTOM OFFICIAL HONOR-STYLE CTA BANNER                                  */}
        {/* ========================================================================= */}
        <section id="warranty-section" className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-0 text-center space-y-6 scroll-mt-28">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border-0 backdrop-blur-md">
              {language === 'AR' ? 'ضمان رسمي سنتين شامل الوكيل' : 'Official 2-Year Agency Warranty'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {language === 'AR'
                ? 'شحن فوري مجاني لكافة مدن المملكة · إمكانية التقسيط على 4 دفعات بدون فوائد عبر تابي وتمارا'
                : 'Free express delivery across KSA · 4 interest-free installments via Tabby & Tamara'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigateTo('product-buy', product.id)}
              className="px-8 py-3.5 bg-white hover:bg-neutral-100 text-neutral-950 font-black text-sm rounded-full transition-transform active:scale-95 cursor-pointer shadow-lg flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>{language === 'AR' ? 'شراء المنتج الآن' : 'Buy Now'}</span>
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 6. HONOR-STYLE SCROLL-TRIGGERED FLOATING CARD                              */}
      {/* ========================================================================= */}
      {showFloatingCard && !isCardDismissed && (
        <aside
          role="region"
          aria-label="Quick Purchase Floating Card"
          className="hidden md:flex fixed bottom-24 right-6 z-40 bg-[#0A1220]/95 backdrop-blur-md rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/15 p-3.5 items-center gap-3.5 max-w-[340px] animate-fadeIn transition-all duration-300"
        >
          <button
            onClick={() => setIsCardDismissed(true)}
            aria-label="Dismiss quick purchase"
            className="absolute top-2 right-2 text-neutral-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <img
            src={product.colors[0]?.image || product.images[0]}
            alt={product.name}
            className="w-14 h-14 object-contain rounded-xl bg-white/5 p-1 shrink-0"
          />

          <div className="min-w-0 pr-4">
            <h3 className="font-extrabold text-xs text-white truncate">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </h3>
            <p className="text-[11px] text-neutral-400 font-sans font-bold mt-0.5">
              {language === 'AR' ? `${product.basePrice.toLocaleString()}.00 ر.س` : `SAR ${product.basePrice.toLocaleString()}.00`}
            </p>
            <div className="mt-2">
              <button
                onClick={() => navigateTo('product-buy', product.id)}
                className="px-6 py-1.5 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-xs"
              >
                {language === 'AR' ? 'شراء' : 'Buy'}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 7. MOBILE ONLY BOTTOM COMPACT BAR                                         */}
      {/* ========================================================================= */}
      <aside className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#050B16]/95 backdrop-blur-md py-3 px-4 border-t border-white/15 shadow-2xl w-full">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="min-w-0 truncate">
            <div className="font-extrabold text-xs text-white truncate">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </div>
            <div className="text-[11px] text-neutral-400 font-sans font-bold">
              {language === 'AR' ? `${product.basePrice.toLocaleString()}.00 ر.س` : `SAR ${product.basePrice.toLocaleString()}.00`}
            </div>
          </div>

          <button
            onClick={() => navigateTo('product-buy', product.id)}
            className="px-6 py-2 bg-white hover:bg-neutral-100 text-neutral-950 font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            {language === 'AR' ? 'شراء الآن' : 'Buy Now'}
          </button>
        </div>
      </aside>
    </div>
  );
};

