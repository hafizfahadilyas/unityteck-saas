import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { subscribeStoreNewsletter } from '../../../api/tenantApi';
import { Mail, CheckCircle2 } from 'lucide-react';
import { isSouqCommonTenant } from '../../souqCommon/isSouqCommonTenant';
import { getDefaultStoreTheme } from '../../../auth/defaultTheme';

export const NewsletterSection: React.FC = () => {
  const { language, showToast } = useApp();
  const { activeStore, storeActiveTheme } = useTenant();
  const isAr = language === 'ar';
  const themeId =
    (activeStore?.id && storeActiveTheme?.[activeStore.id]) ||
    getDefaultStoreTheme(activeStore?.id);
  const isSouq = isSouqCommonTenant(activeStore, themeId);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    const storeId = activeStore?.id;
    if (!storeId) {
      showToast(isAr ? 'المتجر غير جاهز' : 'Store is not ready');
      return;
    }
    setBusy(true);
    try {
      await subscribeStoreNewsletter(storeId, value);
      setSubscribed(true);
      showToast(isAr ? 'تم الاشتراك بنجاح' : 'Subscribed successfully');
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    } catch {
      showToast(isAr ? 'تعذر الاشتراك. تحقق من البريد وحاول مرة أخرى.' : 'Could not subscribe. Check the email and try again.');
    } finally {
      setBusy(false);
    }
  };

  const title = isSouq
    ? isAr
      ? 'احصل على العروض والمنتجات الجديدة'
      : 'Get offers & new arrivals'
    : isAr
      ? 'كن أول من يكتشف مجموعاتنا الجديدة'
      : 'Be First to Discover Our New Creations';

  const subtitle = isSouq
    ? isAr
      ? 'اشترك ليصلك تنبيه بالعروض والتحديثات من متجرك.'
      : 'Subscribe for offers and updates from this store.'
    : isAr
      ? 'اشترك لتصلك أحدث تصاميم الورود الفاخرة، العروض الموسمية، والخصومات الحصرية لأعضاء النخبة.'
      : 'Subscribe to receive exclusive invitations, seasonal floral edits, and private concierge previews.';

  if (isSouq) {
    return (
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#0f766e]">
        <div className="max-w-2xl mx-auto text-center space-y-5 text-white">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-white/80 max-w-lg mx-auto">{subtitle}</p>
          {subscribed ? (
            <div className="p-4 rounded-2xl bg-white/10 border border-white/20 inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              <span>{isAr ? 'شكراً لاشتراكك — سنرسل التحديثات إلى بريدك' : 'Thank you — updates will be sent to your inbox.'}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email address'}
                  disabled={busy}
                  className="w-full ps-10 pe-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="px-6 py-3 rounded-full bg-white text-[#0f766e] text-sm font-bold hover:bg-white/90 transition-colors disabled:opacity-60"
              >
                {isAr ? 'اشتراك' : 'Subscribe'}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#1c2e22] text-white">
      <div className="absolute inset-0 opacity-20">
        <img
          src="/images/hadaya_luxury_master_hero_1791217937117.jpg"
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#102a1c] via-[#102a1c]/80 to-[#102a1c]" />

      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif tracking-tight text-[#FAF9F5]">{title}</h2>
        <p className="text-xs sm:text-sm text-[#ded7c8] font-light max-w-lg mx-auto">{subtitle}</p>

        {subscribed ? (
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 inline-flex items-center gap-2 text-[#e6ca98] text-sm font-semibold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isAr ? 'شكراً لاشتراكك — سنرسل لك التحديثات على بريدك' : 'Thank you — updates will be sent to your inbox.'}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ded7c8]/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email address'}
                disabled={busy}
                className="w-full ps-10 pe-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-[#ded7c8]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#e6ca98]/40"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="px-6 py-3 rounded-full bg-[#e6ca98] text-[#102a1c] text-sm font-bold hover:bg-[#f5ddb0] transition-colors disabled:opacity-60"
            >
              {isAr ? 'اشتراك' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
