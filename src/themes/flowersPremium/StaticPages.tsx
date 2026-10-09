import React, { useState } from 'react';
import {
  ArrowRight,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Navigation,
  RotateCcw,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { FLOWERS_STATIC_PAGES, type FlowersSfPage } from './pack';

type StaticKey = keyof typeof FLOWERS_STATIC_PAGES;

type Props = {
  page: StaticKey;
  lang: string;
  onBack: () => void;
};

export const FlowersStaticPage: React.FC<Props> = ({ page, lang, onBack }) => {
  const isAr = lang === 'ar';
  const [formSent, setFormSent] = useState(false);

  return (
    <div className="p-4 sm:p-10 max-w-4xl mx-auto space-y-8 min-h-[450px]" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 transition-colors shadow-2xs"
      >
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        <span>{isAr ? 'العودة لمتجر الورود الرئيسي' : 'Back to Storefront'}</span>
      </button>

      {/* ====================================================
          1. ABOUT PAGE (من نحن)
          ==================================================== */}
      {page === 'about' && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
              {isAr ? 'زهور مكة الفاخرة · منذ عام ٢٠١٤' : 'Makkah Fresh Luxury Flowers · Since 2014'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {isAr ? 'عراقة وفخامة الورود الطبيعية في أقدس بقاع الأرض' : 'Sacred Heritage & Luxury Blooms in Makkah'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? 'بوتيك ورد طبيعي متكامل في العاصمة المقدسة مكة المكرمة. نقدم أرقى الباقات الهولندية والإكوادورية مع خدمة التوصيل المبرد السريع لكافة فنادق الحرم المكي الشريف وأحياء مكة خلال ٦٠ دقيقة.'
                : 'A flagship floral boutique in the Holy City of Makkah, crafting imported Dutch and Ecuadorian fresh bouquets with rapid refrigerated delivery across central Haram hotels.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-4/3">
              <img
                src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80"
                alt="Florist Studio"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-4/3">
              <img
                src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80"
                alt="Handcrafted Bouquet"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-4/3">
              <img
                src="https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=600&q=80"
                alt="Luxury Vases"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900 text-white text-center">
            <div>
              <span className="text-2xl font-black block text-emerald-400">15,000+</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'طلبية موثقة' : 'Happy Orders'}</span>
            </div>
            <div>
              <span className="text-2xl font-black block text-amber-400">50+</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'فندق نخدمه يومياً' : 'Partner Hotels'}</span>
            </div>
            <div>
              <span className="text-2xl font-black block text-emerald-400">٦٠ دقيقة</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'سرعة التوصيل' : 'Express Delivery'}</span>
            </div>
            <div>
              <span className="text-2xl font-black block text-amber-400">4.9 / 5.0</span>
              <span className="text-[11px] text-slate-300">{isAr ? 'تقييم العملاء' : 'Rating'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          2. CONTACT PAGE (تواصل معنا)
          ==================================================== */}
      {page === 'contact' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-slate-900">
              {isAr ? 'تواصل مع فريق خدمة عملاء زهور مكة' : 'Contact Makkah Floral Concierge'}
            </h1>
            <p className="text-xs text-slate-500">
              {isAr ? 'مستعدون لخدمتكم وتنسيق أجمل الهدايا على مدار الساعة' : 'Ready 24/7 to fulfill your luxury floral orders'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'الرقم الموحد المباشر:' : 'Direct Phone:'}</span>
                </span>
                <p className="font-bold text-sm font-mono text-slate-900" dir="ltr">+966 12 555 8920</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'واتساب الطلبات الفورية:' : 'Express WhatsApp:'}</span>
                </span>
                <p className="font-bold text-sm font-mono text-emerald-950" dir="ltr">+966 50 442 8819</p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'العنوان الرئيسي:' : 'Main Address:'}</span>
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {isAr ? 'مكة المكرمة · حي العزيزية · قرب المنطقة المركزية' : 'Al-Aziziyah, Makkah · Near Central Haram Area'}
                </p>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h3 className="font-black text-xs text-slate-900">{isAr ? 'أرسل رسالة مباشرة:' : 'Send Direct Message:'}</h3>
                {formSent ? (
                  <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isAr ? 'تم استلام رسالتكم بنجاح وسيتواصل معكم المنسق فوراً.' : 'Message received! We will reach out shortly.'}</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setFormSent(true);
                    }}
                    className="space-y-2.5 text-xs"
                  >
                    <input
                      required
                      type="text"
                      placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <input
                      required
                      type="text"
                      placeholder={isAr ? 'رقم الجوال (05xxxxxxxx)' : 'Phone Number'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <textarea
                      required
                      rows={3}
                      placeholder={isAr ? 'تفاصيل الطلب أو المناسبة...' : 'Order or event details...'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors"
                    >
                      {isAr ? 'إرسال الرسالة' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          3. STORE LOCATION PAGE (موقع المتجر والفروع)
          ==================================================== */}
      {page === 'location' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-slate-900">
              {isAr ? 'فروعنا ومواقع التوزيع بمكة المكرمة' : 'Store Locations & Branches in Makkah'}
            </h1>
            <p className="text-xs text-slate-500">
              {isAr ? 'تغطية شاملة لكافة فنادق الحرم المكي والمناطق السكنية' : 'Full coverage across all central Haram hotels & districts'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {[
              {
                titleAr: 'بوتيك العزيزية الرئيسي',
                titleEn: 'Al-Aziziyah Flagship',
                locAr: 'طريق المسجد الحرام · بجوار بن داود',
                locEn: 'Al Masjid Al Haram Road',
                hoursAr: 'يومياً: ٠٨:٠٠ ص - ٠١:٠٠ ليلاً',
                hoursEn: '8:00 AM - 1:00 AM',
                phone: '+966 12 555 8920',
              },
              {
                titleAr: 'فرع برج الساعة وفنادق الحرم',
                titleEn: 'Clock Tower Fairmont Branch',
                locAr: 'أبراج البيت · الدور التجاري الثالث',
                locEn: 'Abraj Al-Bait Complex · Level 3',
                hoursAr: 'على مدار الساعة ٢٤/٧ في المواسم',
                hoursEn: '24/7 during seasons',
                phone: '+966 50 442 8819',
              },
              {
                titleAr: 'فرع جبل عمر',
                titleEn: 'Jabal Omar Branch',
                locAr: 'شارع إبراهيم الخليل · الممشى التجاري',
                locEn: 'Ibrahim Al Khalil Street',
                hoursAr: 'يومياً: ٠٩:٠٠ ص - ١٢:٠٠ ليلاً',
                hoursEn: '9:00 AM - Midnight',
                phone: '+966 55 987 6543',
              },
            ].map((br, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <h3 className="font-black text-slate-900">{isAr ? br.titleAr : br.titleEn}</h3>
                <p className="text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{isAr ? br.locAr : br.locEn}</span>
                </p>
                <p className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{isAr ? br.hoursAr : br.hoursEn}</span>
                </p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-700" dir="ltr">{br.phone}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-8 text-center space-y-2">
            <Navigation className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-black text-slate-900 text-sm">
              {isAr ? 'سيارات توصيل مبردة تجوب كافة أحياء مكة' : 'Climate-Controlled Vans Covering Makkah'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isAr
                ? 'توصيل مبرد وسريع خلال ٦٠ دقيقة لجميع الفنادق والعمائر والمستشفيات بمكة المكرمة.'
                : 'Rapid chilled delivery within 60 minutes across all hotels and districts.'}
            </p>
          </div>
        </div>
      )}

      {/* ====================================================
          4. PRIVACY POLICY PAGE (سياسة الخصوصية)
          ==================================================== */}
      {page === 'privacy' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-slate-900">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}
          </h1>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '١. الالتزام بنظام حماية البيانات السعودي:' : '1. Saudi PDPL Compliance:'}</h3>
              <p>{isAr ? 'نحترم خصوصية عملائنا ونلتزم بنظام حماية البيانات الشخصية الصادر في المملكة العربية السعودية. تُجمع بيانات الاتصال والعنوان فقط لتنفيذ وتوصيل الطلبات وإصدار الفواتير الضريبية المعتمدة وفق هيئة الزكاة والضريبة والجمارك.' : 'We adhere strictly to KSA Personal Data Protection Law (PDPL). Customer data is collected solely for order delivery and official ZATCA tax invoice generation.'}</p>
            </div>
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '٢. أمان المدفوعات والبطاقات البنكية:' : '2. Payment Security:'}</h3>
              <p>{isAr ? 'تتم جميع المعاملات المالية عبر بوابات مشفرة ومعتمدة من البنك المركزي السعودي (مدى، أبل باي). لا نقوم بالاحتفاظ بأي بيانات بطاقات ائتمانية على خوادمنا.' : 'All financial transactions are handled via SAMA-approved encrypted gateways (Mada, Apple Pay). We never store payment card numbers.'}</p>
            </div>
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '٣. سرية رسائل وبطاقات الإهداء:' : '3. Gift Message Confidentiality:'}</h3>
              <p>{isAr ? 'نضمن السرية الكاملة لنصوص بطاقات الإهداء ورسائل المناسبات المرفقة مع الورود.' : 'All gift card messages are treated with utmost privacy and handled confidentially.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          5. RETURN POLICY PAGE (سياسة الاستبدال والاسترجاع)
          ==================================================== */}
      {page === 'return' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-black text-slate-900">
            {isAr ? 'سياسة الاستبدال والاسترجاع وضمان النضارة' : 'Return & Freshness Guarantee Policy'}
          </h1>
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white p-6 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '١. ضمان جودة الورد الطبيعي:' : '1. Fresh Flowers Guarantee:'}</h3>
              <p>{isAr ? 'يحق للعميل طلب استبدال فوري للباقة خلال ساعتين من وقت استلامها في حال عدم مطابقتها للصورة أو تأثر الورد أثناء النقل المبرد.' : 'Fresh flowers can be exchanged within 2 hours of delivery if quality differs or blooms were affected during transit.'}</p>
            </div>
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '٢. طريقة الاستبدال السريع:' : '2. Rapid Exchange Procedure:'}</h3>
              <p>{isAr ? 'يرجى إرسال صورة الباقة ورقم الطلب عبر واتساب خدمة العملاء (+966504428819)، وسيقوم فريقنا بإرسال باقة بديلة فوراً دون أي رسوم إضافية.' : 'Send a photo and order ID to our concierge WhatsApp (+966504428819) for an immediate replacement without extra fees.'}</p>
            </div>
            <div>
              <h3 className="font-black text-slate-900 mb-1">{isAr ? '٣. استرجاع المبالغ:' : '3. Refunds:'}</h3>
              <p>{isAr ? 'في حال عدم الرغبة في الاستبدال، يُعاد المبلغ لنفس البطاقة البنكية المستخدمة خلال ٢٤-٤٨ ساعة عمل.' : 'Refunds are credited back to the original funding card within 24-48 business hours.'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function isStaticFlowersPage(page: FlowersSfPage): page is StaticKey {
  return page in FLOWERS_STATIC_PAGES;
}
