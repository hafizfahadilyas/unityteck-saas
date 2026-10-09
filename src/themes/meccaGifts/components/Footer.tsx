import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Twitter,
  MessageCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { MECCA_WHATSAPP } from '../data/mockData';

export const Footer: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory } = useApp();
  const isAr = language === 'ar';

  return (
    <footer className="bg-[#0b1d13] text-[#d1c7b5] pt-16 pb-24 md:pb-12 border-t border-[#1d3527]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#1c3627]">
          
          {/* Brand & Description (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 cursor-pointer select-none">
              <img
                src="https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png"
                alt="متجر هدايا مكة"
                className="h-12 w-auto object-contain filter brightness-110"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col text-start rtl:text-right ltr:text-left">
                <span className="text-xl font-extrabold tracking-tight text-[#FAF9F5] font-serif">
                  هدايا مكة
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#a19685] font-sans -mt-0.5">
                  HADAYA - Gifts and Flowers
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#a39c8e] leading-relaxed max-w-sm">
              {isAr
                ? 'نحن نقطة الوصل بين المتهادين لإسعاد من تحب بـ باقات ورد مضافاً إليها الشوكليت أو القهوة أو الكيك الكوري أو هدايا رجالية أو فازات، ونكون مع العميل من الفكرة إلى التصميم والتنفيذ والتوصيل داخل مكة مجاناً.'
                : 'We connect hearts through bespoke floral arrangements enriched with Patchi chocolates, Arabic coffee, Korean cakes, and luxury gifts, delivering free across Mecca.'}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/gifts.mecca"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#e6ca98] hover:text-[#102a1c] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://x.com/hdaya_mecca"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#e6ca98] hover:text-[#102a1c] flex items-center justify-center transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@gifts.mecca"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#e6ca98] hover:text-[#102a1c] flex items-center justify-center transition-colors font-bold text-xs"
                aria-label="TikTok"
              >
                ♪
              </a>
              <a
                href={`https://wa.me/${MECCA_WHATSAPP.replace('+', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#f5f1e8] font-serif tracking-wider uppercase">
              {isAr ? 'روابط مهمة' : 'Quick Links'}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setCurrentPage('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'الرئيسية' : 'Home'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('باقات ورود طبيعية مخفضة');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'باقات ورود مخفضة' : 'Discounted Bouquets'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('ورد وشوكولاتة بلجيكية فاخرة');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'ورد وشوكليت باتشي وبستاني' : 'Chocolates & Roses'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentPage('crm');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'بوابة العميل وتتبع الطلبات' : 'VIP Tracking & CRM'}
                </button>
              </li>
            </ul>
          </div>

          {/* Collections */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#f5f1e8] font-serif tracking-wider uppercase">
              {isAr ? 'أقسام المتجر' : 'Collections'}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('باقات الورود الطبيعية');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'باقات الورود الطبيعية' : 'Natural Bouquets'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('ورد و قهوة و حلا');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'ورد و قهوة و حلا' : 'Coffee & Sweets'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('ورد و كيك');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'ورد وكيك كوري' : 'Roses & Cake'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('فازات ورود طبيعية');
                    setCurrentPage('catalog');
                  }}
                  className="hover:text-[#e6ca98] transition-colors"
                >
                  {isAr ? 'فازات ورد طبيعي' : 'Flower Vases'}
                </button>
              </li>
            </ul>
          </div>

          {/* Tax Number & Platform Verification */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#f5f1e8] font-serif tracking-wider uppercase">
              {isAr ? 'التوثيق الرسمي' : 'Official Verification'}
            </h3>

            {/* Saudi Business Verification */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2ecc71]" />
                <span className="font-bold text-[#FAF9F5]">
                  {isAr ? 'موثّق في منصة الأعمال' : 'Saudi Business Platform'}
                </span>
              </div>
              <p className="text-[11px] text-[#a9bcae]">
                {isAr ? 'رقم التوثيق: 0000197484' : 'License: 0000197484'}
              </p>
            </div>

            {/* VAT Box */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs">
              <span className="text-[#a9bcae] block">{isAr ? 'الرقم الضريبي (VAT):' : 'Tax Number:'}</span>
              <p className="font-mono font-bold text-[#FAF9F5]">314853306700003</p>
            </div>

            {/* Direct Contact */}
            <div className="pt-1 text-xs text-[#a9bcae] space-y-1">
              <p>{isAr ? 'هاتف / واتساب:' : 'WhatsApp:'} <span dir="ltr" className="font-mono text-white">+966 58 161 7712</span></p>
              <p>{isAr ? 'البريد:' : 'Email:'} <span className="font-mono text-white">hdaya.mk@gmail.com</span></p>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Payments & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#8c8275]">
          
          {/* Payment Badges */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="px-2.5 py-1 bg-white/10 rounded-md text-white border border-white/10">مدى Mada</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-md text-white border border-white/10">Apple Pay</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-md text-white border border-white/10">Visa</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-md text-white border border-white/10">Mastercard</span>
            <span className="px-2.5 py-1 bg-[#2ecc71]/20 text-[#2ecc71] rounded-md border border-[#2ecc71]/30">تابي Tabby</span>
            <span className="px-2.5 py-1 bg-[#ff6b6b]/20 text-[#ff8e8e] rounded-md border border-[#ff6b6b]/30">تمارا Tamara</span>
            <span className="px-2.5 py-1 bg-[#f39c12]/20 text-[#f39c12] rounded-md border border-[#f39c12]/30">STC Pay</span>
          </div>

          {/* Copyright */}
          <div>
            <p>
              © {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة | متجر هدايا مكة' : 'All rights reserved | Hadaya Mecca Gifts'}
            </p>
          </div>

        </div>

      </div>
    </footer>
  );
};
