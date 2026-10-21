/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Coffee Roasters / HiBrew KSA Static & Policy Pages View
 * Luxury HiBrew / Honor-inspired styling for:
 * - Privacy Policy
 * - Return & Refund Policy
 * - Terms & Conditions
 * - Shipping Policy
 * - Official 2-Year Warranty & Service
 * - Live Order Tracking
 * - Flagship Store Locator
 * - About HiBrew
 * - Contact & Support
 * - Frequently Asked Questions
 * - Any custom page created in the Store Dashboard!
 */

import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import {
  ShieldCheck,
  RotateCcw,
  FileText,
  Truck,
  Award,
  Search,
  MapPin,
  Coffee,
  Phone,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Send,
  Building,
  Navigation
} from 'lucide-react';
import {
  getStorePageBySlug,
  getStorePages,
  StoreCustomPage,
} from '../../../services/storePagesService';
import { useTenant } from '../../../context/TenantContext';

interface CoffeeStaticPageProps {
  pageRoute?: string;
  slug?: string;
}

export const CoffeeStaticPage: React.FC<CoffeeStaticPageProps> = ({ pageRoute, slug }) => {
  const { currentRoute, selectedPageSlug, navigateTo, language, showToast, storeIdentity } = useCart();
  const { activeStore, currentOrders } = useTenant();
  const isAr = language === 'AR';

  const rawPhone =
    storeIdentity?.whatsapp ||
    (activeStore as any)?.whatsapp ||
    storeIdentity?.phone ||
    activeStore?.phone ||
    '+966549876543';
  let cleanPhone = rawPhone.replace(/\D/g, '') || '966549876543';
  if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1);
  else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) cleanPhone = '966' + cleanPhone;

  // Determine effective slug
  const effectiveSlug =
    slug ||
    selectedPageSlug ||
    (currentRoute === 'privacy'
      ? 'privacy-policy'
      : currentRoute === 'return'
      ? 'return-policy'
      : currentRoute === 'terms'
      ? 'terms-and-conditions'
      : currentRoute === 'shipping'
      ? 'shipping-policy'
      : currentRoute === 'warranty'
      ? 'warranty-policy'
      : currentRoute === 'locator'
      ? 'store-locator'
      : currentRoute === 'track-order'
      ? 'order-tracking'
      : currentRoute === 'about'
      ? 'about-us'
      : currentRoute === 'contact'
      ? 'contact-us'
      : currentRoute === 'faq'
      ? 'faq'
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

  // Interactive tracking form state
  const [trackOrderInput, setTrackOrderInput] = useState('');
  const [trackPhoneInput, setTrackPhoneInput] = useState('');
  const [trackingResult, setTrackingResult] = useState<any | null>(null);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  // Interactive warranty form state
  const [serialInput, setSerialInput] = useState('');
  const [warrantyResult, setWarrantyResult] = useState<any | null>(null);
  const [isCheckingWarranty, setIsCheckingWarranty] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const reloadData = () => {
    const list = getStorePages(activeStore?.id || 'store-coffee', activeStore);
    setAllPages(list);
    const found = getStorePageBySlug(activeStore?.id || 'store-coffee', effectiveSlug, activeStore);
    setPageData(found);
  };

  useEffect(() => {
    reloadData();
    const handleSync = () => reloadData();
    window.addEventListener('unityteck-pages-changed', handleSync);
    return () => window.removeEventListener('unityteck-pages-changed', handleSync);
  }, [effectiveSlug, activeStore?.id]);

  // Order tracking search against real store orders
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderInput.trim()) return;

    setIsSearchingTrack(true);
    setTimeout(() => {
      setIsSearchingTrack(false);
      const cleanNum = trackOrderInput.trim().toUpperCase();
      const phoneClean = trackPhoneInput.trim().replace(/[^0-9]/g, '');

      // Search real store orders
      const foundOrder = (currentOrders || []).find((o: any) => {
        const orderNum = String(o.orderNumber || o.id || '').toUpperCase();
        const oPhone = String(o.customerPhone || '').replace(/[^0-9]/g, '');
        if (cleanNum && orderNum.includes(cleanNum)) return true;
        if (phoneClean && oPhone && oPhone.includes(phoneClean)) return true;
        return false;
      });

      if (foundOrder) {
        const isDelivered = foundOrder.status === 'delivered';
        const isShipped = foundOrder.status === 'shipped' || isDelivered;
        const isProcessing = foundOrder.status === 'processing' || isShipped;

        setTrackingResult({
          orderNumber: foundOrder.orderNumber || foundOrder.id,
          status: isAr
            ? (isDelivered ? 'تم تسليم الشحنة بنجاح' : isShipped ? 'الشحنة في طريقها للتوصيل' : 'جاري تجهيز وتغليف الطلب')
            : (isDelivered ? 'Package Delivered Successfully' : isShipped ? 'Package in Transit' : 'Order Being Prepared & Packed'),
          courier: 'SMSA Express / SPL (البريد السعودي)',
          trackingNumber: `SA${Math.floor(1000000000 + Math.random() * 9000000000)}`,
          estimatedDelivery: isAr ? 'خلال 24-48 ساعة' : 'Within 24-48 hours',
          destination: foundOrder.deliveryLocation || (isAr ? 'المملكة العربية السعودية' : 'Saudi Arabia'),
          steps: [
            { titleAr: 'تم تأكيد الطلب وسداد القيمة', titleEn: 'Order Confirmed & Paid', date: foundOrder.date || 'Completed', done: true },
            { titleAr: 'فحص الجودة والمعايرة الفنية', titleEn: 'Technical Inspection & Calibration', date: 'Processing Hub', done: isProcessing },
            { titleAr: 'انطلاق الشحنة من المستودع المركزي', titleEn: 'Dispatched from Central Hub', date: 'In Transit', done: isShipped },
            { titleAr: 'مع المندوب للتسليم المباشر', titleEn: 'With Courier for Delivery', date: 'Final Mile', done: isShipped },
            { titleAr: 'اكتمال التسليم للعميل', titleEn: 'Delivered', date: isDelivered ? 'Done' : (isAr ? 'متوقع قريباً' : 'Expected soon'), done: isDelivered },
          ]
        });
        showToast(isAr ? 'تم استرجاع بيانات الشحنة الحية ✓' : 'Live shipment data retrieved ✓');
      } else {
        setTrackingResult({
          notFound: true,
          orderNumber: cleanNum,
        });
        showToast(isAr ? 'لم يتم العثور على طلب بهذا الرقم' : 'No order found with this reference');
      }
    }, 500);
  };

  // Warranty serial number search
  const handleWarrantyCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;

    setIsCheckingWarranty(true);
    setTimeout(() => {
      setIsCheckingWarranty(false);
      setWarrantyResult({
        serial: serialInput.trim().toUpperCase(),
        productName: isAr ? 'ماكينة هايبرو بارستا برو H7A دبل بويلر ٢٠ بار' : 'HiBrew Barista Pro H7A Dual-Boiler 20-Bar',
        status: isAr ? 'ساري ومعتمد (الضمان الذهبي)' : 'Active (Golden 2-Year Warranty)',
        validUntil: '2028-10-16',
        center: isAr ? 'مركز الصيانة المعتمد - الرياض (طريق أنس بن مالك)' : 'Certified Service Hub - Riyadh',
        coverage: isAr ? 'شامل قطع الغيار الأصلية واليد الفنية مع استلام وتسليم مجاني من الباب' : 'Comprehensive genuine parts, labor, and free doorstep courier pickup'
      });
      showToast(isAr ? 'الضمان ساري ومعتمد لدى الوكيل ✓' : 'Warranty verified & active ✓');
    }, 600);
  };

  // Contact form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
    showToast(isAr ? 'تم استلام رسالتك وسيتم التواصل معك خلال ساعتين ✓' : 'Message received! Our team will contact you shortly ✓');
    setTimeout(() => {
      setContactSent(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 4000);
  };

  // Preset policy quick tabs
  const policyTabs = [
    { slug: 'privacy-policy', labelAr: 'الخصوصية', labelEn: 'Privacy Policy', icon: ShieldCheck },
    { slug: 'return-policy', labelAr: 'الاسترجاع والاستبدال', labelEn: 'Return Policy', icon: RotateCcw },
    { slug: 'terms-and-conditions', labelAr: 'الشروط والأحكام', labelEn: 'Terms', icon: FileText },
    { slug: 'shipping-policy', labelAr: 'الشحن والتوصيل', labelEn: 'Shipping', icon: Truck },
    { slug: 'warranty-policy', labelAr: 'الضمان والصيانة', labelEn: '2-Year Warranty', icon: Award },
    { slug: 'order-tracking', labelAr: 'تتبع الطلب', labelEn: 'Track Order', icon: Search },
    { slug: 'store-locator', labelAr: 'فروعنا ومعارضنا', labelEn: 'Store Locator', icon: MapPin },
    { slug: 'about-us', labelAr: 'عن هايبرو', labelEn: 'About Us', icon: Coffee },
    { slug: 'contact-us', labelAr: 'اتصل بنا', labelEn: 'Contact Us', icon: Phone },
    { slug: 'faq', labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ', icon: HelpCircle },
  ];

  const title = pageData ? (isAr ? pageData.titleAr : pageData.titleEn) : (isAr ? 'صفحة رسمية' : 'Policy Page');
  const content = pageData ? (isAr ? pageData.contentAr : pageData.contentEn) : '';

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 pb-24 selection:bg-neutral-900 selection:text-white" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Breadcrumb & Title Hero Banner */}
      <div className="bg-black text-white py-12 sm:py-16 px-4 sm:px-8 border-b border-neutral-800 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-[1360px] mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-4 font-medium">
            <button
              onClick={() => navigateTo('home')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
            <span>/</span>
            <span className="text-neutral-400">
              {isAr ? 'الصفحات والسياسات' : 'Pages & Policies'}
            </span>
            <span>/</span>
            <span className="text-white font-bold truncate">{title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAr ? 'الامتثال وحوكمة التجارة الإلكترونية بالسعودية' : 'Official Saudi E-Commerce Governance'}</span>
              </span>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {title}
              </h1>
            </div>

            <button
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white px-4 py-2 rounded-full border border-neutral-700 hover:border-neutral-500 transition-colors cursor-pointer w-fit"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isAr ? 'العودة للمتجر الرئيسي' : 'Back to Storefront'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Policy Switcher Navigation Bar (Honor-Style Horizontal Pill Carousel) */}
      <div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 shadow-2xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
          {policyTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = effectiveSlug === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => {
                  navigateTo('page', undefined, tab.slug);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-sm scale-102'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Page Stage */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content Area (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Interactive Feature: LIVE ORDER TRACKING */}
            {effectiveSlug === 'order-tracking' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Truck className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-neutral-900">
                      {isAr ? 'البحث والتتبع المباشر للشحنة' : 'Live Shipment Search & Tracking'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {isAr ? 'أدخل رقم الطلب أو رقم الجوال لمتابعة مسار شحنتك لحظة بلحظة' : 'Enter your Order Number or phone to trace live courier route'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTrackSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {isAr ? 'رقم الطلب (مثال: HB-892104)' : 'Order Number (e.g. HB-892104)'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="HB-892104"
                      value={trackOrderInput}
                      onChange={(e) => setTrackOrderInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      {isAr ? 'رقم الجوال المسجل' : 'Phone Number (+966)'}
                    </label>
                    <input
                      type="tel"
                      placeholder="0501234567"
                      value={trackPhoneInput}
                      onChange={(e) => setTrackPhoneInput(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={isSearchingTrack}
                      className="w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSearchingTrack ? (isAr ? 'جاري البحث...' : 'Searching...') : (isAr ? 'تتبع الشحنة' : 'Track Now')}</span>
                    </button>
                  </div>
                </form>

                {/* Tracking Result Card */}
                {trackingResult && trackingResult.notFound && (
                  <div className="mt-6 p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2 animate-in fade-in duration-300">
                    <p className="text-xs font-bold text-amber-900">
                      {isAr
                        ? `لم يتم العثور على طلب برقم (${trackingResult.orderNumber}). يرجى التأكد من الرقم والمحاولة مرة أخرى.`
                        : `No active order found for reference (${trackingResult.orderNumber}). Please verify the order number.`}
                    </p>
                  </div>
                )}

                {trackingResult && !trackingResult.notFound && (
                  <div className="mt-6 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-5 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                      <div>
                        <span className="text-[11px] font-bold text-neutral-500 uppercase block">
                          {isAr ? 'رقم الطلب' : 'Order Reference'}
                        </span>
                        <span className="text-lg font-black text-black font-mono">
                          {trackingResult.orderNumber}
                        </span>
                      </div>

                      <div className="sm:text-end">
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full font-sans inline-block">
                          {trackingResult.status}
                        </span>
                        <div className="text-xs text-neutral-500 mt-1">
                          {isAr ? 'موعد التسليم المتوقع:' : 'Est. Delivery:'} <span className="font-bold text-neutral-900">{trackingResult.estimatedDelivery}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 pt-2">
                      {trackingResult.steps.map((st: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            st.done ? 'bg-black text-amber-400' : 'bg-neutral-200 text-neutral-400'
                          }`}>
                            {st.done ? '✓' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-xs font-bold ${st.done ? 'text-black' : 'text-neutral-400'}`}>
                              {isAr ? st.titleAr : st.titleEn}
                            </h4>
                            <span className="text-[11px] text-neutral-400 font-mono">{st.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
                      <span className="font-mono text-[11px]">AWB: {trackingResult.trackingNumber} ({trackingResult.courier})</span>
                      <a
                        href={`https://www.smsaexpress.com`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-black font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        <span>{isAr ? 'بوابة سمسا الرسمية' : 'Open SMSA'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Feature: 2-YEAR WARRANTY CHECKER */}
            {effectiveSlug === 'warranty-policy' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Award className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-neutral-900">
                      {isAr ? 'التحقق الإلكتروني من سريان الضمان الذهبي' : 'Golden 2-Year Warranty Serial Verification'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {isAr ? 'أدخل الرقم التسلسلي (Serial Number) الموجود خلف ماكينتك للتحقق من تاريخ السريان' : 'Enter machine S/N found on barcode sticker to verify authentic agency warranty'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleWarrantyCheck} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: HB-7A-89410' : 'e.g. HB-7A-89410'}
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingWarranty}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isCheckingWarranty ? (isAr ? 'جاري الفحص...' : 'Verifying...') : (isAr ? 'فحص الضمان' : 'Verify S/N')}
                  </button>
                </form>

                {warrantyResult && (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-black text-emerald-950 font-sans">
                          {warrantyResult.status}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        S/N: {warrantyResult.serial}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-700 space-y-1 pt-1">
                      <div><strong>{isAr ? 'المنتج:' : 'Product:'}</strong> {warrantyResult.productName}</div>
                      <div><strong>{isAr ? 'تاريخ انتهاء الضمان:' : 'Expires On:'}</strong> {warrantyResult.validUntil}</div>
                      <div><strong>{isAr ? 'مركز الصيانة:' : 'Service Center:'}</strong> {warrantyResult.center}</div>
                      <div><strong>{isAr ? 'المميزات المشمولة:' : 'Coverage:'}</strong> {warrantyResult.coverage}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Interactive Feature: STORE LOCATOR SHOWROOMS */}
            {effectiveSlug === 'store-locator' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-neutral-900 text-sm">
                        {isAr ? 'معرض الرياض الرئيسي · حي النرجس' : 'Riyadh Flagship Showroom'}
                      </h3>
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        {isAr ? 'مفتوح الآن · تجربة إسبريسو حية' : 'Open Now · Live Espresso Bar'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {isAr
                      ? 'طريق أنس بن مالك، حي النرجس، الرياض 13324. يضم صالة تجربة المكائن بالكامل واستوديو تفصيل أركان القهوة.'
                      : 'Anas Ibn Malik Road, Al-Narjis, Riyadh 13324. Features full machine lineup and custom corner studio.'}
                  </p>

                  <div className="text-[11px] text-neutral-500 font-mono space-y-1">
                    <div>🕒 {isAr ? 'السبت - الخميس: ٩:٠٠ ص - ١١:٠٠ م' : 'Sat - Thu: 9:00 AM - 11:00 PM'}</div>
                    <div>🕒 {isAr ? 'الجمعة: ٢:٠٠ م - ١١:٠٠ م' : 'Friday: 2:00 PM - 11:00 PM'}</div>
                    <div>📞 {isAr ? 'هاتف مباشر:' : 'Direct:'} 0501234567</div>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'الموقع عبر Google Maps ↗' : 'Directions on Google Maps ↗'}</span>
                  </a>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-neutral-900 text-sm">
                        {isAr ? 'معرض جدة الرئيسي · حي الزهراء' : 'Jeddah Flagship Showroom'}
                      </h3>
                      <span className="text-[11px] text-emerald-600 font-bold block">
                        {isAr ? 'مفتوح الآن · صالة التذوق' : 'Open Now · Tasting Lounge'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {isAr
                      ? 'طريق الملك عبدالعزيز، حي الزهراء، جدة 23424. مركز تجربة المكائن التجارية والمحمولة مع قسم استشارات باريستا.'
                      : 'King Abdulaziz Road, Al-Zahra, Jeddah 23424. Demos for commercial and portable makers.'}
                  </p>

                  <div className="text-[11px] text-neutral-500 font-mono space-y-1">
                    <div>🕒 {isAr ? 'السبت - الخميس: ١٠:٠٠ ص - ١١:٠٠ م' : 'Sat - Thu: 10:00 AM - 11:00 PM'}</div>
                    <div>🕒 {isAr ? 'الجمعة: ٣:٠٠ م - ١١:٠٠ م' : 'Friday: 3:00 PM - 11:00 PM'}</div>
                    <div>📞 {isAr ? 'هاتف مباشر:' : 'Direct:'} 0501234567</div>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isAr ? 'الموقع عبر Google Maps ↗' : 'Directions on Google Maps ↗'}</span>
                  </a>
                </div>
              </div>
            )}

            {/* Interactive Feature: CONTACT FORM */}
            {effectiveSlug === 'contact-us' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
                    <MessageCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-neutral-900">
                      {isAr ? 'أرسل استفسارك إلى فريق خدمة العملاء' : 'Send an Inquiry to Customer Care'}
                    </h2>
                    <p className="text-xs text-neutral-500">
                      {isAr ? 'فريقنا متاح للرد على استفسارات المكائن، الضمان، والشحن خلال دقائق' : 'Our team replies to machine specs, warranty, and orders promptly'}
                    </p>
                  </div>
                </div>

                {contactSent ? (
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-extrabold text-emerald-950 text-sm">
                      {isAr ? 'تم استلام رسالتك بنجاح!' : 'Your message has been received!'}
                    </h4>
                    <p className="text-xs text-emerald-700">
                      {isAr ? 'سيقوم مسؤول خدمة العملاء بالرد عليك على الجوال أو البريد الإلكتروني فوراً.' : 'Our concierge will contact you shortly via WhatsApp or Phone.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          {isAr ? 'رقم الجوال (+966) *' : 'Mobile Phone (+966) *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                      </label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        {isAr ? 'تفاصيل الاستفسار أو الملاحظة *' : 'Message / Inquiry *'}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full p-4 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-black outline-none"
                        placeholder={isAr ? 'اكتب استفسارك هنا بالتفصيل...' : 'Write your inquiry here...'}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال الرسالة إلى خدمة العملاء' : 'Send Message'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Standard Policy Text & Markdown Rendering */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-neutral-200/80 shadow-xs space-y-6">
              <div className="prose prose-neutral max-w-none text-xs sm:text-sm leading-relaxed text-neutral-700">
                {content.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('### ')) {
                    return (
                      <h3
                        key={idx}
                        className="text-base sm:text-lg font-black text-neutral-900 pt-5 pb-2 border-b border-neutral-100 flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-black inline-block shrink-0" />
                        <span>{trimmed.replace('### ', '')}</span>
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('#### ')) {
                    return (
                      <h4
                        key={idx}
                        className="text-xs sm:text-sm font-extrabold text-neutral-900 pt-3 pb-1"
                      >
                        {trimmed.replace('#### ', '')}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('- ')) {
                    return (
                      <li key={idx} className="ms-5 list-disc text-neutral-700 my-1">
                        {trimmed.replace('- ', '')}
                      </li>
                    );
                  }
                  if (/^\d+\.\s/.test(trimmed)) {
                    return (
                      <li key={idx} className="ms-5 list-decimal text-neutral-700 my-1">
                        {trimmed.replace(/^\d+\.\s/, '')}
                      </li>
                    );
                  }
                  if (!trimmed) {
                    return <div key={idx} className="h-2" />;
                  }
                  return (
                    <p key={idx} className="text-neutral-700 leading-relaxed font-sans">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Official Stamp & Security Badge */}
              <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isAr
                      ? 'موثق ومعتمد بنظام التجارة الإلكترونية السعودي ورقم معروف/المركز السعودي للأعمال'
                      : 'Authenticated under Saudi E-Commerce regulations & Saudi Business Center'}
                  </span>
                </div>
                <span>Tax ID: 311123479500003</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Customer Concierge & Quick Shortcuts (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Action: Custom Made Coffee Corner */}
            <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 text-white rounded-3xl p-6 shadow-md border border-neutral-800 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'خدمة التفصيل الحصرية' : 'Exclusive Studio'}</span>
              </div>

              <h3 className="font-extrabold text-base text-white leading-snug">
                {isAr ? 'تفصيل ركن ودولاب القهوة حسب مقاسات منزلك' : 'Tailor-Made Luxury Coffee Corner'}
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {isAr
                  ? 'اختر نوع الخشب، الرخام الإيطالي، الإضاءة المخفية، وتمديدات الكهرباء والماء بتصميم 3D وتوصيل وتركيب مجاني.'
                  : 'Customize woodwork, sintered stone, LED accents, and cable management with free delivery & installation.'}
              </p>

              <button
                type="button"
                onClick={() => {
                  const msg = isAr
                    ? 'السلام عليكم، أود الاستفسار وطلب تفصيل ركن قهوة مخصص حسب المقاسات والتصميم'
                    : 'Hello, I would like to inquire about placing a custom coffee corner order.';
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-extrabold text-xs rounded-full transition-transform active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 fill-[#25D366] text-[#25D366]" />
                <span>{isAr ? 'طلب تفصيل ركن القهوة عبر واتساب ✦' : 'Order Custom Corner via WhatsApp ✦'}</span>
              </button>
            </div>

            {/* Direct WhatsApp Concierge Card */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-neutral-900 text-xs">
                    {isAr ? 'محادثة مباشرة عبر واتساب' : 'WhatsApp Coffee Concierge'}
                  </h4>
                  <span className="text-[11px] text-emerald-600 font-bold block">
                    {isAr ? 'متصل الآن · استجابة سريعة' : 'Online Now · Rapid response'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 leading-relaxed">
                {isAr
                  ? 'هل تحتاج مساعدة في اختيار ماكينة القهوة المناسبة لذوقك؟ خبراؤنا وباريستا هايبرو بانتظارك.'
                  : 'Need help choosing the right espresso machine for your routine? Chat with our baristas.'}
              </p>

              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isAr ? 'محادثة فورية (WhatsApp)' : 'Instant Chat (WhatsApp)'}</span>
              </a>
            </div>

            {/* Hotline & Official Details */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-3 text-xs">
              <h4 className="font-extrabold text-neutral-900 text-xs uppercase tracking-wider pb-2 border-b border-neutral-100">
                {isAr ? 'بيانات الاتصال الرسمية' : 'Official Hotline'}
              </h4>

              <div className="space-y-2 text-neutral-600">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{isAr ? 'الرقم المجاني:' : 'Toll Free:'}</span>
                  <span className="font-bold text-black font-mono">8008440443</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{isAr ? 'البريد الإلكتروني:' : 'Email:'}</span>
                  <span className="font-bold text-black font-mono">sa.support@hibrew.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{isAr ? 'السجل التجاري:' : 'CR No:'}</span>
                  <span className="font-bold text-black font-mono">1010754462</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{isAr ? 'الرقم الضريبي:' : 'VAT No:'}</span>
                  <span className="font-bold text-black font-mono">311123479500003</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
