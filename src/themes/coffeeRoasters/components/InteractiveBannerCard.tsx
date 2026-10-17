import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, ArrowRight } from 'lucide-react';

interface InteractiveBannerProps {
  title: string;
  subtitle?: string;
  image: string;
  videoUrl?: string;
  size?: 'large' | 'half';
  badge?: string;
  onClick?: () => void;
  ctaText?: string;
}

export const InteractiveBannerCard: React.FC<InteractiveBannerProps> = ({
  title,
  subtitle,
  image,
  videoUrl,
  size = 'half',
  badge,
  onClick,
  ctaText = 'Learn More'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const isLarge = size === 'large';

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative rounded-3xl overflow-hidden cursor-pointer select-none transition-all duration-700 ease-out group bg-[#14110E] transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
      } ${
        isLarge
          ? 'h-[360px] sm:h-[440px] lg:h-[480px] w-full'
          : 'h-[300px] sm:h-[360px] lg:h-[390px] w-full'
      }`}
    >
      {/* 1. Background Media with 100% Opacity, Zero Shades */}
      {videoUrl ? (
        <div className="absolute inset-0 w-full h-full bg-[#0C0A09]">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={image}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300 ease-out opacity-100"
          />
        </div>
      ) : (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300 ease-out opacity-100"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      )}

      {/* Top Video Controls (if video) */}
      {videoUrl && (
        <div className="absolute top-4 sm:top-6 end-4 sm:end-6 flex items-center justify-end z-20 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVideoPlay}
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={toggleAudio}
              className="w-8 h-8 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Top Badge (if provided) */}
      {badge && (
        <div className="absolute top-4 sm:top-6 start-4 sm:start-6 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{badge}</span>
          </span>
        </div>
      )}

      {/* Bottom Content Overlay: Gradient, Title, Subtitle, and CTA */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7 md:p-8 flex flex-col justify-end text-start pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-1.5 sm:space-y-2 pointer-events-auto max-w-2xl">
          <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-300 font-normal line-clamp-2 max-w-xl">
              {subtitle}
            </p>
          )}
          {ctaText && (
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                <span>{ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
