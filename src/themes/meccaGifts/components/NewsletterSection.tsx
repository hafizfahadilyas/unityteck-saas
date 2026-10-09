import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, CheckCircle2 } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#1c2e22] text-white">
      {/* Background with floral blur */}
      <div className="absolute inset-0 opacity-20">
        <img
          src="/src/assets/images/hadaya_luxury_master_hero_1791217937117.jpg"
          alt="Roses backdrop"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#102a1c] via-[#102a1c]/80 to-[#102a1c]" />

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-tight text-[#FAF9F5]">
          {isAr ? 'كن أول من يكتشف مجموعاتنا الجديدة' : 'Be First to Discover Our New Creations'}
        </h2>
        <p className="text-xs sm:text-sm text-[#ded7c8] font-light max-w-lg mx-auto">
          {isAr
            ? 'اشترك لتصلك أحدث تصاميم الورود الفاخرة، العروض الموسمية، والخصومات الحصرية لأعضاء النخبة.'
            : 'Subscribe to receive exclusive invitations, seasonal floral edits, and private concierge previews.'}
        </p>

        {subscribed ? (
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 inline-flex items-center gap-2 text-[#e6ca98] text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isAr ? 'شكراً لاشتراكك! كود الخصم HADAYA10 وصلك بنجاح' : 'Thank you! Your promo code HADAYA10 is ready.'}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2.5 max-w-md mx-auto pt-2">
            <div className="relative w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'}
                className="w-full py-3.5 px-4 pr-11 rtl:pr-11 rtl:pl-4 ltr:pl-11 ltr:pr-4 rounded-full bg-white/10 border border-white/25 text-white placeholder-white/60 text-xs sm:text-sm focus:outline-none focus:bg-white/20 focus:border-[#e6ca98] transition-all"
              />
              <Mail className="w-4 h-4 text-white/70 absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto" />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#FAF9F5] text-[#102a1c] hover:bg-[#e6ca98] font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shadow-lg active:scale-95"
            >
              {isAr ? 'انضم الآن' : 'Join Now'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
