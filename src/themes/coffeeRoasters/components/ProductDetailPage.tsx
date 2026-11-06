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

  if (!product) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white text-neutral-600 text-sm">
        {language === 'AR' ? 'جاري تحميل المنتج' : 'Loading product'}
      </div>
    );
  }

  const categoryObj = CATEGORIES.find((c) => c.id === product.category);
  const categoryLabel = language === 'AR' ? (categoryObj?.nameAr || 'مكائن القهوة') : (categoryObj?.name || 'Coffee Machines');
  const specs = product.specs || [];
  const colors = product.colors || [];
  const images = product.images || [];
  const price = Number(product.basePrice) || 0;

  // Video demo controls
  const productVideoUrl = product.videoUrl || '';

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
  const showcaseParts: ProductPartShowcase[] = product.partsShowcase?.length
    ? product.partsShowcase
    : [];

  const heroBanner = product.heroBanner || {
    headlineEn: product.name,
    headlineAr: product.nameAr || product.name,
    sloganEn: product.tagline,
    sloganAr: product.taglineAr || product.tagline,
    badgeEn: product.badge || 'OFFICIAL KSA EDITION',
    badgeAr: product.badge || 'الإصدار الرسمي بالمملكة',
    bgGradient: 'from-[#061838] via-[#092558] to-[#030d22]',
    heroImage: (product as any).image || colors[0]?.image || images[0] || '/images/hibrew_h7a_flagship_machine.png',
    featuresEn: specs.slice(0, 4).map(s => `${s.label}: ${s.value}`),
    featuresAr: specs.slice(0, 4).map(s => `${s.labelAr || s.label}: ${s.valueAr || s.value}`)
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
                {language === 'AR' ? `${price.toLocaleString()}.00 ر.س` : `SAR ${price.toLocaleString()}.00`}
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
          {showcaseParts.length > 0 && (
          <>
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              {language === 'AR' ? 'تفاصيل المنتج' : 'Product details'}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-center">
              {language === 'AR' ? (product.nameAr || product.name) : product.name}
            </h2>
          </div>

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
          </>
          )}

          {/* 6th BANNER: CINEMATIC 4K VIDEO DEMONSTRATION (CLEAN PLAYER, NO OVERLAYS) */}
          {productVideoUrl ? (
          <article id="video-demo-section" className="space-y-6 sm:space-y-8 pt-6 scroll-mt-28">
            {/* Text story above video player */}
            <div className="space-y-3 max-w-4xl text-start">
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/10 text-neutral-300 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                {language === 'AR' ? 'فيديو المنتج' : 'Product video'}
              </span>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {language === 'AR' ? (product.nameAr || product.name) : product.name}
              </h2>

              <p className="text-sm sm:text-base lg:text-lg text-neutral-300 max-w-3xl leading-relaxed">
                {language === 'AR' ? (product.overviewAr || product.overview || '') : (product.overview || '')}
              </p>
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
                  {language === 'AR' ? 'فيديو المنتج' : 'Product video'}
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
          ) : null}
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
                ? 'المواصفات المحفوظة لهذا المنتج.'
                : 'Specifications saved for this product.'}
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden bg-white/5 border-0">
            <div className="divide-y divide-white/10">
              {specs.map((spec, sIdx) => (
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
            src={colors[0]?.image || images[0]}
            alt={product.name}
            className="w-14 h-14 object-contain rounded-xl bg-white/5 p-1 shrink-0"
          />

          <div className="min-w-0 pr-4">
            <h3 className="font-extrabold text-xs text-white truncate">
              {language === 'AR' && product.nameAr ? product.nameAr : product.name}
            </h3>
            <p className="text-[11px] text-neutral-400 font-sans font-bold mt-0.5">
              {language === 'AR' ? `${price.toLocaleString()}.00 ر.س` : `SAR ${price.toLocaleString()}.00`}
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
              {language === 'AR' ? `${price.toLocaleString()}.00 ر.س` : `SAR ${price.toLocaleString()}.00`}
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

