import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { MECCA_WHATSAPP } from '../data/mockData';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Volume2,
  VolumeX,
  MessageCircle,
  Coffee,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface VideoAccordionPanel {
  id: string;
  num: string;
  tag: string;
  tagEn: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  ctaText: string;
  ctaTextEn: string;
  videoUrl: string;
  categoryFilter?: string;
  whatsAppText: string;
  accentColor: string;
}

export const SAUDI_COFFEE_PANELS: VideoAccordionPanel[] = [
  {
    id: 'panel-1',
    num: '01',
    tag: 'ضيافة سعودية فاخرة',
    tagEn: 'Royal Saudi Hospitality',
    title: 'الدلة المكية الملكية والقهوة الشقراء',
    titleEn: 'Royal Mecca Golden Roast Dallah',
    description: 'أصالة الضيافة الحجازية مع القهوة السعودية الشقراء المحوجة بأفخر أنواع الهيل والزعفران، تُصب بمهابة في فناجيل الكرم الحجازي.',
    descriptionEn: 'The majesty of Saudi golden coffee brewed with imperial cardamom and saffron, poured gracefully from gilded dallah carafes.',
    ctaText: 'اطلب طقم الدلة والقهوة الملكية',
    ctaTextEn: 'Order Royal Dallah Set',
    videoUrl: 'https://framerusercontent.com/assets/FG8386Hk7nDg3uNeUpuIuxEqQA.mp4',
    categoryFilter: 'ورد و قهوة و حلا',
    whatsAppText: 'مرحباً هدايا مكة، أرغب في طلب طقم الدلة المكية الملكية والقهوة السعودية مع باقة الورد.',
    accentColor: '#d4af37'
  },
  {
    id: 'panel-2',
    num: '02',
    tag: 'بن خولاني سعودي أصيل',
    tagEn: 'Artisan Khawlani Beans',
    title: 'تحميص البن الخولاني المعتق',
    titleEn: 'Artisan Khawlani Heritage Roast',
    description: 'محاصيل بن سعودية نادرة مختارة بعناية من قمم جبال جازان والجنوب، تحميص يدوي نخب أول يملأ الأجواء بعبق التراث ونكهات الحجاز العريقة.',
    descriptionEn: 'Handpicked heirloom Khawlani coffee beans roasted to perfection, filling majlis halls with authentic highland aromas.',
    ctaText: 'تصفح تشكيلة القهوة المختصة',
    ctaTextEn: 'Explore Specialty Coffee',
    videoUrl: 'https://framerusercontent.com/assets/Ayt3BZEkCuduYMfN1UStV70YO8c.mp4',
    categoryFilter: 'ورد و قهوة و حلا',
    whatsAppText: 'مرحباً، أود الاستفسار وطلب تشكيلة البن الخولاني الفاخر وبوكس الإهداء.',
    accentColor: '#c59b27'
  },
  {
    id: 'panel-3',
    num: '03',
    tag: 'تمور ملكية وزهور نضرة',
    tagEn: 'Sukkari Dates & Roses',
    title: 'صينية التمور المحشوة مع الجوري',
    titleEn: 'Stuffed Dates & Fresh Blooms Tray',
    description: 'صواني رخامية فاخرة تجمع بين أرقى التمور السكرية المحشوة بالمكسرات والكراميل، منسقة مع باقات الجوري الهولندي النضرة لإكرام ضيوفك.',
    descriptionEn: 'Opulent marble trays blending artisan stuffed dates with crisp Dutch roses, tailored for distinguished receptions.',
    ctaText: 'اطلب صينية التمر والورد الفاخرة',
    ctaTextEn: 'Order Dates & Roses Tray',
    videoUrl: 'https://framerusercontent.com/assets/8X7yVRp00QdsQrj5UMRVxY1rGNc.mp4',
    categoryFilter: 'ورد و قهوة و حلا',
    whatsAppText: 'مرحباً هدايا مكة، أرغب في حجز صينية التمور المحشوة الملكية مع باقة الورد لمناسبة خاصة.',
    accentColor: '#e0b84c'
  },
  {
    id: 'panel-4',
    num: '04',
    tag: 'مجلس الإكرام وبخور العود',
    tagEn: 'Grand Majlis & Oud',
    title: 'مجلس الضيافة الحجازية الكبرى',
    titleEn: 'Grand Saudi Majlis Hospitality',
    description: 'تجربة ضيافة ملكية متكاملة تجمع بين بخور العود الموروث، فناجيل القهوة الفاخرة، وفازات الزهور الطبيعية لتخليد أجمل المناسبات والمفاجآت.',
    descriptionEn: 'An unforgettable VIP majlis experience uniting aged agarwood oud incense, fine coffee service, and sculptural blooms.',
    ctaText: 'تنسيق إهداء خاص للضيوف والمجالس',
    ctaTextEn: 'Curate VIP Majlis Set',
    videoUrl: 'https://framerusercontent.com/assets/3MHcEOgGVuRCJnzN6PHeSdFEolQ.mp4',
    categoryFilter: 'هدايا رجالية',
    whatsAppText: 'مرحباً، أود تنسيق إهداء ملكي كامل للمجلس يضم القهوة، العود، والورد الطبيعي.',
    accentColor: '#d4af37'
  }
];

export const SocialReelsSection: React.FC = () => {
  const { language, navigateToCategory } = useApp();
  const isAr = language === 'ar';

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [interactionMode, setInteractionMode] = useState<'hover' | 'tap'>('hover');
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnimRef = useRef<number | null>(null);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && interactionMode === 'hover') {
        setInteractionMode('tap');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [interactionMode]);

  // Video playback sync
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      if (idx === activeIndex) {
        if (isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, isPlaying]);

  // Track video progress smoothly without 60fps re-render overhead
  useEffect(() => {
    const activeVideo = videoRefs.current[activeIndex];
    if (!activeVideo) return;

    const interval = setInterval(() => {
      if (activeVideo && activeVideo.duration) {
        setProgress((activeVideo.currentTime / activeVideo.duration) * 100);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [activeIndex]);

  // Autoplay progression (every 7 seconds when active)
  useEffect(() => {
    if (!isAutoplay) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SAUDI_COFFEE_PANELS.length);
    }, 7000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isAutoplay, activeIndex]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SAUDI_COFFEE_PANELS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + SAUDI_COFFEE_PANELS.length) % SAUDI_COFFEE_PANELS.length);
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying((prev) => !prev);
  };

  const handleCtaClick = (panel: VideoAccordionPanel, e: React.MouseEvent) => {
    e.stopPropagation();
    if (panel.categoryFilter) {
      navigateToCategory(panel.categoryFilter);
    } else {
      const url = `https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(panel.whatsAppText)}`;
      window.open(url, '_blank');
    }
  };

  const handleWhatsAppDirect = (panel: VideoAccordionPanel, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://wa.me/${MECCA_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(panel.whatsAppText)}`;
    window.open(url, '_blank');
  };

  const activePanel = SAUDI_COFFEE_PANELS[activeIndex];

  return (
    <section
      id="video-accordion-pro"
      className="py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none overflow-hidden"
      aria-label={isAr ? "سينما الضيافة والقهوة السعودية" : "Video Accordion Pro: Saudi Luxury Coffee & Hospitality"}
    >
      {/* ── Section Title Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-5 border-b border-[#e8e4dc]/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold mb-2.5 shadow-2xs border border-[#102a1c]/15">
            <Coffee className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{isAr ? 'سينما الضيافة السعودية والقهوة الفاخرة' : 'Saudi Coffee & Royal Hospitality in Motion'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-[#102a1c] tracking-tight">
            {isAr ? 'لحظات استثنائية تنبض بالحياة' : 'Exceptional Celebrations in Motion'}
          </h2>

          <p className="text-xs sm:text-sm text-[#7a7164] mt-2 max-w-2xl font-light leading-relaxed">
            {isAr
              ? 'أربعة مقاطع سينمائية تجسد فخامة القهوة السعودية المحوجة بالهيل والزعفران، الدلة المكية الملكية، وتناغمها مع أرقى باقات الزهور والتمور.'
              : 'Four cinematic reels capturing royal Saudi golden coffee, artisan Khawlani beans, gilded dallah carafes, and luxury fresh bloom trays.'}
          </p>
        </div>

        {/* Global Toolbar Controls: Sound, Autoplay, Interaction Mode & Nav Arrows */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Interaction Mode Toggle (Hover / Tap) on Desktop */}
          {!isMobile && (
            <button
              type="button"
              onClick={() => setInteractionMode(interactionMode === 'hover' ? 'tap' : 'hover')}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-xs",
                interactionMode === 'hover'
                  ? "bg-[#102a1c] text-[#f3e5ab] border-[#d4af37]/40"
                  : "bg-white text-[#102a1c] border-[#e8e4dc] hover:bg-[#f9f8f5]"
              )}
              title={isAr ? "تبديل وضع التفاعل: تمرير الماوس أو النقر" : "Toggle interaction mode: Hover or Tap"}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>
                {interactionMode === 'hover'
                  ? (isAr ? 'تفاعل: تمرير الماوس' : 'Mode: Hover')
                  : (isAr ? 'تفاعل: نقر' : 'Mode: Tap')}
              </span>
            </button>
          )}

          {/* Autoplay Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoplay(!isAutoplay)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-xs",
              isAutoplay
                ? "bg-[#102a1c] text-[#f3e5ab] border-[#d4af37]/40"
                : "bg-white text-[#7a7164] border-[#e8e4dc] hover:bg-[#f9f8f5]"
            )}
            title={isAutoplay ? "Pause Autoplay" : "Start Autoplay"}
          >
            {isAutoplay ? <Pause className="w-3 h-3 text-[#d4af37]" /> : <Play className="w-3 h-3 text-[#d4af37]" />}
            <span>{isAutoplay ? (isAr ? 'تشغيل تلقائي' : 'Auto') : (isAr ? 'إيقاف' : 'Manual')}</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#102a1c] hover:bg-[#1a402c] text-[#f3e5ab] text-xs font-bold transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer border border-[#d4af37]/30"
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#25D366] animate-pulse" />}
            <span>{isMuted ? (isAr ? 'صوت' : 'Sound') : (isAr ? 'كتم' : 'Mute')}</span>
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-full bg-white hover:bg-[#102a1c] hover:text-[#d4af37] text-[#102a1c] border border-[#e8e4dc] shadow-xs transition-all active:scale-95 cursor-pointer"
              aria-label="Previous video panel"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-full bg-white hover:bg-[#102a1c] hover:text-[#d4af37] text-[#102a1c] border border-[#e8e4dc] shadow-xs transition-all active:scale-95 cursor-pointer"
              aria-label="Next video panel"
            >
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Video Accordion Pro Container ───────────────────────────────────── */}
      {/* Desktop / Tablet Row Layout */}
      {!isMobile ? (
        <div
          className="relative w-full rounded-[32px] overflow-hidden bg-[#05080b] border-2 border-[#d4af37]/35 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] p-3 flex flex-row gap-3 h-[540px] lg:h-[600px] xl:h-[640px]"
          onMouseEnter={() => isAutoplay && setIsAutoplay(false)}
          onMouseLeave={() => !isAutoplay && setIsAutoplay(true)}
        >
          {SAUDI_COFFEE_PANELS.map((panel, idx) => {
            const isExpanded = activeIndex === idx;

            return (
              <motion.div
                key={panel.id}
                role="region"
                aria-label={isAr ? panel.title : panel.titleEn}
                onMouseEnter={() => {
                  if (interactionMode === 'hover') {
                    setActiveIndex(idx);
                  }
                }}
                onClick={() => {
                  setActiveIndex(idx);
                }}
                className={cn(
                  "relative rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 ease-out select-none",
                  isExpanded
                    ? "ring-2 ring-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.25)] border border-[#d4af37]/50"
                    : "opacity-75 hover:opacity-100 hover:ring-1 hover:ring-[#d4af37]/40 border border-white/10"
                )}
                animate={{
                  flex: isExpanded ? 5.2 : 1.1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 240,
                  damping: 26,
                }}
              >
                {/* Background Video Media with Zoom & Grayscale Filter */}
                <div className="absolute inset-0 overflow-hidden bg-black">
                  <video
                    ref={(el) => {
                      videoRefs.current[idx] = el;
                    }}
                    src={panel.videoUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    preload="metadata"
                    className={cn(
                      "w-full h-full object-cover transition-all duration-700 ease-out",
                      isExpanded
                        ? "scale-105 filter-none"
                        : "scale-100 filter grayscale-[30%] brightness-[0.7]"
                    )}
                  >
                    <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="ar" label="العربية" default />
                  </video>

                  {/* Scrim Overlay Gradient */}
                  <div
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500 pointer-events-none",
                      isExpanded
                        ? "bg-gradient-to-t from-[#05080b] via-[#05080b]/55 to-transparent opacity-95"
                        : "bg-black/55 opacity-100"
                    )}
                  />

                  {/* Subtle warm amber/gold lighting on active panel */}
                  {isExpanded && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/15 via-transparent to-transparent pointer-events-none" />
                  )}
                </div>

                {/* ── Collapsed State Display (Vertical Number & Rotated Calligraphy) ── */}
                {!isExpanded && (
                  <div className="absolute inset-0 p-4 sm:p-5 pointer-events-none flex flex-col justify-between items-center transition-opacity duration-300 z-10">
                    {/* Top Panel Number */}
                    <div className="text-[#f3e5ab] font-mono font-bold text-xs tracking-widest bg-black/60 border border-[#d4af37]/30 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md">
                      {panel.num}
                    </div>

                    {/* Centered Rotated Title */}
                    <div
                      className="text-white/95 text-xs lg:text-sm font-serif font-bold tracking-wider uppercase truncate drop-shadow-md py-4"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                      }}
                    >
                      {isAr ? panel.title : panel.titleEn}
                    </div>

                    {/* Bottom Indicator Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#102a1c]/80 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                      <Coffee className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                {/* ── Expanded State Display (Rich Saudi Hospitality Showcase) ──── */}
                {isExpanded && (
                  <div className="relative z-20 h-full p-6 sm:p-8 md:p-9 flex flex-col justify-between text-white transition-opacity duration-500">
                    {/* Top Row: Category Tag | Progress Scrubber | Panel Indicator */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#d4af37]/25 border border-[#d4af37]/60 text-[#fef08a] text-xs font-semibold backdrop-blur-md shadow-md">
                          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>{isAr ? panel.tag : panel.tagEn}</span>
                        </span>

                        <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/20 text-white/80 text-[11px] backdrop-blur-md">
                          <Award className="w-3 h-3 text-[#d4af37]" />
                          <span>{isAr ? 'نخب أول فاخر' : 'Premium Grade'}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-[#f3e5ab] border border-white/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                          aria-label={isPlaying ? "Pause video" : "Play video"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#d4af37]" />}
                        </button>

                        {/* Number Indicator */}
                        <span className="font-mono text-sm sm:text-base font-bold text-[#fef08a] tracking-widest bg-black/50 border border-[#d4af37]/40 px-3 py-1 rounded-full backdrop-blur-md">
                          {panel.num} / 04
                        </span>
                      </div>
                    </div>

                    {/* Bottom Content Area: Title, Description, and CTAs */}
                    <div className="mt-auto pt-6 flex flex-col gap-3.5 max-w-2xl">
                      {/* Video Progress Bar */}
                      <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden mb-1">
                        <motion.div
                          className="bg-gradient-to-r from-[#d4af37] to-[#fef08a] h-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white leading-tight drop-shadow-lg">
                        {isAr ? panel.title : panel.titleEn}
                      </h3>

                      <p className="text-xs sm:text-sm lg:text-base text-white/90 font-light leading-relaxed drop-shadow line-clamp-3 lg:line-clamp-none">
                        {isAr ? panel.description : panel.descriptionEn}
                      </p>

                      {/* Action Buttons Row */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {/* Primary Order / Explore CTA */}
                        <button
                          type="button"
                          onClick={(e) => handleCtaClick(panel, e)}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f1df9b] to-[#c69a23] text-[#102a1c] font-bold text-xs sm:text-sm shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#f3e5ab]/60"
                        >
                          <span>{isAr ? panel.ctaText : panel.ctaTextEn}</span>
                          {isAr ? <ArrowLeft className="w-4 h-4 text-[#102a1c]" /> : <ArrowRight className="w-4 h-4 text-[#102a1c]" />}
                        </button>

                        {/* Fast WhatsApp Ordering */}
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppDirect(panel, e)}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs sm:text-sm font-semibold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#25D366]/60"
                          title={isAr ? 'طلب فوري عبر واتساب' : 'Fast WhatsApp Order'}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{isAr ? 'طلب فوري واتساب' : 'WhatsApp Order'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Mobile Vertical Accordion Layout with Smooth Animations */
        <div className="flex flex-col gap-3 w-full">
          {SAUDI_COFFEE_PANELS.map((panel, idx) => {
            const isExpanded = activeIndex === idx;

            return (
              <motion.div
                key={panel.id}
                layout
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "relative rounded-[22px] overflow-hidden border transition-all duration-300",
                  isExpanded
                    ? "border-[#d4af37] ring-2 ring-[#d4af37]/40 shadow-xl bg-[#05080b]"
                    : "border-white/10 bg-[#0e161a] opacity-90"
                )}
              >
                {/* Collapsed Header Bar on Mobile */}
                {!isExpanded ? (
                  <div className="relative h-18 sm:h-20 w-full overflow-hidden flex items-center justify-between px-4 sm:px-5 cursor-pointer">
                    {/* Background muted video preview */}
                    <div className="absolute inset-0 overflow-hidden bg-black/60 pointer-events-none">
                      <video
                        src={panel.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover opacity-35 filter grayscale-[40%]"
                      >
                        <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="ar" label="العربية" default />
                      </video>
                      <div className="absolute inset-0 bg-black/60" />
                    </div>

                    {/* Content inside collapsed bar */}
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#fef08a] bg-black/70 border border-[#d4af37]/40 px-2 py-0.5 rounded-full">
                        {panel.num}
                      </span>
                      <div>
                        <h4 className="text-white font-serif font-bold text-xs sm:text-sm line-clamp-1">
                          {isAr ? panel.title : panel.titleEn}
                        </h4>
                        <span className="text-white/60 text-[10px]">
                          {isAr ? panel.tag : panel.tagEn}
                        </span>
                      </div>
                    </div>

                    {/* Expand icon */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-[#102a1c] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                ) : (
                  /* Expanded Panel on Mobile */
                  <div className="relative min-h-[440px] sm:min-h-[480px] flex flex-col justify-between p-5 text-white">
                    {/* Active Background Video */}
                    <div className="absolute inset-0 overflow-hidden bg-black">
                      <video
                        ref={(el) => {
                          videoRefs.current[idx] = el;
                        }}
                        src={panel.videoUrl}
                        autoPlay
                        loop
                        muted={isMuted}
                        playsInline
                        className="w-full h-full object-cover scale-105"
                      >
                        <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="ar" label="العربية" default />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/30" />
                    </div>

                    {/* Mobile Top Header */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d4af37]/25 border border-[#d4af37]/60 text-[#fef08a] text-[11px] font-semibold backdrop-blur-md">
                        <Sparkles className="w-3 h-3 text-[#d4af37]" />
                        <span>{isAr ? panel.tag : panel.tagEn}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={togglePlayPause}
                          className="p-1.5 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-md"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#d4af37]" />}
                        </button>
                        <span className="font-mono text-xs font-bold text-[#d4af37] bg-black/60 px-2.5 py-1 rounded-full border border-[#d4af37]/30">
                          {panel.num} / 04
                        </span>
                      </div>
                    </div>

                    {/* Mobile Content & CTAs */}
                    <div className="relative z-10 mt-auto pt-6 flex flex-col gap-3">
                      {/* Progress Bar */}
                      <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#d4af37] to-[#fef08a] h-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold font-serif text-white leading-snug">
                        {isAr ? panel.title : panel.titleEn}
                      </h3>

                      <p className="text-xs text-white/90 font-light leading-relaxed">
                        {isAr ? panel.description : panel.descriptionEn}
                      </p>

                      <div className="flex flex-col gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => handleCtaClick(panel, e)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f1df9b] to-[#c69a23] text-[#102a1c] font-bold text-xs shadow-md active:scale-95"
                        >
                          <span>{isAr ? panel.ctaText : panel.ctaTextEn}</span>
                          {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppDirect(panel, e)}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#25D366] text-white text-xs font-semibold shadow-sm active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'طلب سريع واتساب' : 'WhatsApp Order'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Dot Indicators Below Carousel ────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2.5 mt-6">
        {SAUDI_COFFEE_PANELS.map((panel, i) => (
          <button
            key={panel.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={cn(
              "h-2 rounded-full transition-all duration-300 cursor-pointer",
              i === activeIndex
                ? "w-8 bg-gradient-to-r from-[#d4af37] to-[#102a1c]"
                : "w-2 bg-[#102a1c]/25 hover:bg-[#102a1c]/50"
            )}
            aria-label={`Jump to video panel ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
