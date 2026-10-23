import React, { useState } from 'react';
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

export const Footer: React.FC = () => {
  const { navigateTo, language, toggleLanguage, storeIdentity, currentRoute, selectedProduct } = useCart();
  const { activeStore } = useTenant();
  const [subChannel, setSubChannel] = useState<'email' | 'whatsapp'>('email');
  const [inputValue, setInputValue] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);

  const isAr = language === 'AR';
  const rawStoreName = storeIdentity?.storeName || activeStore?.name || (isAr ? 'هايبرو السعودية' : 'HiBrew KSA');
  // Strict Bilingual Isolation (Rule 4): Ensure English mode has no Arabic leak
  const storeDisplayName = isAr
    ? rawStoreName
    : rawStoreName.replace(/[\u0600-\u06FF()]/g, '').trim() || 'HiBrew KSA';

  const storeDisplayEmail = storeIdentity?.email || activeStore?.email || 'support@hibrew.sa';
  const storeDisplayPhone = storeIdentity?.phone || '+966 11 489 2030';

  const rawPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '+966549876543';
  let cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
  if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
  else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) cleanPhone = '966' + cleanPhone;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSubSuccess(true);
    setTimeout(() => {
      setInputValue('');
      setSubSuccess(false);
    }, 4000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#111111] text-neutral-200 text-start text-xs selection:bg-neutral-800 selection:text-white border-t border-neutral-800 relative z-30">
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
          {/* Left Column: Newsletter Subscription & Official Hotline (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <h3 className="text-white font-extrabold text-base tracking-tight">
                {language === 'AR'
                  ? 'اشترك للحصول على آخر التحديثات - العروض الحصرية والمزيد.'
                  : 'Subscribe For Updates - Special Offers And More.'}
              </h3>

              <p className="text-[11px] text-neutral-300 leading-relaxed max-w-md">
                {language === 'AR'
                  ? 'أوافق على استلام أحدث العروض والمعلومات حول منتجات هايبرو عبر البريد الإلكتروني أو الرسائل الفورية (مثل واتساب). أفهم أنه يمكنني إلغاء الاشتراك في أي وقت.'
                  : 'I agree to receive the latest offers and information on HiBrew products through email or IM (e.g. WhatsApp) provided below and advertisement on third-party platforms. I understand that I can unsubscribe anytime.'}
              </p>

              {/* Email / WhatsApp Radio Selectors (Screenshot 5) */}
              <div className="flex items-center gap-6 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSubChannel('email')}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    subChannel === 'email' ? 'text-white font-bold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  <span>{language === 'AR' ? 'البريد الإلكتروني' : 'Email'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubChannel('whatsapp')}
                  className={`flex items-center gap-2 cursor-pointer transition-colors ${
                    subChannel === 'whatsapp' ? 'text-white font-bold' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{language === 'AR' ? 'واتساب' : 'WhatsApp'}</span>
                </button>
              </div>

              {/* Input & Subscribe Button */}
              <form onSubmit={handleSubscribe} className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 max-w-md pt-1">
                <input
                  type={subChannel === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={
                    subChannel === 'email'
                      ? (language === 'AR' ? 'أدخل بريدك الإلكتروني' : 'Enter your email address')
                      : (language === 'AR' ? 'أدخل رقم هاتفك (+966)' : 'Enter your phone number (+966)')
                  }
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 min-w-0 bg-neutral-900 border border-neutral-700 focus:border-white px-4 py-2.5 xs:py-3 rounded-full text-white placeholder-neutral-400 text-xs outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 xs:px-6 py-2.5 xs:py-3 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-full transition-all shrink-0 cursor-pointer active:scale-95 text-center"
                >
                  {subSuccess ? (language === 'AR' ? 'تم الاشتراك ✓' : 'Subscribed ✓') : (language === 'AR' ? 'اشتراك' : 'Subscribe')}
                </button>
              </form>
            </div>

            {/* Consumer Hotline Block (Screenshot 5) */}
            <div className="pt-2 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <Phone className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'خدمة العملاء والرقم المجاني' : 'Consumer hotline'}</span>
              </div>
              <div className="text-white font-mono font-bold text-sm">
                {storeDisplayPhone} <span className="text-neutral-300 text-xs font-sans font-normal ml-1">Sunday – Saturday, 9:00am–9:00pm</span>
              </div>
              <div className="text-neutral-300 font-mono text-xs">
                {storeDisplayEmail}
              </div>
            </div>

            {/* Official KSA VAT & Commercial Registration Numbers (Screenshot 5) */}
            <div className="text-[11px] text-neutral-300 space-y-1.5 pt-1 font-mono">
              <div>Tax ID/VAT Registration No. {storeIdentity?.vatNumber || '311123479500003'}</div>
              <div>Commercial Registration No. {storeIdentity?.commercialReg || '1010754462'}</div>
              <div className="flex items-center gap-1 text-neutral-300 hover:text-white cursor-pointer transition-colors">
                <span>E-Commerce Authentication No. 0000093589</span>
                <span>&gt;</span>
              </div>
            </div>

            {/* Social Icons Row (Screenshot 5) */}
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
          </div>

          {/* Right Columns: Multi-Column Category & Support Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-[11px] text-neutral-300">
            {/* Col 1: About */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wide uppercase">
                {language === 'AR' ? `عن ${storeDisplayName}` : `About ${storeDisplayName}`}
              </h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigateTo('about')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'قصة العلامة التجارية' : 'Brand Story'}</button></li>
                <li><button onClick={() => navigateTo('reviews')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'مدونة القهوة' : 'Blog'}</button></li>
                <li><button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'الأخبار والفعاليات' : 'News'}</button></li>
                <li><button onClick={() => navigateTo('about')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'الاستدامة والبيئة' : 'HiBrew ESG'}</button></li>
                <li><button onClick={() => navigateTo('locator')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'الفروع ومعارض البيع' : 'Retail Stores'}</button></li>
              </ul>
            </div>

            {/* Col 2: Products */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wide uppercase">
                {language === 'AR' ? 'المنتجات' : 'Products'}
              </h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigateTo('product-buy', 'hb-h10a-dualboiler')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'ماكينة بارستا برو H7A' : 'Barista Pro H7A'}</button></li>
                <li><button onClick={() => navigateTo('product-buy', 'hb-mill-g5-pro')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'مطحنة G5 تيتانيوم' : 'Titanium Mill G5'}</button></li>
                <li><button onClick={() => navigateTo('product-buy', 'hb-h4a-portable-travel')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'ماكينة السفر المحمولة' : 'Portable Espresso'}</button></li>
                <li><button onClick={() => navigateTo('product-buy', 'hb-luxury-corner-station')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'دواليب وأركان القهوة' : 'Coffee Cabinets'}</button></li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = isAr
                        ? 'السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم'
                        : 'Hello, I would like to inquire about placing a custom coffee corner order.';
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="hover:text-amber-400 font-semibold transition-colors cursor-pointer text-amber-300 inline-flex items-center gap-1.5 text-start whitespace-nowrap"
                    title={isAr ? 'تواصل عبر واتساب لطلب تفصيل ركن قهوة' : 'Inquire via WhatsApp for Custom Coffee Corner'}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-[#25D366] text-[#25D366] shrink-0" />
                    <span>{isAr ? 'تفصيل ركن قهوة' : 'Custom Coffee Corner'}</span>
                  </button>
                </li>
                <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'مستلزمات باريستا' : 'Pro Accessories'}</button></li>
                <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'عرض كافة المنتجات' : 'More Products'}</button></li>
              </ul>
            </div>

            {/* Col 3: Shop */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wide uppercase">
                {language === 'AR' ? 'المتجر' : 'Shop'}
              </h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigateTo('products')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'العروض الخاصة' : 'Offers'}</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'طلبات الشركات والجملة' : 'Commercial Orders'}</button></li>
                <li><button onClick={() => navigateTo('product-detail', 'hb-h10a-dualboiler')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'دليل الشراء واختيار الماكينة' : 'Buying Guide'}</button></li>
                <li><button onClick={() => navigateTo('faq')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'الأسئلة الشائعة' : 'FAQ'}</button></li>
                <li><button onClick={() => navigateTo('return')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'سياسة الاستبدال والاسترجاع' : 'Return Policy'}</button></li>
                <li><button onClick={() => navigateTo('shipping')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'سياسة الشحن والتوصيل' : 'Shipping Policy'}</button></li>
                <li><button onClick={() => navigateTo('terms')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'شروط وأحكام الشراء' : 'Terms of Purchase'}</button></li>
                <li><button onClick={() => navigateTo('track-order')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'تتبع الشحنات والطلبات' : 'Track Orders'}</button></li>
              </ul>
            </div>

            {/* Col 4: Support */}
            <div className="space-y-3">
              <h4 className="text-white font-bold text-xs tracking-wide uppercase">
                {language === 'AR' ? 'الدعم والخدمات' : 'Support'}
              </h4>
              <ul className="space-y-2.5">
                <li><button onClick={() => navigateTo('locator')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'مراكز الصيانة المعتمدة' : 'Service Centers'}</button></li>
                <li><button onClick={() => navigateTo('warranty')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'سياسة الضمان سنتين' : 'Warranty Policy'}</button></li>
                <li><button onClick={() => navigateTo('warranty')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'التحقق من سريان الضمان' : 'Warranty Query'}</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'طلب قطع غيار أصلية' : 'Spare Parts Query'}</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'صيانة واستلام من الباب' : 'Doorstep Repair'}</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors cursor-pointer">{language === 'AR' ? 'رعاية هاي برو كير+' : 'HiBrew Care+'}</button></li>
              </ul>
            </div>
          </div>
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
              {language === 'AR' ? 'خريطة الموقع (Sitemap)' : 'Sitemap'}
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
              Copyright © {storeDisplayName} 2017-{new Date().getFullYear()}. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
