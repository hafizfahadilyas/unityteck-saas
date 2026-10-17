import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MECCA_VIDEO, MECCA_WHATSAPP } from '../data/mockData';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Tag,
  Clock,
  Check,
  Copy,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Truck,
  Gift,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const OfferVideoBanner: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const isAr = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);

  // Live countdown timer for the special offer
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 18,
    minutes: 42,
    seconds: 55,
  });

  const PROMO_CODE = 'MECCA30';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const copyPromoCode = () => {
    navigator.clipboard?.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShopOffer = () => {
    setSelectedCategory('باقات الورود الطبيعية');
    setCurrentPage('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanPhone = MECCA_WHATSAPP.replace(/[^\d]/g, '');
  const whatsappMessage = isAr
    ? `مرحباً هدايا مكة، أرغب في الاستفادة من عرض الفيديو الخاص مع كود الخصم (${PROMO_CODE}).`
    : `Hello Mecca Gifts, I would like to order with the Special Video Offer discount code (${PROMO_CODE}).`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section id="offer-video-banner" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Outer Luxury Card Container */}
      <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-[#0d1d14] text-white shadow-2xl border border-[#e6ca98]/30 group">
        
        {/* Background Video Layer */}
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            src={MECCA_VIDEO}
            loop
            autoPlay
            muted
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-cover object-center filter brightness-[0.72] contrast-[1.08] transition-transform duration-1000 group-hover:scale-[1.02]"
          >
            <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="ar" label="العربية" default />
          </video>

          {/* Premium Gradient Scrims: Multi-Directional Overlay for High Contrast & Luxury Aesthetic */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1d14] via-[#0d1d14]/75 to-transparent md:bg-gradient-to-r md:from-[#0d1d14]/95 md:via-[#0d1d14]/80 md:to-black/30 rtl:md:bg-gradient-to-l rtl:md:from-[#0d1d14]/95 rtl:md:via-[#0d1d14]/80 rtl:md:to-black/30" />
          <div className="absolute inset-0 bg-[#102a1c]/25 backdrop-blur-[1px]" />
        </div>

        {/* Floating Video Controller Widget (Top Corner) */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 rtl:right-auto rtl:left-4 rtl:sm:left-6 z-20 flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-[#e6ca98] backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95"
            title={isMuted ? (isAr ? 'تشغيل الصوت' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#e6ca98]" />}
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-[#e6ca98] backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95"
            title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : (isAr ? 'تشغيل' : 'Play')}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#e6ca98] fill-[#e6ca98]" />}
          </button>

          <button
            onClick={handleRestart}
            aria-label="Restart video"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white/90 hover:text-[#e6ca98] backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95 hidden sm:flex"
            title={isAr ? 'إعادة تشغيل الفيديو' : 'Replay'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="relative z-10 p-6 sm:p-10 md:p-14 lg:p-16 max-w-3xl space-y-6 sm:space-y-7">
          
          {/* Top Banner Tag & Badge */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-[#e6ca98]/25 text-[#ffd782] border border-[#e6ca98]/40 backdrop-blur-md text-xs font-bold tracking-wide shadow-sm animate-pulse">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'عرض فيديو حصري — خصم 30%' : 'Exclusive Video Offer — 30% Off'}</span>
            </div>

            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/15 text-[11px] font-medium backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-[#e6ca98]" />
              <span>{isAr ? 'إصدار فاخر محدود' : 'Limited Luxury Edition'}</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif leading-[1.2] text-[#FAF9F5] tracking-tight">
              {isAr ? (
                <>
                  سحر الورود الملكية <span className="text-[#e6ca98]">وهدايا الـ VIP</span>
                </>
              ) : (
                <>
                  The Majesty of Royal Blooms <span className="text-[#e6ca98]">& VIP Gifts</span>
                </>
              )}
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#ded7c8] leading-relaxed font-light max-w-2xl">
              {isAr
                ? 'شاهد فن وحرفية التنسيق المباشر لأفخم باقات الورد الهولندي الطبيعي والشوكولاتة السويسرية، مع كرت إهداء مجاني فاخر وتوصيل مبرد خلال ساعتين داخل مكة المكرمة.'
                : 'Watch master florists handcraft signature Dutch rose bouquets and Swiss chocolates, accompanied by a complimentary luxury card and 2-hour express chilled delivery.'}
            </p>
          </div>

          {/* Countdown Clock & Coupon Code Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            
            {/* Live Countdown Urgency Box */}
            <div className="flex items-center gap-2 bg-black/45 border border-[#e6ca98]/30 rounded-2xl px-4 py-2.5 backdrop-blur-md w-fit">
              <Clock className="w-4 h-4 text-[#e6ca98] shrink-0" />
              <div className="text-[11px] font-medium text-white/80 rtl:ml-2 ltr:mr-2">
                {isAr ? 'ينتهي العرض خلال:' : 'Offer Ends In:'}
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#ffd782]">
                <div className="bg-[#102a1c] px-2 py-1 rounded-md border border-[#e6ca98]/20 text-center min-w-[28px]">
                  {String(timeLeft.days).padStart(2, '0')}
                  <span className="block text-[8px] text-white/60 font-sans">{isAr ? 'يوم' : 'd'}</span>
                </div>
                <span>:</span>
                <div className="bg-[#102a1c] px-2 py-1 rounded-md border border-[#e6ca98]/20 text-center min-w-[28px]">
                  {String(timeLeft.hours).padStart(2, '0')}
                  <span className="block text-[8px] text-white/60 font-sans">{isAr ? 'ساعة' : 'h'}</span>
                </div>
                <span>:</span>
                <div className="bg-[#102a1c] px-2 py-1 rounded-md border border-[#e6ca98]/20 text-center min-w-[28px]">
                  {String(timeLeft.minutes).padStart(2, '0')}
                  <span className="block text-[8px] text-white/60 font-sans">{isAr ? 'د' : 'm'}</span>
                </div>
                <span>:</span>
                <div className="bg-[#102a1c] px-2 py-1 rounded-md border border-[#e6ca98]/20 text-center min-w-[28px] text-amber-300">
                  {String(timeLeft.seconds).padStart(2, '0')}
                  <span className="block text-[8px] text-white/60 font-sans">{isAr ? 'ث' : 's'}</span>
                </div>
              </div>
            </div>

            {/* Interactive Coupon Box */}
            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl px-4 py-2 backdrop-blur-md transition-all duration-300 w-fit">
              <Tag className="w-4 h-4 text-[#e6ca98]" />
              <div className="text-xs">
                <span className="text-white/70 block text-[10px]">{isAr ? 'كود الخصم الفوري' : 'Promo Code'}</span>
                <span className="font-mono font-bold tracking-wider text-[#ffd782]">{PROMO_CODE}</span>
              </div>
              <button
                type="button"
                onClick={copyPromoCode}
                className="rtl:mr-2 ltr:ml-2 p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-[#e6ca98] transition-colors flex items-center gap-1 text-[11px] font-semibold"
                title={isAr ? 'نسخ الكود' : 'Copy Code'}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[10px]">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isAr ? 'نسخ' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Quick Perks Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] sm:text-xs text-white/85">
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
              <Truck className="w-3.5 h-3.5 text-[#e6ca98] shrink-0" />
              <span>{isAr ? 'توصيل مبرد خلال ساعتين' : '2-Hour Chilled Delivery'}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
              <Gift className="w-3.5 h-3.5 text-[#e6ca98] shrink-0" />
              <span>{isAr ? 'كرت إهداء فاخر مجاني' : 'Complimentary Gift Card'}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#e6ca98] shrink-0" />
              <span>{isAr ? 'ضمان نضارة الورد 100%' : '100% Freshness Guarantee'}</span>
            </div>
          </div>

          {/* Call to Actions (CTAs) */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={handleShopOffer}
              className="px-7 sm:px-9 py-3.5 rounded-full bg-[#e6ca98] hover:bg-[#d8b97d] text-[#102a1c] font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-flex items-center gap-2.5 transition-all duration-300 active:scale-95 group/btn"
            >
              <span>{isAr ? 'تسوق عروض الورد الآن' : 'Shop Flower Offers Now'}</span>
              {isAr ? (
                <ArrowLeft className="w-4 h-4 transition-transform group-hover/btn:-translate-x-1" />
              ) : (
                <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 sm:px-8 py-3.5 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-flex items-center gap-2 transition-all duration-300 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'طلب سريع عبر واتساب' : 'Quick WhatsApp Order'}</span>
            </a>
          </div>

        </div>

        {/* Video Timeline Progress Bar at bottom of card */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15 z-20 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ffd782] to-[#e6ca98] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </section>
  );
};
