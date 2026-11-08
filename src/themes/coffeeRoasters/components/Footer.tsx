import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import {
  ChevronUp,
  Mail,
  MessageCircle,
  Phone,
  Globe,
  Check,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';
import { resolveCoffeeThemeSettings } from '../../settings/coffeeThemeDefaults';
import { bi, coffeeModularSeed } from '../../settings/coffeeModularSettings';

export const Footer: React.FC = () => {
  const { navigateTo, language, toggleLanguage, storeIdentity, currentRoute, selectedProduct } = useCart();
  const { activeStore } = useTenant();
  const [subChannel, setSubChannel] = useState<'email' | 'whatsapp'>('email');
  const [inputValue, setInputValue] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);
  const [settingsTick, setSettingsTick] = useState(0);

  useEffect(() => {
    const sync = () => setSettingsTick((n) => n + 1);
    window.addEventListener('unityteck-theme-settings', sync);
    return () => window.removeEventListener('unityteck-theme-settings', sync);
  }, []);

  const themeSettings = useMemo(() => {
    try {
      if (!activeStore?.id) return null;
      return resolveCoffeeThemeSettings(activeStore.id, activeStore);
    } catch {
      return null;
    }
  }, [activeStore, settingsTick]);

  const newsletter = themeSettings?.newsletter;
  /** C-FOOT: use saved footer; if never configured (no columns/about), show HiBrew seed for coffee only. */
  const footerCfg = useMemo(() => {
    const raw = themeSettings?.footer;
    const hasConfigured =
      Boolean(raw?.aboutEn?.trim() || raw?.aboutAr?.trim() || raw?.copyrightEn?.trim() || raw?.copyrightAr?.trim()) ||
      (raw?.columns || []).some((c) => (c.links || []).length > 0 || c.titleEn?.trim() || c.titleAr?.trim());
    if (hasConfigured) return raw;
    return { ...coffeeModularSeed().footer, ...(raw || {}), columns: coffeeModularSeed().footer.columns };
  }, [themeSettings?.footer]);

  const isAr = language === 'AR';
  const rawStoreName = storeIdentity?.storeName || activeStore?.name || (isAr ? 'هايبرو السعودية' : 'HiBrew KSA');
  // Strict Bilingual Isolation (Rule 4): Ensure English mode has no Arabic leak
  const storeDisplayName = isAr
    ? rawStoreName
    : rawStoreName.replace(/[\u0600-\u06FF()]/g, '').trim() || 'HiBrew KSA';

  const storeDisplayEmail = footerCfg?.contactEmail?.trim() || storeIdentity?.email || activeStore?.email || 'support@hibrew.sa';
  const storeDisplayPhone = footerCfg?.contactPhone?.trim() || storeIdentity?.phone || '+966 11 489 2030';
  const contactAddress = bi(language, footerCfg?.addressEn, footerCfg?.addressAr);
  const contactHours = bi(
    language,
    footerCfg?.hoursEn,
    footerCfg?.hoursAr,
    language === 'AR' ? 'الأحد – السبت، 9:00 صباحاً–9:00 مساءً' : 'Sunday – Saturday, 9:00am–9:00pm',
  );
  const paymentLabel = bi(language, footerCfg?.paymentsEn, footerCfg?.paymentsAr);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputValue.trim();
    if (!value) return;
    const storeId = activeStore?.id;
    if (storeId && subChannel === 'email' && value.includes('@')) {
      try {
        const { subscribeStoreNewsletter } = await import('../../../api/tenantApi');
        await subscribeStoreNewsletter(storeId, value);
      } catch {
        /* show success only when API accepts — otherwise keep form for retry */
        return;
      }
    } else if (subChannel === 'whatsapp') {
      /* WhatsApp subscribe needs gateway — skip fake success */
      return;
    } else if (!storeId) {
      return;
    }
    setSubSuccess(true);
    setTimeout(() => {
      setInputValue('');
      setSubSuccess(false);
    }, 4000);
  };

  const newsTitle = bi(
    language,
    footerCfg?.newsletterTitleEn || newsletter?.titleEn,
    footerCfg?.newsletterTitleAr || newsletter?.titleAr,
    language === 'AR'
      ? 'اشترك للحصول على آخر التحديثات - العروض الحصرية والمزيد.'
      : 'Subscribe For Updates - Special Offers And More.',
  );
  const newsSub = bi(
    language,
    newsletter?.subtitleEn,
    newsletter?.subtitleAr,
    language === 'AR'
      ? 'أوافق على استلام أحدث العروض والمعلومات حول منتجات هايبرو عبر البريد الإلكتروني أو الرسائل الفورية (مثل واتساب). أفهم أنه يمكنني إلغاء الاشتراك في أي وقت.'
      : 'I agree to receive the latest offers and information on HiBrew products through email or IM (e.g. WhatsApp) provided below and advertisement on third-party platforms. I understand that I can unsubscribe anytime.',
  );
  const newsPlaceholder =
    subChannel === 'email'
      ? bi(language, newsletter?.placeholderEn, newsletter?.placeholderAr, language === 'AR' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address')
      : language === 'AR'
        ? 'أدخل رقم هاتفك (+966)'
        : 'Enter your phone number (+966)';
  const newsButton = subSuccess
    ? bi(language, newsletter?.successEn, newsletter?.successAr, language === 'AR' ? 'تم الاشتراك ✓' : 'Subscribed ✓')
    : bi(language, newsletter?.buttonEn, newsletter?.buttonAr, language === 'AR' ? 'اشتراك' : 'Subscribe');
  const showNewsletter = footerCfg?.showNewsletter === false ? false : newsletter?.enabled !== false;
  const showFooterColumns = footerCfg?.enabled !== false;
  const footerColumns = (footerCfg?.columns || []).filter((col) => (col.links || []).length > 0 || col.titleEn || col.titleAr);
  const showSocial = footerCfg?.showSocial !== false;

  const goFooterLink = (url: string) => {
    const href = (url || '').trim();
    if (!href) return;
    if (/^https?:\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigateTo(href.replace(/^\//, '') as Parameters<typeof navigateTo>[0]);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer data-customize-section="C-FOOT" className="w-full bg-[#111111] text-neutral-200 text-start text-xs selection:bg-neutral-800 selection:text-white border-t border-neutral-800 relative z-30">
      {/* 1. Breadcrumb & Back to Top Strip (Screenshot 5) */}
      <div className="border-b border-neutral-800/80 py-3 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between text-neutral-300 text-[11px] font-medium">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
              {storeDisplayName}
            </button>
            {currentRoute === 'products' && (
              <>
                <span className="text-neutral-500">&gt;</span>
                <span className="text-white font-semibold">{isAr ? 'المتجر والمنتجات' : 'Shop & Products'}</span>
              </>
            )}
            {(currentRoute === 'product-detail' || currentRoute === 'product-buy') && (
              <>
                <span className="text-neutral-500">&gt;</span>
                <button onClick={() => navigateTo('products')} className="hover:text-white transition-colors cursor-pointer">
                  {isAr ? 'مكائن القهوة' : 'Coffee Machines'}
                </button>
                <span className="text-neutral-500">&gt;</span>
                <span className="text-white font-semibold">
                  {selectedProduct ? (isAr ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.name) : (isAr ? 'هايبرو بارستا برو H7A' : 'HiBrew Barista Pro™ H7A')}
                </span>
                {currentRoute === 'product-buy' && (
                  <>
                    <span className="text-neutral-500">&gt;</span>
                    <span className="text-white font-semibold">{isAr ? 'شراء' : 'Buy'}</span>
                  </>
                )}
              </>
            )}
            {currentRoute !== 'home' && currentRoute !== 'products' && currentRoute !== 'product-detail' && currentRoute !== 'product-buy' && (
              <>
                <span className="text-neutral-500">&gt;</span>
                <span className="text-white font-semibold capitalize">
                  {currentRoute.replace('-', ' ')}
                </span>
              </>
            )}
          </div>

          <button
            onClick={scrollToTop}
            className="text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{language === 'AR' ? 'العودة للأعلى' : 'Back to top'}</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Main Footer Body (Screenshot 5 Exact Grid) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left Column: Newsletter Subscription & Official Hotline (5 cols) — Word C-NEWS */}
          <div className="lg:col-span-5 space-y-6">
            {showNewsletter ? (
            <div
              className="space-y-3"
              style={
                newsletter?.bgColor
                  ? { backgroundColor: newsletter.bgColor, color: newsletter.textColor || '#FFFFFF', borderRadius: 16, padding: 16 }
                  : undefined
              }
            >
              <h3 className={`font-extrabold text-base tracking-tight ${newsletter?.bgColor ? '' : 'text-white'}`}>
                {newsTitle}
              </h3>

              <p className={`text-[11px] leading-relaxed max-w-md ${newsletter?.bgColor ? 'opacity-90' : 'text-neutral-300'}`}>
                {newsSub}
              </p>

              {newsletter?.showCoupon && newsletter.couponCode ? (
                <p className="text-[11px] font-bold opacity-90">
                  {language === 'AR' ? `رمز الكوبون:${newsletter.couponCode}` : `Coupon code: ${newsletter.couponCode}`}
                </p>
              ) : null}

              <div className="flex items-center gap-6 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSubChannel('email')}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    subChannel === 'email' ? 'font-bold opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>{language === 'AR' ? 'البريد الإلكتروني' : 'Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubChannel('whatsapp')}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    subChannel === 'whatsapp' ? 'font-bold opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'AR' ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>

              <form onSubmit={handleSubscribe} className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 max-w-md pt-1">
                <input
                  type={subChannel === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={newsPlaceholder}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 focus:border-white px-4 py-2.5 xs:py-3 rounded-full text-white placeholder-neutral-400 text-xs outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 xs:px-6 py-2.5 xs:py-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-full transition-all shrink-0 cursor-pointer active:scale-95 text-center"
                >
                  {newsButton}
                </button>
              </form>
            </div>
            ) : null}

            {/* Consumer Hotline Block (Screenshot 5) */}
            <div className="pt-2 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'خدمة العملاء والرقم المجاني' : 'Consumer hotline'}</span>
              </div>
              <div className="text-white font-mono font-bold text-sm">
                {storeDisplayPhone} <span className="text-neutral-300 text-xs font-sans font-normal ms-1">{contactHours}</span>
              </div>
              <div className="text-neutral-300 font-mono text-xs">
                {storeDisplayEmail}
              </div>
              {contactAddress ? <div className="text-neutral-300 text-xs">{contactAddress}</div> : null}
            </div>

            {/* Official KSA VAT & Commercial Registration — real store identity only */}
            {(storeIdentity?.vatNumber || storeIdentity?.commercialReg) ? (
              <div className="text-[11px] text-neutral-300 space-y-1.5 pt-1 font-mono">
                {storeIdentity?.vatNumber ? (
                  <div>
                    {isAr ? 'الرقم الضريبي / ضريبة القيمة المضافة:' : 'Tax ID / VAT Registration No.'}{' '}
                    {storeIdentity.vatNumber}
                  </div>
                ) : null}
                {storeIdentity?.commercialReg ? (
                  <div>
                    {isAr ? 'السجل التجاري:' : 'Commercial Registration No.'}{' '}
                    {storeIdentity.commercialReg}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Social Icons Row — C-FOOT showSocial */}
            {showSocial ? (
            <div className="flex items-center gap-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors">
                <span className="font-bold text-xs">𝕏</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center transition-colors">
                <span className="font-bold text-xs">♪</span>
              </a>
            </div>
            ) : null}
            {footerCfg?.showPaymentIcons && paymentLabel ? (
              <p className="text-[11px] text-neutral-300 pt-1">{paymentLabel}</p>
            ) : null}
          </div>

          {/* Right Columns — Word C-FOOT from theme settings */}
          {showFooterColumns ? (
          <div className={`lg:col-span-7 grid gap-8 text-[11px] text-neutral-300 ${
            footerColumns.length <= 2 ? 'grid-cols-2' : footerColumns.length === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
          }`}>
            {footerColumns.length > 0 ? (
              footerColumns.map((col) => (
                <div key={col.id} className="space-y-3">
                  <h4 className="text-white font-bold text-xs tracking-wide uppercase">
                    {bi(language, col.titleEn, col.titleAr)}
                  </h4>
                  {footerCfg?.aboutEn || footerCfg?.aboutAr ? (
                    col.id === footerColumns[0]?.id ? (
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        {bi(language, footerCfg.aboutEn, footerCfg.aboutAr)}
                      </p>
                    ) : null
                  ) : null}
                  <ul className="space-y-2.5">
                    {(col.links || []).map((link) => (
                      <li key={link.id}>
                        <button
                          type="button"
                          onClick={() => goFooterLink(link.url)}
                          className="hover:text-white transition-colors cursor-pointer text-start"
                        >
                          {bi(language, link.labelEn, link.labelAr)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="col-span-full text-neutral-500 text-xs">
                {isAr ? 'لا أعمدة تذييل بعد — أضفها من تخصيص الثيم' : 'No footer columns yet — add them in Customize Themes'}
              </div>
            )}
          </div>
          ) : null}
        </div>

        {/* 3. Bottom Legal & Country Selector Strip (Screenshot 5) */}
        <div className="mt-14 pt-8 border-t border-neutral-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-neutral-300">
          {/* Legal Links */}
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'الشروط والأحكام' : 'Terms Of Use'}</button>
            <span className="text-neutral-600">|</span>
            <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'سياسة الخصوصية' : 'Privacy Statement'}</button>
            <span className="text-neutral-600">|</span>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">
              {language === 'AR' ? 'خريطة الموقع' : 'Sitemap'}
            </a>
            <span className="text-neutral-600">|</span>
            <button onClick={() => navigateTo('privacy')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'ملفات تعريف الارتباط' : 'Cookie Policy'}</button>
          </div>

          {/* Country Selector & Copyright */}
          <div className="flex items-center gap-6 flex-wrap">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-neutral-200 hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'AR' ? '🇸🇦 المملكة العربية السعودية (العربية)' : '🇸🇦 Saudi Arabia (English)'}</span>
            </button>

            <span className="text-neutral-300">
              {bi(
                language,
                footerCfg?.copyrightEn,
                footerCfg?.copyrightAr,
                `Copyright © ${storeDisplayName} 2017-${new Date().getFullYear()}. All rights reserved.`,
              )}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
