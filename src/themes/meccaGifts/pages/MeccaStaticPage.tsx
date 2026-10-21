import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  FileText,
  Truck,
  Award,
  Search,
  MapPin,
  Phone,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Send,
  Building,
  Navigation,
  Package
} from 'lucide-react';
import {
  getStorePageBySlug,
  getStorePages,
  StoreCustomPage,
} from '../../../services/storePagesService';
import { useTenant } from '../../../context/TenantContext';
import { useApp } from '../context/AppContext';

interface MeccaStaticPageProps {
  slug?: string;
  onBackToHome?: () => void;
}

export const MeccaStaticPage: React.FC<MeccaStaticPageProps> = ({ slug, onBackToHome }) => {
  const { currentPage, setCurrentPage, language } = useApp();
  const { activeStore, currentOrders } = useTenant();
  const isAr = language === 'ar';

  const effectiveSlug =
    slug ||
    (currentPage === 'privacy'
      ? 'privacy-policy'
      : currentPage === 'return'
      ? 'return-policy'
      : currentPage === 'terms'
      ? 'terms-and-conditions'
      : currentPage === 'shipping'
      ? 'shipping-policy'
      : currentPage === 'about'
      ? 'about-us'
      : currentPage === 'contact'
      ? 'contact-us'
      : currentPage === 'faq'
      ? 'faq'
      : currentPage === 'track-order'
      ? 'order-tracking'
      : 'privacy-policy');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [effectiveSlug]);

  const [pageData, setPageData] = useState<StoreCustomPage | undefined>(undefined);
  const [allPages, setAllPages] = useState<StoreCustomPage[]>([]);

  // Tracking form
  const [trackInput, setTrackInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // Contact form
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const reloadData = () => {
    const list = getStorePages(activeStore?.id || 'store-1', activeStore);
    setAllPages(list);
    const found = getStorePageBySlug(activeStore?.id || 'store-1', effectiveSlug, activeStore);
    setPageData(found);
  };

  useEffect(() => {
    reloadData();
    const handleSync = () => reloadData();
    window.addEventListener('unityteck-pages-changed', handleSync);
    return () => window.removeEventListener('unityteck-pages-changed', handleSync);
  }, [effectiveSlug, activeStore?.id]);

  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;

    setIsSearchingTrack(true);
    setTimeout(() => {
      setIsSearchingTrack(false);
      const cleanNum = trackInput.trim().toUpperCase();

      const foundOrder = (currentOrders || []).find((o: any) => {
        const orderNum = String(o.orderNumber || o.id || '').toUpperCase();
        const oPhone = String(o.customerPhone || '').replace(/[^0-9]/g, '');
        return (cleanNum && orderNum.includes(cleanNum)) || (cleanNum.length >= 7 && oPhone.includes(cleanNum));
      });

      if (foundOrder) {
        const isDelivered = foundOrder.status === 'delivered';
        const isShipped = foundOrder.status === 'shipped' || isDelivered;
        setTrackingResult({
          orderNumber: foundOrder.orderNumber || foundOrder.id,
          status: isAr
            ? (isDelivered ? 'تم تسليم الطلب بنجاح' : isShipped ? 'الطلب في طريقه للتوصيل' : 'جاري تجهيز وتنسيق الباقة')
            : (isDelivered ? 'Delivered Successfully' : isShipped ? 'Out for Delivery' : 'Preparing & Arranging'),
          courier: isAr ? 'مندوب التوصيل المبرد الفوري' : 'Refrigerated Express Courier',
          estimatedDelivery: isAr ? 'اليوم خلال موعدك المفضل' : 'Today within selected delivery slot',
          destination: foundOrder.deliveryLocation || (isAr ? 'مكة المكرمة' : 'Makkah'),
          itemsCount: foundOrder.itemsCount || 1,
          steps: [
            { titleAr: 'تم استلام وتأكيد الطلب', titleEn: 'Order Received & Confirmed', done: true },
            { titleAr: 'تنسيق الأزهار وتجهيز كرت الإهداء', titleEn: 'Floral Arrangement & Gift Card', done: true },
            { titleAr: 'فحص النضارة والتغليف المبرد', titleEn: 'Quality & Freshness Inspection', done: isShipped },
            { titleAr: 'انطلاق مندوب التوصيل', titleEn: 'Dispatched with Courier', done: isShipped },
            { titleAr: 'اكتمال التسليم للعميل', titleEn: 'Delivered', done: isDelivered },
          ]
        });
      } else {
        setTrackingResult({
          notFound: true,
          orderNumber: cleanNum,
        });
      }
    }, 500);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 4000);
  };

  const storeName = isAr ? activeStore?.nameAr || activeStore?.name || 'متجر هدايا مكة' : activeStore?.nameEn || activeStore?.name || 'Makkah Gifts Store';

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-10 text-start text-[#202521] selection:bg-[#102a1c]/20" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 border-b border-[#102a1c]/10 pb-4">
          <div className="flex items-center gap-2 text-xs text-neutral-500 flex-wrap">
            <button
              onClick={() => {
                if (onBackToHome) onBackToHome();
                else setCurrentPage('home');
              }}
              className="hover:text-[#102a1c] font-semibold cursor-pointer"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <span className="text-[#102a1c] font-bold">
              {isAr ? (pageData?.titleAr || 'الصفحة الرسمية') : (pageData?.titleEn || 'Official Page')}
            </span>
          </div>

          <button
            onClick={() => {
              if (onBackToHome) onBackToHome();
              else setCurrentPage('home');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#102a1c] text-[#e6ca98] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{isAr ? 'العودة للمتجر' : 'Back to Store'}</span>
          </button>
        </div>

        {/* Dynamic Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-block px-3 py-1 rounded-full bg-[#102a1c]/5 text-[#102a1c] border border-[#102a1c]/15 text-[11px] font-black uppercase tracking-wider">
            {storeName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#102a1c] font-serif tracking-tight">
            {isAr ? pageData?.titleAr : pageData?.titleEn}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-light">
            {isAr ? pageData?.metaDescriptionAr : pageData?.metaDescriptionEn}
          </p>
        </div>

        {/* 1. INTERACTIVE ORDER TRACKING SECTION */}
        {effectiveSlug === 'order-tracking' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#102a1c]/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-2xl bg-[#102a1c] text-[#e6ca98] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#102a1c]">
                  {isAr ? 'تتبع شحنتك المباشرة' : 'Track Your Live Shipment'}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isAr ? 'أدخل رقم الطلب أو رقم الجوال لمتابعة خط سير التوصيل المبرد' : 'Enter your order ID or mobile number to track refrigerated delivery'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder={isAr ? 'رقم الطلب (مثال: #HDY-84210 أو 050xxxxxxx)' : 'Order ID (e.g. #HDY-84210 or mobile)'}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 focus:outline-hidden focus:border-[#102a1c]"
              />
              <button
                type="submit"
                disabled={isSearchingTrack}
                className="px-6 py-3 bg-[#102a1c] hover:bg-[#163826] text-[#e6ca98] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearchingTrack ? (isAr ? 'جاري البحث...' : 'Searching...') : (isAr ? 'تتبع الآن' : 'Track Now')}</span>
              </button>
            </form>

            {/* Tracking Result */}
            {trackingResult && trackingResult.notFound && (
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2 animate-in fade-in duration-300">
                <p className="text-xs font-bold text-amber-900">
                  {isAr
                    ? `لم يتم العثور على طلب برقم (${trackingResult.orderNumber}). يرجى التأكد من الرقم والمحاولة مرة أخرى.`
                    : `No active order found for reference (${trackingResult.orderNumber}). Please verify the order number.`}
                </p>
              </div>
            )}

            {trackingResult && !trackingResult.notFound && (
              <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                  <div>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase block">
                      {isAr ? 'رقم الطلب' : 'Order Reference'}
                    </span>
                    <span className="text-lg font-black text-[#102a1c] font-mono">
                      {trackingResult.orderNumber}
                    </span>
                  </div>
                  <div className="sm:text-end">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-block">
                      {trackingResult.status}
                    </span>
                    <div className="text-xs text-neutral-500 mt-1">
                      {isAr ? 'التوصيل المتوقع:' : 'Est. Delivery:'} <span className="font-bold text-neutral-900">{trackingResult.estimatedDelivery}</span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4 pt-2">
                  {trackingResult.steps.map((st: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        st.done ? 'bg-[#102a1c] text-[#e6ca98]' : 'bg-neutral-200 text-neutral-400'
                      }`}>
                        {st.done ? '✓' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-xs font-bold ${st.done ? 'text-black' : 'text-neutral-400'}`}>
                          {isAr ? st.titleAr : st.titleEn}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
                  <span className="text-[11px]">{trackingResult.courier} · {trackingResult.destination}</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{isAr ? 'توصيل مبرد' : 'Chilled Fleet'}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. CONTACT US INTERACTIVE FORM */}
        {effectiveSlug === 'contact-us' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#102a1c]/10 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-[#102a1c]">
                {isAr ? 'أرسل لنا استفسارك أو طلبك الخاص' : 'Send Us a Message'}
              </h3>

              {contactSent ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">{isAr ? 'تم استلام رسالتك بنجاح!' : 'Message Sent Successfully!'}</h4>
                  <p className="text-xs text-emerald-700">{isAr ? 'سيتواصل معك فريق خدمة العملاء خلال أقل من ٣٠ دقيقة.' : 'Our customer support team will reply within 30 minutes.'}</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">{isAr ? 'الاسم الكريم' : 'Full Name'}</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-hidden focus:border-[#102a1c]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">{isAr ? 'رقم الجوال' : 'Mobile Phone'}</label>
                      <input
                        type="tel"
                        required
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-hidden focus:border-[#102a1c]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-hidden focus:border-[#102a1c]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">{isAr ? 'نص الرسالة أو تفاصيل المناسبة' : 'Message or Custom Order Details'}</label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 focus:outline-hidden focus:border-[#102a1c]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-[#102a1c] hover:bg-[#163826] text-[#e6ca98] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إرسال الرسالة' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>

            <div className="md:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-[#102a1c]/10 shadow-sm space-y-4 text-xs">
                <h4 className="font-bold text-sm text-[#102a1c] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#cca65b]" />
                  <span>{isAr ? 'بيانات التواصل الرسمية' : 'Contact Channels'}</span>
                </h4>
                <div className="space-y-3 text-neutral-600">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>+966 50 123 4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>WhatsApp: +966 50 123 4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{isAr ? 'مكة المكرمة - العاصمة المقدسة' : 'Makkah Al-Mukarramah, KSA'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STANDARD POLICY OR CUSTOM DASHBOARD PAGE CONTENT */}
        {effectiveSlug !== 'order-tracking' && effectiveSlug !== 'contact-us' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#102a1c]/10 shadow-sm">
            <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed space-y-4">
              {pageData ? (
                <div
                  className="whitespace-pre-line text-xs sm:text-sm font-normal text-neutral-800"
                  dangerouslySetInnerHTML={{
                    __html: (isAr ? pageData.contentAr : pageData.contentEn)
                      .replace(/\{STORE_NAME\}/g, storeName)
                      .replace(/\n\n/g, '<br/><br/>'),
                  }}
                />
              ) : (
                <div className="text-center py-12 text-neutral-500 text-xs">
                  {isAr ? 'جاري تحميل محتوى الصفحة من لوحة التحكم...' : 'Loading page content from Store Dashboard...'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
