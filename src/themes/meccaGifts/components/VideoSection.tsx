import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MECCA_VIDEO } from '../data/mockData';
import { Play, Pause, Volume2, VolumeX, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export const VideoSection: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const isAr = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  React.useEffect(() => {
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

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black min-h-[480px] sm:min-h-[540px] flex items-center">
        
        {/* Video Player */}
        <video
          ref={videoRef}
          src={MECCA_VIDEO}
          loop
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7] contrast-[1.05]"
        >
          <track kind="captions" src="data:text/vtt,WEBVTT" srcLang="ar" label="العربية" default />
        </video>

        {/* Cinematic Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/25 rtl:bg-gradient-to-l rtl:from-black/85 rtl:via-black/50 rtl:to-black/25" />

        {/* Video Controls (Mute / Play) */}
        <div className="absolute top-5 left-5 rtl:left-5 rtl:right-auto ltr:right-5 ltr:left-auto z-20 flex items-center gap-2">
          <button
            onClick={toggleMute}
            aria-label="Toggle mute"
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={togglePlay}
            aria-label="Play or pause"
            className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 p-6 sm:p-12 lg:p-16 max-w-2xl text-white space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#e6ca98] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'حرفية وفن التنسيق اليدوي' : 'Handcrafted Floral Artistry'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif leading-tight text-[#FAF9F5]">
            {isAr ? 'هدايا فريدة بروح الحجاز' : 'Unique Gifts with the Spirit of Hijaz'}
          </h2>

          <p className="text-sm sm:text-base text-[#ded7c8] leading-relaxed font-light">
            {isAr
              ? 'يقدم متجرنا باقات ورد مميزة يتميز المتجر بخدمة تصميم وتنفيذ الهدايا حسب رغبة العميل مع التوصيل المجاني المبرد داخل مكة المكرمة.'
              : 'Our atelier curates distinctive floral arrangements with bespoke styling tailored to every client’s preference, with complimentary temperature-controlled delivery across Mecca.'}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-8 py-3.5 rounded-full bg-[#FAF9F5] text-[#102a1c] hover:bg-[#e6ca98] font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-flex items-center gap-2 transition-all duration-300"
            >
              <span>{isAr ? 'اطلبه الآن' : 'Order Now'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
