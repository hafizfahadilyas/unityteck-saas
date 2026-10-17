import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import {
  Instagram,
  Twitter,
  MessageCircle,
  Mail,
  Heart,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';

export interface FooterCustomProps {
  isBuilderMode?: boolean;
  selectedSubElement?: string;
  onSelectSubElement?: (subKey: 'brand' | 'contacts' | 'links' | 'social' | 'payments' | 'newsletter') => void;
  settings?: Record<string, any>;
}

export const Footer: React.FC<FooterCustomProps> = ({
  isBuilderMode = false,
  selectedSubElement,
  onSelectSubElement,
  settings = {},
}) => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore } = useTenant();
  const isAr = language === 'ar';
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const s = settings || {};

  const storeNameAr = s.storeNameAr || s.brandNameAr || activeStore?.nameAr || activeStore?.name || (isCoffee ? 'محمصة القهوة المختصة' : 'هدايا مكة');
  const storeNameEn = s.storeNameEn || s.brandNameEn || activeStore?.nameEn || activeStore?.name || (isCoffee ? 'Specialty Coffee Roasters' : 'Hadaya Flowers & Gifts');
  
  const defaultDescAr = isCoffee
    ? 'محاصيل بن مختصة طازجة التحميص، أدوات ترشيح V60 ومعدات إسبريسو احترافية لتجربة قهوة لا تُنسى في كل صباح.'
    : 'زهور طبيعية وهدايا فاخرة لكل مناسبة، صُممت بعناية وأناقة لتصل إلى أحبابك بأعلى معايير الإتقان والتوصيل السريع.';
  const defaultDescEn = isCoffee
    ? 'Single origin specialty coffee, precision pour-over tools, and pro espresso gear crafted for coffee connoisseurs.'
    : 'Premium flowers and gifts for every occasion. Fresh, elegant and delivered with love across the Kingdom.';

  const storeDescAr = s.storeDescAr || defaultDescAr;
  const storeDescEn = s.storeDescEn || defaultDescEn;

  const whatsappNumber = s.whatsappNumber || activeStore?.contactPhone || MECCA_WHATSAPP;
  const phoneNumber = s.phoneNumber || activeStore?.contactPhone || '+966 50 123 4567';
  const emailAddress = s.emailAddress || activeStore?.email || (isCoffee ? 'care@specialtycoffee.sa' : 'care@store.sa');
  const vatNumber = s.vatNumber || activeStore?.taxNumber || '310123456700003';
  const crNumber = s.crNumber || activeStore?.crNumber || '4030123456';

  const instagramUrl = s.instagramUrl || 'https://www.instagram.com';
  const twitterUrl = s.twitterUrl || 'https://x.com';
  const tiktokUrl = s.tiktokUrl || 'https://www.tiktok.com';

  const copyrightTextAr = s.copyrightAr || `© ${new Date().getFullYear()} ${storeNameAr}. جميع الحقوق محفوظة.`;
  const copyrightTextEn = s.copyrightEn || `© ${new Date().getFullYear()} ${storeNameEn}. All rights reserved.`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };

  const renderEditBadge = (labelAr: string, labelEn: string, subKey: any) => {
    if (!isBuilderMode) return null;
    const isSelected = selectedSubElement === subKey;
    return (
      <div
        className={`absolute top-2 start-2 z-30 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md transition-all ${
          isSelected
            ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105'
            : 'bg-slate-900/90 text-white opacity-0 group-hover/elem:opacity-100 backdrop-blur-xs'
        }`}
      >
        <Edit3 className="w-3 h-3 text-amber-500" />
        <span>{isAr ? labelAr : labelEn}</span>
      </div>
    );
  };

  return (
    <footer
      className="bg-[#0b241a] text-[#ded8cb] pt-14 pb-20 md:pb-10 border-t border-[#183d2c] relative select-none"
      style={{
        backgroundColor: s.bgColor || undefined,
        color: s.textColor || undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Info & Socials (4 Cols) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('brand');
              }
            }}
            className={`lg:col-span-4 space-y-4 relative group/elem p-2 rounded-2xl transition-all ${
              isBuilderMode ? 'cursor-pointer hover:bg-white/5' : ''
            } ${isBuilderMode && selectedSubElement === 'brand' ? 'ring-2 ring-amber-400 bg-white/5' : ''}`}
          >
            {renderEditBadge('هوية ووصف المتجر (انقر للتعديل)', 'Brand Identity (Click to edit)', 'brand')}

            <div
              onClick={() => {
                if (isBuilderMode) return;
                setCurrentPage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer select-none"
            >
              {s.logoUrl ? (
                <img src={s.logoUrl} alt={storeNameEn} className="h-10 object-contain mb-2" />
              ) : (
                <>
                  <h3 className="text-2xl font-bold font-serif text-white tracking-wide">
                    {isAr ? storeNameAr : storeNameEn}
                  </h3>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#cca65b] font-medium mt-0.5">
                    {isAr ? 'عطور وهدايا فاخرة' : 'FLOWERS & LUXURY GIFTS'}
                  </p>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#b8b0a0] leading-relaxed max-w-sm font-light">
              {isAr ? storeDescAr : storeDescEn}
            </p>

            {/* Social Icons */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('social');
                }
              }}
              className={`flex items-center gap-3 pt-2 relative group/social ${
                isBuilderMode ? 'p-1 rounded-xl hover:bg-white/10' : ''
              } ${isBuilderMode && selectedSubElement === 'social' ? 'ring-2 ring-amber-400 bg-white/10' : ''}`}
            >
              {isBuilderMode && selectedSubElement === 'social' && (
                <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded absolute -top-4 start-0">
                  {isAr ? 'حسابات التواصل' : 'Social Media'}
                </span>
              )}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#d4af37] text-white hover:text-[#0b241a] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#d4af37] text-white hover:text-[#0b241a] flex items-center justify-center transition-colors shadow-2xs"
                aria-label="X Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={tiktokUrl}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#d4af37] text-white hover:text-[#0b241a] flex items-center justify-center transition-colors shadow-2xs text-xs font-bold font-mono"
                aria-label="TikTok"
              >
                ♪
              </a>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#25D366]/25 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>

            {/* Payment Method Badges */}
            <div
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectSubElement?.('payments');
                }
              }}
              className={`pt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold ${
                isBuilderMode ? 'p-1 rounded-xl hover:bg-white/10' : ''
              } ${isBuilderMode && selectedSubElement === 'payments' ? 'ring-2 ring-amber-400 bg-white/10' : ''}`}
            >
              <span className="px-2 py-0.5 rounded bg-white text-[#0b241a] font-mono">VISA</span>
              <span className="px-2 py-0.5 rounded bg-white text-[#0b241a] font-mono">mada</span>
              <span className="px-2 py-0.5 rounded bg-white text-[#0b241a] font-mono">Pay</span>
              <span className="px-2 py-0.5 rounded bg-[#2ecc71] text-white font-mono">tabby</span>
              <span className="px-2 py-0.5 rounded bg-[#ff6b6b] text-white font-mono">tamara</span>
            </div>
          </div>

          {/* Quick Links (2 Cols) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('links');
              }
            }}
            className={`lg:col-span-2 space-y-3 relative group/elem p-2 rounded-2xl transition-all ${
              isBuilderMode ? 'cursor-pointer hover:bg-white/5' : ''
            } ${isBuilderMode && selectedSubElement === 'links' ? 'ring-2 ring-amber-400 bg-white/5' : ''}`}
          >
            {renderEditBadge('القوائم والروابط', 'Menu Links', 'links')}

            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-2 text-xs text-[#b8b0a0]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setCurrentPage('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'الرئيسية' : 'Home'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setCurrentPage('crm');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'من نحن' : 'About Us'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setCurrentPage('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'كافة المنتجات' : 'All Products'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setCurrentPage('crm');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'الشكاوى والاقتراحات' : 'Complaints & Support'}
                </button>
              </li>
            </ul>
          </div>

          {/* Categories Column (2 Cols) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('links');
              }
            }}
            className="lg:col-span-2 space-y-3 p-2 rounded-2xl"
          >
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              {isAr ? 'التصنيفات' : 'Categories'}
            </h4>
            <ul className="space-y-2 text-xs text-[#b8b0a0]">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setSelectedCategory('باقات الورود الطبيعية');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'زهور طبيعية' : 'Flowers'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setSelectedCategory('ورد وشوكولاتة بلجيكية فاخرة');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'هدايا وشوكولاتة' : 'Gifts'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setSelectedCategory('ورد و كيك');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'كيك ومناسبات' : 'Cakes'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (isBuilderMode) return;
                    setSelectedCategory('باقات فاخرة');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {isAr ? 'تشكيلات فاخرة' : 'Luxury'}
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & ZATCA Tax Compliance (2 Cols) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('contacts');
              }
            }}
            className={`lg:col-span-2 space-y-3 relative group/elem p-2 rounded-2xl transition-all ${
              isBuilderMode ? 'cursor-pointer hover:bg-white/5' : ''
            } ${isBuilderMode && selectedSubElement === 'contacts' ? 'ring-2 ring-amber-400 bg-white/5' : ''}`}
          >
            {renderEditBadge('بيانات الاتصال والضريبة', 'Contacts & Legal', 'contacts')}

            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAr ? 'بيانات التوثيق والضريبة' : 'Tax & Support'}</span>
            </h4>
            <div className="space-y-2 text-xs text-[#b8b0a0]">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px]">{phoneNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px]">{emailAddress}</span>
              </div>
              <div className="pt-2 text-[10px] space-y-1 text-slate-300 border-t border-white/10 font-mono">
                <div>{isAr ? `الرقم الضريبي: ${vatNumber}` : `VAT: ${vatNumber}`}</div>
                <div>{isAr ? `السجل التجاري: ${crNumber}` : `CR: ${crNumber}`}</div>
              </div>
            </div>
          </div>

          {/* Newsletter Subscribe (2 Cols) */}
          <div
            onClick={(e) => {
              if (isBuilderMode) {
                e.stopPropagation();
                onSelectSubElement?.('newsletter');
              }
            }}
            className="lg:col-span-2 space-y-3 p-2 rounded-2xl"
          >
            <h4 className="text-xs sm:text-sm font-bold text-white">
              {isAr ? 'النشرة البريدية' : 'Newsletter'}
            </h4>
            
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#d4af37]"
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-[#d4af37] hover:bg-[#bfa054] text-[#0b241a] font-bold text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'اشتراك' : 'Subscribe'}
              </button>
            </form>

            {newsletterSubscribed && (
              <p className="text-[11px] text-[#2ecc71] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'تم الاشتراك بنجاح!' : 'Subscribed successfully!'}</span>
              </p>
            )}
          </div>

        </div>

        {/* Bottom Bar: Copyright & Made with Love in Saudi Arabia */}
        <div
          onClick={(e) => {
            if (isBuilderMode) {
              e.stopPropagation();
              onSelectSubElement?.('brand');
            }
          }}
          className={`pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9a9182] ${
            isBuilderMode ? 'cursor-pointer hover:text-white' : ''
          }`}
        >
          <p>{isAr ? copyrightTextAr : copyrightTextEn}</p>

          <p className="flex items-center gap-1.5 font-medium">
            <span>{isAr ? 'صُنع بـ' : 'Made with'}</span>
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 inline" />
            <span>{isAr ? 'في المملكة العربية السعودية' : 'in Saudi Arabia'}</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
