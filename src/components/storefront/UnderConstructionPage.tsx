import React, { useState, useEffect } from 'react';
import {
  Clock,
  Mail,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Truck,
  Flower2,
  Globe,
  CheckCircle,
  Eye,
  Phone,
  Heart,
} from 'lucide-react';
import { MECCA_LOGO, MECCA_WHATSAPP } from '../../data/hadayaMeccaData';

export interface MaintenanceConfig {
  enabled: boolean;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  launchDate?: string;
  showCountdown?: boolean;
  showWhatsapp?: boolean;
  showEmailSubscribe?: boolean;
  whatsappNumber?: string;
  allowAdminPreview?: boolean;
}

interface UnderConstructionPageProps {
  config?: Partial<MaintenanceConfig>;
  onBypassPreview?: () => void;
  isAdmin?: boolean;
}

export const UnderConstructionPage: React.FC<UnderConstructionPageProps> = ({
  config = {},
  onBypassPreview,
  isAdmin = false,
}) => {
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  const isAr = locale === 'ar';

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Default target date: 7 days from now or provided launchDate
  const targetDateStr = config.launchDate || '2026-10-25T00:00:00';

  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 6, hours: 14, minutes: 35, seconds: 20 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
  };

  const whatsappUrl = `https://wa.me/${(config.whatsappNumber || MECCA_WHATSAPP).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    isAr
      ? 'مرحباً هدايا مكة، أود الاستفسار عن طلبات وتنسيقات الورود الخاصة!'
      : 'Hello Hadaya Mecca, I would like to inquire about fresh flower arrangements and custom gifts!'
  )}`;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen w-full bg-[#0d1f15] text-[#FAF9F5] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#e6ca98] selection:text-[#102a1c]"
    >
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#102a1c]/80 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-[#d4af37]/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-[#059669]/10 blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[#e6ca98]/10">
        <div className="flex items-center gap-3">
          <img
            src={MECCA_LOGO}
            alt="هدايا مكة"
            className="h-11 w-11 object-contain rounded-full ring-2 ring-[#e6ca98]/40 shadow-lg"
          />
          <div>
            <h1 className="text-base font-bold text-[#FAF9F5] tracking-tight">
              {isAr ? 'هدايا مكة — باقات الورود الفاخرة' : 'Hadaya Mecca — Luxury Blooms'}
            </h1>
            <p className="text-[11px] text-[#e6ca98] font-medium">
              giftshop-sa.com · {isAr ? 'مكة المكرمة' : 'Makkah Al-Mukarramah'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <button
            onClick={() => setLocale(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#102a1c] border border-[#e6ca98]/30 text-xs font-semibold text-[#e6ca98] hover:bg-[#e6ca98] hover:text-[#102a1c] transition-all shadow-md"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          {/* Admin Bypass Preview button */}
          {onBypassPreview && (
            <button
              onClick={onBypassPreview}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#e6ca98] text-[#102a1c] text-xs font-bold shadow-lg hover:brightness-110 transition-all cursor-pointer"
              title={isAr ? 'معاينة المتجر للآدمن' : 'Bypass for Admin Preview'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'معاينة المتجر' : 'Admin Preview'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-10 max-w-4xl mx-auto w-full px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#102a1c]/90 border border-[#e6ca98]/40 shadow-xl mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-[#e6ca98]" />
          <span className="text-xs font-bold tracking-wide text-[#e6ca98] uppercase">
            {isAr ? 'الموقع قيد التطوير والترقية الفاخرة' : 'Store Under Construction & Exclusive Upgrade'}
          </span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#FAF9F5] leading-tight tracking-tight mb-5">
          {isAr
            ? (config.titleAr || 'نجهز لكم تجربة إهداء ملكية تليق بأطهر بقاع الأرض')
            : (config.titleEn || 'Crafting a Royal Floral Gifting Experience in Holy Makkah')}
        </h2>

        {/* Subtitle Description */}
        <p className="text-base sm:text-lg text-[#FAF9F5]/80 max-w-2xl mx-auto leading-relaxed mb-10">
          {isAr
            ? (config.subtitleAr || 'نعمل بكل حب على تجهيز تشكيلات الزهور الطبيعية الهولندية، شوكولاتة باتشي وبستاني الملكية، وكيك المناسبات لخدمتكم بأعلى معايير الفخامة في فنادق وأحياء مكة المكرمة.')
            : (config.subtitleEn || 'We are arranging the finest natural Dutch blooms, Patchi & Bostani luxury chocolates, and celebratory cakes with 2-hour express delivery to Haram hotels.')}
        </p>

        {/* Live Countdown Timer */}
        {config.showCountdown !== false && (
          <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg mb-12">
            {[
              { labelAr: 'يوم', labelEn: 'Days', value: timeLeft.days },
              { labelAr: 'ساعة', labelEn: 'Hours', value: timeLeft.hours },
              { labelAr: 'دقيقة', labelEn: 'Mins', value: timeLeft.minutes },
              { labelAr: 'ثانية', labelEn: 'Secs', value: timeLeft.seconds },
            ].map((slot, i) => (
              <div
                key={i}
                className="bg-[#102a1c]/80 backdrop-blur-md rounded-2xl border border-[#e6ca98]/30 p-4 sm:p-5 shadow-2xl flex flex-col items-center justify-center transform hover:scale-105 transition-all"
              >
                <span className="text-2xl sm:text-4xl font-black text-[#e6ca98] tabular-nums tracking-wider">
                  {String(slot.value).padStart(2, '0')}
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-[#FAF9F5]/70 mt-1 uppercase">
                  {isAr ? slot.labelAr : slot.labelEn}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Email Subscribe / Notification Form */}
        {config.showEmailSubscribe !== false && (
          <div className="w-full max-w-md bg-[#102a1c]/60 backdrop-blur-md p-2 sm:p-2.5 rounded-full border border-[#e6ca98]/30 shadow-2xl mb-8">
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 py-2.5 px-4 text-emerald-400 text-sm font-bold animate-in fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>
                  {isAr
                    ? 'شكراً لك! سنرسل لك كود خصم ١٥٪ فور الافتتاح الرسمي.'
                    : 'Thank you! We will email you an exclusive 15% launch voucher.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <Mail className="w-4 h-4 text-[#e6ca98]/70 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      isAr
                        ? 'أدخل بريدك الإلكتروني لإشعارك فور الافتتاح…'
                        : 'Enter your email to get launch VIP perks…'
                    }
                    className="w-full bg-transparent border-none text-xs sm:text-sm text-[#FAF9F5] placeholder-[#FAF9F5]/40 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#e6ca98] text-[#102a1c] font-black text-xs sm:text-sm shadow-lg hover:brightness-110 transition-all flex-shrink-0"
                >
                  {isAr ? 'أبلغني' : 'Notify Me'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* VIP WhatsApp Direct Order Button */}
        {config.showWhatsapp !== false && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>
                {isAr
                  ? 'للطلبات الفورية الخاصة عبر واتساب (خدمة ٢٤/٧)'
                  : 'Order Urgent Arrangements via WhatsApp (24/7)'}
              </span>
            </a>
          </div>
        )}
      </main>

      {/* Feature Trust Bar Footer */}
      <footer className="relative z-10 border-t border-[#e6ca98]/10 bg-[#09150e]/90 backdrop-blur-md py-6 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-start">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#102a1c] border border-[#e6ca98]/30 flex items-center justify-center text-[#e6ca98]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#FAF9F5]">
                {isAr ? 'توصيل مبرد لفنادق الحرم خلال ساعتين' : '2-Hour Express Delivery to Haram'}
              </h4>
              <p className="text-[11px] text-[#FAF9F5]/60">
                {isAr ? 'أبراج الساعة وجبل عمر والعوالي' : 'Clock Tower, Jabal Omar & Awali'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#102a1c] border border-[#e6ca98]/30 flex items-center justify-center text-[#e6ca98]">
              <Flower2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#FAF9F5]">
                {isAr ? 'ورد طبيعي هولندي وإكوادوري نضر' : '100% Dutch & Ecuadorian Fresh Blooms'}
              </h4>
              <p className="text-[11px] text-[#FAF9F5]/60">
                {isAr ? 'تنسيق يدوي بأيدي أمهر الخبراء' : 'Hand-crafted by Master Florists'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#102a1c] border border-[#e6ca98]/30 flex items-center justify-center text-[#e6ca98]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#FAF9F5]">
                {isAr ? 'دفع آمن ١٠٠٪ وبطاقات إهداء مخصصة' : 'Secure Checkout & Custom Gifting'}
              </h4>
              <p className="text-[11px] text-[#FAF9F5]/60">
                {isAr ? 'مدى، آبل باي وبطاقات فيزا' : 'Mada, Apple Pay & Visa accepted'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
