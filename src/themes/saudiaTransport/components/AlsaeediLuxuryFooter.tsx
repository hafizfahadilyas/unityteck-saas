import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Clock, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Truck, 
  Lock, 
  Heart, 
  ChevronUp, 
  Layers, 
  Car, 
  CreditCard,
  MessageCircle,
  HelpCircle,
  FileText,
  Compass,
  ArrowUp,
  Star
} from 'lucide-react';
import { 
  BLECO_STORE_INFO, 
  BLECO_CATEGORIES, 
  BLECO_BLOG_POSTS,
  BLECO_FAQ 
} from '../../../data/blecoStoreData';

interface AlsaeediLuxuryFooterProps {
  isAr: boolean;
  storeDisplayName: string;
  onNavigateHome?: () => void;
  onNavigateCatalog?: () => void;
  onSelectCategory?: (category: any) => void;
  onOpenBlog?: (post: any) => void;
  onOpenFaq?: (index?: number) => void;
  onOpenReviews?: () => void;
}

// Authentic Saudi Mada Payment Icon SVG
function MadaBadge({ className = "h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="28" rx="6" fill="#FFFFFF"/>
      <path d="M12 19V9H15.5L18.5 14.5L21.5 9H25V19H22V12.8L19.2 17.5H17.8L15 12.8V19H12Z" fill="#007A3D"/>
      <path d="M28.5 19V12H31.5V13.2C32.2 12.3 33.3 11.8 34.6 11.8C36.8 11.8 38.5 13.5 38.5 15.6C38.5 17.7 36.8 19.4 34.6 19.4C33.3 19.4 32.2 18.9 31.5 18V19H28.5ZM33.5 17C34.3 17 35.1 16.4 35.1 15.6C35.1 14.8 34.3 14.2 33.5 14.2C32.7 14.2 31.9 14.8 31.9 15.6C31.9 16.4 32.7 17 33.5 17Z" fill="#007A3D"/>
      <path d="M42 19V9H45.2V13.2C45.9 12.3 47 11.8 48.3 11.8C50.5 11.8 52.2 13.5 52.2 15.6C52.2 17.7 50.5 19.4 48.3 19.4C47 19.4 45.9 18.9 45.2 18V19H42ZM47.1 17C47.9 17 48.7 16.4 48.7 15.6C48.7 14.8 47.9 14.2 47.1 14.2C46.3 14.2 45.5 14.8 45.5 15.6C45.5 16.4 46.3 17 47.1 17Z" fill="#007A3D"/>
      <circle cx="62" cy="14" r="7" fill="#00A3E0"/>
      <path d="M59 14C59 11.5 60.5 9.5 62 8.5C60.5 7.5 58.5 7 56.5 7C52.4 7 49 10.1 49 14C49 17.9 52.4 21 56.5 21C58.5 21 60.5 20.5 62 19.5C60.5 18.5 59 16.5 59 14Z" fill="#007A3D"/>
    </svg>
  );
}

// Apple Pay SVG Badge
function ApplePayBadge({ className = "h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="68" height="28" rx="6" fill="#000000" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <path d="M19.78 13.26c-.01-1.63 1.33-2.42 1.39-2.46-.76-1.11-1.94-1.26-2.36-1.28-1-.1-1.97.6-2.48.6-.52 0-1.31-.58-2.15-.56-1.1.02-2.13.65-2.69 1.64-1.15 2-.29 4.95.82 6.56.54.79 1.19 1.67 2.03 1.64.82-.03 1.13-.53 2.12-.53.99 0 1.28.53 2.14.51.88-.01 1.44-.8 1.98-1.59.62-.91.88-1.79.89-1.83-.02-.01-1.7-.65-1.69-2.7zm-1.65-4.48c.45-.55.76-1.31.67-2.08-.66.03-1.45.44-1.92 1-.41.48-.77 1.25-.67 2 .73.06 1.48-.37 1.92-.92z" fill="#FFFFFF"/>
      <path d="M26.4 17.8V9.8h2.8c1.8 0 2.9 1 2.9 2.5 0 1.5-1.1 2.5-2.9 2.5h-1.5v3h-1.3zm1.3-4.2h1.4c1.1 0 1.7-.5 1.7-1.4 0-.9-.6-1.4-1.7-1.4h-1.4v2.8zm7.3 4.3c-.6 0-1.1-.2-1.4-.5-.3-.4-.5-.9-.5-1.5 0-1.3 1-2.1 2.8-2.1h1.1v-.5c0-.9-.6-1.4-1.6-1.4-.7 0-1.3.2-1.7.5l-.4-.9c.6-.4 1.3-.6 2.2-.6 1.8 0 2.8.9 2.8 2.4v4.5h-1.2v-1c-.4.7-1.2 1-2.1 1zm.2-1.1c.8 0 1.5-.5 1.8-1.1v-1.1h-1c-1.1 0-1.7.4-1.7 1.2 0 .6.4 1 1 1zm7.4 3.7l1.4-4.2-2.7-6.5h1.4l1.9 4.9 1.9-4.9h1.4l-4.2 9.9h-1.1z" fill="#FFFFFF"/>
    </svg>
  );
}

// Tabby SVG Badge
function TabbyBadge({ className = "h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="68" height="28" rx="6" fill="#3EEDAC"/>
      <path d="M16 11.5h-3V9h9v2.5h-3V19h-3v-7.5zm8 7.5v-7h2.8v1.1c.5-.8 1.4-1.3 2.5-1.3 1.8 0 3 1.3 3 3.6V19h-2.8v-3.5c0-1.1-.6-1.8-1.6-1.8-.9 0-1.6.7-1.6 1.8V19H24zm10.5 0v-7h2.8v1.1c.5-.8 1.4-1.3 2.5-1.3 1.8 0 3 1.3 3 3.6V19H40v-3.5c0-1.1-.6-1.8-1.6-1.8-.9 0-1.6.7-1.6 1.8V19h-2.8zm11 0l3.5-7.5h3.2L55 17.2V19h-2.8v-1.8L49 11.5h3.1l1.8 4.2 1.8-4.2h3.1L55.5 19H53.5z" fill="#000000"/>
    </svg>
  );
}

// Tamara SVG Badge
function TamaraBadge({ className = "h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 68 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="68" height="28" rx="6" fill="#F87171"/>
      <path d="M13 10.5h-2.5V8.5h7.5v2H15.5V19H13v-8.5zm7 8.5v-6h2.2v1c.5-.7 1.3-1.2 2.2-1.2 1.6 0 2.7 1.2 2.7 3.2V19h-2.3v-3.2c0-1-.5-1.6-1.3-1.6-.8 0-1.3.6-1.3 1.6V19H20zm9 0v-6h2.2v1c.4-.7 1.2-1.2 2-1.2.6 0 1.2.3 1.5.8.6-.6 1.3-.8 2-.8 1.5 0 2.5 1 2.5 3V19h-2.2v-3.2c0-.9-.4-1.4-1.1-1.4s-1.2.5-1.2 1.4V19h-2.2v-3.2c0-.9-.4-1.4-1.1-1.4s-1.2.5-1.2 1.4V19H29zm13.5 0v-6h2.2v1c.5-.7 1.3-1.2 2.3-1.2 1.7 0 2.8 1.2 2.8 3.2V19h-2.3v-3.2c0-1-.5-1.6-1.3-1.6-.8 0-1.3.6-1.3 1.6V19h-2.3z" fill="#FFFFFF"/>
    </svg>
  );
}

// Visa & Mastercard Badge
function CardNetworkBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-md px-2 py-0.5 flex items-center gap-1.5 shadow-sm border border-white/20 ${className}`}>
      <span className="font-black text-[#1a1f71] text-[11px] italic tracking-tighter">VISA</span>
      <div className="flex -space-x-1 items-center">
        <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block"></span>
        <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-85"></span>
      </div>
    </div>
  );
}

// Official Saudi Business Center (SBC) Emblem Badge
function SaudiBusinessCenterBadge({ isAr }: { isAr: boolean }) {
  return (
    <a
      href="https://sbc.gov.sa"
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-emerald-900/40 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-md hover:shadow-emerald-900/30 text-white"
      title={isAr ? "موثق في المركز السعودي للأعمال" : "Verified by Saudi Business Center"}
    >
      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div className="text-right flex flex-col">
        <span className="text-[10px] text-emerald-300 font-extrabold flex items-center gap-1">
          {isAr ? 'المركز السعودي للأعمال' : 'Saudi Business Center'}
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 inline" />
        </span>
        <span className="text-[9px] font-mono text-emerald-200/90 font-bold">
          {isAr ? 'رقم التوثيق:' : 'SBC:'} {BLECO_STORE_INFO.businessCenterId}
        </span>
      </div>
    </a>
  );
}

// Official Saudi Commercial Registration (CR) Badge
function CommercialRegistrationBadge({ isAr }: { isAr: boolean }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#280c4f]/80 border border-[#d5a027]/40 text-white shadow-md">
      <div className="w-6 h-6 rounded-full bg-[#d5a027]/20 flex items-center justify-center text-[#f6c344]">
        <Award className="w-4 h-4" />
      </div>
      <div className="text-right flex flex-col">
        <span className="text-[10px] text-[#f6c344] font-extrabold">
          {isAr ? 'سجل تجاري معتمد' : 'Commercial Registration'}
        </span>
        <span className="text-[9px] font-mono text-slate-300 font-bold">
          {isAr ? 'رقم:' : 'CR:'} {BLECO_STORE_INFO.crNumber}
        </span>
      </div>
    </div>
  );
}

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
};

const BackToTopButton: React.FC<{ isAr: boolean }> = React.memo(({ isAr }) => {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    let lastProgress = 0;
    let lastShow = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
          const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const shouldShow = totalScroll > 280;
          if (shouldShow !== lastShow) {
            lastShow = shouldShow;
            setShowTopBtn(shouldShow);
          }
          if (windowHeight > 0) {
            const rawProgress = Math.min(100, Math.max(0, Math.round((totalScroll / windowHeight) * 100)));
            if (Math.abs(rawProgress - lastProgress) >= 1) {
              lastProgress = rawProgress;
              setScrollProgress(rawProgress);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={scrollToTop}
      aria-label={isAr ? 'العودة إلى أعلى الصفحة' : 'Back to top'}
      className={`fixed z-50 transition-all duration-300 ease-out group flex items-center justify-center cursor-pointer ${
        showTopBtn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8 pointer-events-none'
      } ${isAr ? 'right-5 sm:right-7' : 'left-5 sm:left-7'} bottom-6 sm:bottom-8`}
      style={{
        width: '42px',
        height: '42px'
      }}
    >
      <svg className="w-full h-full -rotate-90 drop-shadow-lg" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r="18"
          className="stroke-purple-950/80 fill-[#1c0537]/90"
          strokeWidth="3"
        />
        <circle
          cx="22"
          cy="22"
          r="18"
          className="stroke-[#f6c344] fill-none transition-all duration-150"
          strokeWidth="3.2"
          strokeDasharray="113.1"
          strokeDashoffset={113.1 - (113.1 * scrollProgress) / 100}
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-[#f6c344] group-hover:text-white transition-colors">
        <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-300" strokeWidth={2.6} />
      </div>

      <span
        className={`absolute whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#16032e] text-[#f6c344] text-[10px] font-black border border-[#d5a027]/40 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none -top-9 ${
          isAr ? 'right-0' : 'left-0'
        }`}
      >
        {isAr ? 'أعلى الصفحة ↑' : 'Top of page ↑'}
      </span>
    </button>
  );
});

const AlsaeediLuxuryFooterComponent: React.FC<AlsaeediLuxuryFooterProps> = ({
  isAr,
  storeDisplayName,
  onNavigateHome,
  onNavigateCatalog,
  onSelectCategory,
  onOpenBlog,
  onOpenFaq,
  onOpenReviews,
}) => {
  // Newsletter Form State
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) return;
    setNewsletterSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSuccess(false), 6000);
  };

  return (
    <>
      {/* 1. DYNAMIC ANIMATED BACK-TO-TOP BUTTON (Isolated & RAF Throttled) */}
      <BackToTopButton isAr={isAr} />

      {/* ========================================================
          2. LUXURY FLOATING WHATSAPP BUTTON (SMALL CIRCLE)
          ======================================================== */}
      <a 
        href={`https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
          isAr 
            ? 'مرحباً متجر السعيدي، أريد الاستفسار عن تلابيس المقاعد وأرضيات سيارتي' 
            : 'Hello Al-Saeedi Store, I would like to inquire about car seat covers and custom 5D floor mats'
        )}`}
        target="_blank" 
        rel="noreferrer"
        title={isAr ? 'تواصل واتساب مباشر' : 'Chat on WhatsApp'}
        className={`fixed z-50 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#128C7E] to-[#25D366] hover:brightness-110 text-white flex items-center justify-center shadow-xl shadow-emerald-950/40 hover:shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white/80 cursor-pointer group ${
          isAr ? 'left-5 sm:left-7' : 'right-5 sm:right-7'
        } bottom-6 sm:bottom-8`}
        aria-label="WhatsApp Contact"
      >
        {/* WhatsApp Icon */}
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>

        {/* Small Online Indicator Dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </span>
      </a>

      {/* ========================================================
          3. MAIN LUXURY FOOTER WRAPPER
          ======================================================== */}
      <footer className="bg-gradient-to-b from-[#1c0537] via-[#15022a] to-[#0d011a] text-white pt-14 pb-28 md:pb-14 border-t-2 border-[#d5a027]/40 relative overflow-hidden select-none">
        
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d5a027]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#3e0f77]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Inner Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">

          {/* ----------------------------------------------------
              FEATURE PRE-FOOTER: 4 TRUST PILLARS
              ---------------------------------------------------- */}
          <div id="guarantees-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-[#d5a027]/25 shadow-2xl">
            
            {/* Pillar 1: 3D Laser Precision */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d5a027]/20 to-[#f6c344]/10 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344] group-hover:scale-110 transition-transform shadow-md">
                <Car className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-[#f6c344]">
                  {isAr ? 'مسح ليزري ثلاثي الأبعاد 3D' : '3D Laser Precision Fit'}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {isAr ? 'تفصيل دقيق يطابق شاسيه سيارتك بالمليمتر' : 'Engineered to exact OEM factory contours'}
                </p>
              </div>
            </div>

            {/* Pillar 2: 2-Year Golden Warranty */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d5a027]/20 to-[#f6c344]/10 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344] group-hover:scale-110 transition-transform shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-[#f6c344]">
                  {isAr ? 'ضمان ذهبي سنتين كاملتين' : '2-Year Golden Warranty'}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {isAr ? 'ضمان شامل للخياطة ومقاومة التقشر والبهتان' : 'Covers stitching, UV resistance & peeling'}
                </p>
              </div>
            </div>

            {/* Pillar 3: Kingdom-Wide Delivery */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d5a027]/20 to-[#f6c344]/10 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344] group-hover:scale-110 transition-transform shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-[#f6c344]">
                  {isAr ? 'شحن سريع لكافة مناطق المملكة' : 'Kingdom-Wide Shipping'}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {isAr ? 'توصيل خلال 24-48 ساعة داخل مكة وجدة' : 'Express door-to-door delivery with tracking'}
                </p>
              </div>
            </div>

            {/* Pillar 4: Flexible Split Payments */}
            <div className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/[0.04] transition-all group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#d5a027]/20 to-[#f6c344]/10 border border-[#d5a027]/40 flex items-center justify-center text-[#f6c344] group-hover:scale-110 transition-transform shadow-md">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-[#f6c344]">
                  {isAr ? 'تقسيط ميسر 0% فوائد' : '0% Interest Installments'}
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {isAr ? 'قسّم فاتورتك على 4 دفعات عبر تابي وتمارا' : 'Split into 4 easy monthly payments via Tabby & Tamara'}
                </p>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------
              SECTION: INTERACTIVE BACK-TO-TOP BAR
              ---------------------------------------------------- */}
          <div className="flex items-center justify-between border-y border-white/10 py-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-[#f6c344]" />
              <span className="font-bold">
                {isAr ? 'متجر السعيدي — ريادة فخامة التنجيد وحماية مقاعد وأرضيات السيارات بالمملكة' : 'Al-Saeedi Store — Premier Saudi Luxury Automotive Upholstery'}
              </span>
            </div>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#d5a027] text-white hover:text-[#1c0537] font-bold text-xs transition-all duration-200 cursor-pointer shadow group"
            >
              <span>{isAr ? 'العودة للأعلى' : 'Back to top'}</span>
              <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* ----------------------------------------------------
              MAIN 5-COLUMN EXPANSIVE GRID
              ---------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* Col 1: Brand Info & Saudi Verification (Col span 4) */}
            <div className="lg:col-span-4 space-y-4">
              <div 
                onClick={onNavigateHome}
                className="cursor-pointer inline-flex items-center gap-3 group"
              >
                <div className="p-1 rounded-2xl bg-white/10 border border-[#d5a027]/40 group-hover:border-[#f6c344] transition-colors shadow-lg">
                  <img 
                    src={BLECO_STORE_INFO.logo} 
                    alt={storeDisplayName} 
                    className="h-10 w-auto object-contain" 
                  />
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#f6c344] tracking-wide leading-tight group-hover:text-amber-300 transition-colors">
                    {storeDisplayName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {isAr ? 'تنجيد مكة الفاخر — أرضيات دايموند وليزر' : 'Luxury Automotive Seat Covers & 5D Mats'}
                  </span>
                </div>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed font-light">
                {isAr ? BLECO_STORE_INFO.taglineAr : BLECO_STORE_INFO.taglineEn}
              </p>

              {/* Official Saudi Verification Badges */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <SaudiBusinessCenterBadge isAr={isAr} />
                <CommercialRegistrationBadge isAr={isAr} />
              </div>

              {/* Social Channels */}
              <div className="pt-2 space-y-2">
                <p className="text-[11px] font-bold text-slate-400">
                  {isAr ? 'تابعونا على منصات التواصل الاجتماعي:' : 'Connect with us:'}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={BLECO_STORE_INFO.social.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-rose-500 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow"
                    aria-label="Instagram"
                    title="Instagram @makkah8cars"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>

                  <a
                    href={BLECO_STORE_INFO.social.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow"
                    aria-label="TikTok"
                    title="TikTok @makkah8cars"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43V10.22a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-2.04-.65z"/>
                    </svg>
                  </a>

                  <a
                    href={BLECO_STORE_INFO.social.snapchat}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FFFC00] hover:text-black text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow"
                    aria-label="Snapchat"
                    title="Snapchat @makkah8cars"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.002 0c-4.412 0-7.994 3.582-7.994 7.994 0 1.096.223 2.141.624 3.095-.316.324-.77.587-1.32.748-.44.129-.684.343-.684.593 0 .445.679.771 1.574.887.054.496.177.962.361 1.385-.502.261-1.121.579-1.638.966-.465.348-.686.721-.606 1.05.121.498.889.78 1.956.883.336.568.798 1.037 1.353 1.378-.456.63-1.047 1.157-1.748 1.528-.433.229-.624.521-.523.805.155.438.981.657 2.128.657.447 0 .934-.035 1.442-.103.882.85 2.129 1.433 3.524 1.583 1.063.114 2.155.034 3.16-.234.508.068.995.103 1.442.103 1.147 0 1.973-.219 2.128-.657.101-.284-.09-.576-.523-.805-.701-.371-1.292-.898-1.748-1.528.555-.341 1.017-.81 1.353-1.378 1.067-.103 1.835-.385 1.956-.883.08-.329-.141-.702-.606-1.05-.517-.387-1.136-.705-1.638-.966.184-.423.307-.889.361-1.385.895-.116 1.574-.442 1.574-.887 0-.25-.244-.464-.684-.593-.55-.161-1.004-.424-1.32-.748.401-.954.624-1.999.624-3.095 0-4.412-3.582-7.994-7.994-7.994z"/>
                    </svg>
                  </a>

                  <a
                    href={`https://wa.me/${BLECO_STORE_INFO.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#25D366] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow"
                    aria-label="Direct WhatsApp"
                    title="Direct WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <a
                    href={BLECO_STORE_INFO.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#d5a027] text-white hover:text-[#1c0537] flex items-center justify-center transition-all duration-300 hover:scale-110 shadow"
                    aria-label="Google Maps Showroom"
                    title="Google Maps Showroom"
                  >
                    <MapPin className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Links (Col span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-[#f6c344] uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#d5a027]" />
                <span>{isAr ? 'روابط المتجر' : 'Quick Links'}</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateHome?.();
                      scrollToTop();
                    }}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'الرئيسية' : 'Home'}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateCatalog?.();
                      scrollToTop();
                    }}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'كتالوج المنتجات' : 'All Products'}</span>
                  </button>
                </li>
                <li>
                  <a
                    href="#floor-mats-section"
                    onClick={() => onNavigateHome?.()}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'أرضيات 5D والليزر' : 'Floor Mats'}</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#featured-seats-section"
                    onClick={() => onNavigateHome?.()}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'تلابيس المقاعد الفاخرة' : 'Custom Seat Covers'}</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#reviews-section"
                    onClick={() => {
                      onNavigateHome?.();
                      onOpenReviews?.();
                    }}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'آراء وتقييمات العملاء' : 'Customer Reviews'}</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#faq-section"
                    onClick={() => {
                      onNavigateHome?.();
                      onOpenFaq?.();
                    }}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>•</span>
                    <span>{isAr ? 'الأسئلة الشائعة (FAQ)' : 'FAQ & Help'}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Categories & Guides (Col span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-[#f6c344] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#d5a027]" />
                <span>{isAr ? 'أقسامنا الرئيسية' : 'Core Categories'}</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {BLECO_CATEGORIES.map((cat) => (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory?.(cat);
                        onNavigateCatalog?.();
                        const el = document.getElementById('catalog-view-top');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="hover:text-[#f6c344] transition-colors cursor-pointer text-start flex items-center gap-1.5"
                    >
                      <span>•</span>
                      <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (BLECO_BLOG_POSTS.length > 0) {
                        onOpenBlog?.(BLECO_BLOG_POSTS[0]);
                      }
                    }}
                    className="hover:text-[#f6c344] transition-colors cursor-pointer text-start flex items-center gap-1.5 text-amber-300"
                  >
                    <Star className="w-3 h-3 text-[#f6c344] fill-[#f6c344]" />
                    <span>{isAr ? 'دليل العناية بالسيارات' : 'Car Care Guide'}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Showroom & Working Hours (Col span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-[#f6c344] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#d5a027]" />
                <span>{isAr ? 'معرضنا بمكة' : 'Showroom'}</span>
              </h4>
              <div className="space-y-2 text-xs text-slate-300">
                <p className="leading-relaxed text-[11px]">
                  {isAr ? BLECO_STORE_INFO.addressAr : BLECO_STORE_INFO.addressEn}
                </p>

                {/* Live Working Hours Status */}
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span>{isAr ? 'مفتوح لاستقبالكم' : 'Open for Visits'}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                    <div>{isAr ? 'السبت - الخميس: 9:00 ص - 11:00 م' : 'Sat - Thu: 9 AM - 11 PM'}</div>
                    <div>{isAr ? 'الجمعة: 4:00 م - 11:00 م' : 'Fri: 4 PM - 11 PM'}</div>
                  </div>
                </div>

                <div className="pt-1 flex flex-col gap-1.5">
                  <a 
                    href={BLECO_STORE_INFO.mapUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[#f6c344] hover:text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{isAr ? 'الاتجاهات عبر خرائط جوجل' : 'Open in Google Maps'}</span>
                  </a>

                  <a 
                    href={`tel:${BLECO_STORE_INFO.phone}`} 
                    className="text-slate-300 hover:text-[#f6c344] font-mono text-[11px] inline-flex items-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>{BLECO_STORE_INFO.phone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Col 5: VIP Club Newsletter (Col span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs sm:text-sm font-black text-[#f6c344] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#d5a027]" />
                <span>{isAr ? 'نادي النخبة VIP' : 'VIP Club'}</span>
              </h4>
              
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {isAr 
                  ? 'انضم للنخبة لتصلك أحدث العروض الحصرية وكود خصم 10% فوري.' 
                  : 'Subscribe for exclusive drops and get instant 10% OFF your order.'}
              </p>

              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:border-[#f6c344] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-[#1c0537] font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>{isAr ? 'اشتراك بالعروض' : 'Join VIP Club'}</span>
                </button>
              </form>

              {newsletterSuccess && (
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{isAr ? 'تم انضمامك بنجاح! كود الخصم: VIP10' : 'Joined successfully! Code: VIP10'}</span>
                </div>
              )}
            </div>

          </div>

          {/* ----------------------------------------------------
              SECTION: LICENSED SAUDI PAYMENT CHANNELS
              ---------------------------------------------------- */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-start">
              <h5 className="font-black text-xs text-[#f6c344] flex items-center justify-center md:justify-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'طرق الدفع الآمنة والمعتمدة بالمملكة' : 'Secure & Certified Payment Methods'}</span>
              </h5>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'دفع إلكتروني مشفر 256-bit خاضع للبنك المركزي السعودي (ساما)' : '256-bit encrypted checkout compliant with Saudi Central Bank (SAMA)'}
              </p>
            </div>

            {/* Badges Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <MadaBadge className="h-6" />
              <ApplePayBadge className="h-6" />
              <CardNetworkBadge className="h-6" />
              <TabbyBadge className="h-6" />
              <TamaraBadge className="h-6" />
              <div className="bg-white/10 px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-200 border border-white/10">
                {isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------
              BOTTOM COPYRIGHT & NATIONAL EMBLEM BAR
              ---------------------------------------------------- */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <p className="text-center sm:text-start">
              © {new Date().getFullYear()} {storeDisplayName}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>

            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-[10px]">
                {isAr ? 'تنجيد مكة الفاخر للأرضيات والمقاعد' : 'Luxury Automotive Upholstery Makkah'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-200/90 text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#f6c344]" />
                <span>{isAr ? 'صُنع بكل فخر وإتقان في المملكة العربية السعودية' : 'Crafted with pride & precision in Saudi Arabia'}</span>
              </span>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
};

export const AlsaeediLuxuryFooter = React.memo(AlsaeediLuxuryFooterComponent);
