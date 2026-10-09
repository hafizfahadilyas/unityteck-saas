import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Search,
  Package,
  Phone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText,
  Calendar,
} from 'lucide-react';
import type { Order } from '../../types';

interface TrackOrderPageProps {
  lang: string;
  orders: Order[];
  money: (n: number) => string;
  onBack: () => void;
  initialOrderRef?: string;
}

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({
  lang,
  orders,
  money,
  onBack,
  initialOrderRef = '',
}) => {
  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState(initialOrderRef || '');
  const [activeStep, setActiveStep] = useState(3); // Step 4 (0-indexed 3): Out for delivery

  // Look for order by query or fallback to first order or demo data
  const matchedOrder = orders.find(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      o.customerPhone.includes(searchQuery.trim()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase().trim())
  ) || (orders.length > 0 ? orders[0] : null);

  const displayOrderRef = matchedOrder?.id ? `WM-${matchedOrder.id.slice(-6).toUpperCase()}` : 'WM-782419';
  const displayCustomer = matchedOrder?.customerName || (isAr ? 'عبدالله بن سلطان الشريف' : 'Abdullah Al-Sharif');
  const displayPhone = matchedOrder?.customerPhone || '+966 50 442 8819';
  const displayLocation = matchedOrder?.deliveryLocation || (isAr ? 'فندق برج الساعة - فيرمونت مكة' : 'Makkah Clock Royal Tower Hotel');
  const displayTotal = matchedOrder ? money(matchedOrder.total) : `${money(490)}`;
  const displaySummary = matchedOrder?.itemsSummary || (isAr ? 'باقة جوري ملكي أحمر فاخر (x1) · كرت إهداء خاص' : 'Royal Red Velvet Rose Bouquet (x1) · Luxury Card');

  const steps = [
    {
      step: 1,
      titleAr: 'تم استلام الطلب وتسجيله',
      titleEn: 'Order Received & Registered',
      descAr: 'تم استقبال الطلب عبر المتجر الإلكتروني وإسناده لمنسقي الأزهار بمكة',
      descEn: 'Order placed via online store and assigned to Holy Makkah floral team',
      time: '10:15 AM',
      date: 'اليوم',
      status: 'completed',
    },
    {
      step: 2,
      titleAr: 'تأكيد الدفع وإصدار الفاتورة',
      titleEn: 'Payment Confirmed & ZATCA Invoice',
      descAr: 'تم الدفع بنجاح عبر مدى / أبل باي وإصدار الفاتورة الضريبية المشفرة',
      descEn: 'Paid successfully via Mada/Apple Pay; certified electronic invoice generated',
      time: '10:18 AM',
      date: 'اليوم',
      status: 'completed',
    },
    {
      step: 3,
      titleAr: 'تجهيز وتنسيق باقة الورد الطبيعي',
      titleEn: 'Floral Handcrafting in Progress',
      descAr: 'تم اختيار الورود الطازجة وربط شريط الساتان الملكي مع بطاقة الإهداء',
      descEn: 'Fresh Dutch roses arranged with luxury satin ribbon and custom gift card',
      time: '10:45 AM',
      date: 'اليوم',
      status: 'completed',
    },
    {
      step: 4,
      titleAr: 'خرج للتوصيل المبرد (18°C)',
      titleEn: 'Out for Refrigerated Delivery (18°C)',
      descAr: 'الكابتن في طريقه للفندق بسيارة مجهزة بالتبريد لضمان أعلى نضارة للورد',
      descEn: 'Courier dispatched in climate-controlled 18°C vehicle towards Makkah hotel',
      time: '11:20 AM',
      date: 'اليوم',
      status: 'current',
    },
    {
      step: 5,
      titleAr: 'تم التسليم بنجاح',
      titleEn: 'Delivered to Doorstep / Hotel',
      descAr: 'تسليم الباقة باليد للغرفة أو استقبال الفندق مع التقاط صورة التسليم',
      descEn: 'Bouquet hand-delivered to guest suite or reception desk with photo confirmation',
      time: '12:00 PM',
      date: 'اليوم',
      status: 'pending',
    },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer mb-2"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>{isAr ? 'العودة للمتجر الرئيسي' : 'Back to Storefront'}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--sf-text)' }}>
              {isAr ? 'تتبع الطلب المباشر (تتبع الشحنة)' : 'Live Order & Courier Tracking'}
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--sf-muted)' }}>
            {isAr
              ? 'متابعة لحظية لحالة تجهيز ونقل باقة الأزهار من ورشتنا إلى فندق الحرم في مكة المكرمة'
              : 'Real-time live progress of your floral arrangement from our studio to your Makkah doorstep'}
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold self-start">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{isAr ? 'التتبع نشط · مباشر' : 'Live Courier GPS Active'}</span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div
        className="p-4 rounded-2xl border shadow-xs space-y-2"
        style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
      >
        <label className="text-xs font-bold block" style={{ color: 'var(--sf-text)' }}>
          {isAr ? 'ابحث برقم الطلب أو رقم الجوال:' : 'Search by Order Number or Phone:'}
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 opacity-50 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? 'أدخل رقم الطلب مثل: WM-782419 أو 0504428819' : 'Enter reference e.g. WM-782419 or phone'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-9 pe-4 py-2.5 rounded-xl border text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              style={{ background: 'var(--sf-bg)', borderColor: 'var(--sf-border)', color: 'var(--sf-text)' }}
            />
          </div>
          <button
            type="button"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isAr ? 'تتبع' : 'Track'}</span>
          </button>
        </div>
      </div>

      {/* Order Summary & Dispatch Card */}
      <div
        className="rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4"
        style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
              {isAr ? 'رقم التتبع الموحد' : 'Tracking Reference'}
            </span>
            <h2 className="text-lg font-black font-mono" style={{ color: 'var(--sf-text)' }}>
              {displayOrderRef}
            </h2>
            <p className="text-xs" style={{ color: 'var(--sf-muted)' }}>
              {isAr ? 'العميل:' : 'Customer:'} <span className="font-bold" style={{ color: 'var(--sf-text)' }}>{displayCustomer}</span> · {displayPhone}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-start sm:text-end">
              <span className="text-[10px] uppercase font-bold block" style={{ color: 'var(--sf-muted)' }}>
                {isAr ? 'إجمالي المدفوع (شامل الضريبة)' : 'Total Amount Paid'}
              </span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {displayTotal}
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Courier & Location Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-3.5 rounded-2xl border space-y-2" style={{ background: 'var(--sf-bg)', borderColor: 'var(--sf-border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              {isAr ? 'عنوان وموقع التسليم بمكة المكرمة' : 'Delivery Destination in Makkah'}
            </span>
            <div className="flex items-start gap-2 text-xs font-bold" style={{ color: 'var(--sf-text)' }}>
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{displayLocation}</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
              {displaySummary}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl border space-y-2" style={{ background: 'var(--sf-bg)', borderColor: 'var(--sf-border)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
              {isAr ? 'مندوب التوصيل المعتمد' : 'Assigned Courier Captain'}
            </span>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black" style={{ color: 'var(--sf-text)' }}>
                  {isAr ? 'كابتن / أحمد الزهراني' : 'Captain Ahmed Al-Zahrani'}
                </h4>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  {isAr ? 'سيارة مجهزة تبريد 18°C · توصيل خاص' : 'Refrigerated Van 18°C · White Glove Delivery'}
                </span>
              </div>
              <a
                href={`https://wa.me/966504428819?text=${encodeURIComponent(
                  `السلام عليكم، أود الاستفسار عن طلبي رقم ${displayOrderRef}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'واتساب' : 'WhatsApp'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Timeline View */}
      <div
        className="rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6"
        style={{ background: 'var(--sf-surface)', borderColor: 'var(--sf-border)' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--sf-text)' }}>
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'المراحل الخمس لتنفيذ وتسليم الطلب (5-Step Timeline)' : '5-Step Order Execution & Delivery Timeline'}</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-600">
            {isAr ? 'المرحلة 4 من 5 مكتملة' : 'Step 4 of 5 Active'}
          </span>
        </div>

        <div className="relative space-y-6 before:absolute before:inset-0 before:start-4 sm:before:start-5 before:w-0.5 before:bg-emerald-200 dark:before:bg-emerald-900">
          {steps.map((s, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            const isPending = idx > activeStep;

            return (
              <div key={s.step} className="relative flex items-start gap-4 sm:gap-6 group">
                {/* Step Circle Indicator */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-transform ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md'
                      : isCurrent
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 dark:ring-emerald-950 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : isCurrent ? (
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="text-xs font-bold">{s.step}</span>
                  )}
                </div>

                {/* Step Content Card */}
                <div
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs'
                      : isCompleted
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                  style={{ background: isCurrent ? undefined : 'var(--sf-bg)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs sm:text-sm font-black" style={{ color: 'var(--sf-text)' }}>
                      {isAr ? s.titleAr : s.titleEn}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {s.date} · {s.time}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                    {isAr ? s.descAr : s.descEn}
                  </p>

                  {isCurrent && (
                    <div className="mt-3 flex items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>{isAr ? 'الوقت المتوقع للوصول: 25 دقيقة' : 'Estimated arrival: 25 mins'}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Support Notice */}
        <div className="pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" style={{ borderColor: 'var(--sf-border)', color: 'var(--sf-muted)' }}>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'خدمة عملاء زهور مكة متاحة على مدار الساعة' : 'Makkah Florist Concierge 24/7 Available'}</span>
          </span>
          <a
            href="tel:+966504428819"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>+966 50 442 8819</span>
          </a>
        </div>
      </div>
    </div>
  );
};
