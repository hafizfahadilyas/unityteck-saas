import React from 'react';
import {
  Box,
  Wrench,
  UtensilsCrossed,
  Download,
  CreditCard,
  Boxes,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  Info,
  BookOpen,
  ChevronLeft,
} from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';
import { AdminPageShell } from '../common/AdminPageHeader';

interface ProductTypePickerProps {
  onSelectType: (typeKey: string, typeTitle: string) => void;
  onBack: () => void;
}

export const ProductTypePicker: React.FC<ProductTypePickerProps> = ({
  onSelectType,
  onBack,
}) => {
  const { t, locale, theme } = usePrefs();
  const isAr = locale === 'ar';
  const isDark = theme === 'dark';

  const types = [
    {
      id: 'ready-product',
      title: isAr ? 'منتج جاهز' : 'Ready Product',
      desc: isAr
        ? 'منتجات مادية متوفرة في المخزون وجاهزة للشحن إلى العملاء مباشرة.'
        : 'Physical products that are in stock and ready to be shipped to customers.',
      btnText: isAr ? 'إنشاء منتج جاهز' : 'Create Ready Product',
      icon: Box,
      accentColor: '#2563eb',
      bgTone: '#eff6ff',
      borderTone: '#bfdbfe',
    },
    {
      id: 'custom-service',
      title: isAr ? 'خدمة مخصصة' : 'Custom Service',
      desc: isAr
        ? 'خدمات تنفّذ بناءً على طلب العميل، كالتصميم، الطباعة، الاستشارات وما شابه.'
        : 'Services performed based on customer request, such as design, printing, consulting, etc.',
      btnText: isAr ? 'إنشاء خدمة مخصصة' : 'Create Custom Service',
      icon: Wrench,
      accentColor: '#9333ea',
      bgTone: '#faf5ff',
      borderTone: '#e9d5ff',
    },
    {
      id: 'food-beverage',
      title: isAr ? 'أطعمة ومشروبات' : 'Food & Beverages',
      desc: isAr
        ? 'منتجات غذائية أو مشروبات ومأكولات قد تتطلب إعداداً أو تحضيراً خاصاً.'
        : 'Food or beverage products that may require special preparation.',
      btnText: isAr ? 'إنشاء منتج غذائي' : 'Create Food Product',
      icon: UtensilsCrossed,
      accentColor: '#ea580c',
      bgTone: '#fff7ed',
      borderTone: '#fed7aa',
    },
    {
      id: 'digital-product',
      title: isAr ? 'منتج رقمي' : 'Digital Product',
      desc: isAr
        ? 'منتجات رقمية لا تتطلب شحناً، كالملفات والتراخيص والكتب والاشتراكات.'
        : 'Digital products that do not require shipping, such as files, licenses, or subscriptions.',
      btnText: isAr ? 'إنشاء منتج رقمي' : 'Create Digital Product',
      icon: Download,
      accentColor: '#059669',
      bgTone: '#f0fdf4',
      borderTone: '#bbf7d0',
    },
    {
      id: 'gift-card',
      title: isAr ? 'بطاقة هدايا' : 'Gift Card',
      desc: isAr
        ? 'بطاقات شراء مدفوعة مسبقاً يمكن استخدامها كوسيلة دفع في متجرك.'
        : 'Prepaid cards that can be used as a payment method in your store.',
      btnText: isAr ? 'إنشاء بطاقة هدايا' : 'Create Gift Card',
      icon: CreditCard,
      accentColor: '#e11d48',
      bgTone: '#fff1f2',
      borderTone: '#fecdd3',
    },
    {
      id: 'product-bundle',
      title: isAr ? 'حزمة منتجات' : 'Product Bundle',
      desc: isAr
        ? 'مجموعة من المنتجات المتناسقة تباع معاً كمنتج واحد بعرض مميز.'
        : 'A group of products sold together as one product.',
      btnText: isAr ? 'إنشاء حزمة منتجات' : 'Create Bundle Product',
      icon: Boxes,
      accentColor: '#4f46e5',
      bgTone: '#eef2ff',
      borderTone: '#c7d2fe',
    },
    {
      id: 'booking',
      title: isAr ? 'حجوزات ومواعيد' : 'Booking',
      desc: isAr
        ? 'منتجات أو استشارات أو جلسات تتطلب حجز تاريخ ووقت محدد.'
        : 'Products or services that require a specific date and time.',
      btnText: isAr ? 'إنشاء حجز وموعد' : 'Create Booking Product',
      icon: Calendar,
      accentColor: '#0891b2',
      bgTone: '#ecfeff',
      borderTone: '#a5f3fc',
    },
    {
      id: 'template',
      title: isAr ? 'استخدام قالب جاهز' : 'Use Ready Template',
      desc: isAr
        ? 'إنشاء منتج بالاعتماد على قالب مصمم مسبقاً لتسريع الإضافة وتسهيلها.'
        : 'Create a product using a ready template to make the process faster and easier.',
      btnText: isAr ? 'استعراض القوالب' : 'Browse Templates',
      icon: FileSpreadsheet,
      accentColor: '#7c3aed',
      bgTone: '#f5f3ff',
      borderTone: '#ddd6fe',
    },
  ];

  return (
    <AdminPageShell className="pb-16 max-w-[1500px] mx-auto space-y-6">
      {/* ── Breadcrumb & Header ── */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-1 font-semibold" style={{ color: 'var(--muted)' }}>
          <button
            type="button"
            onClick={onBack}
            className="hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('productsTitle')}</span>
          </button>
          <span>/</span>
          <span className="font-bold" style={{ color: 'var(--text)' }}>
            {isAr ? 'إضافة منتج جديد' : 'Add New Product'}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
          {isAr ? 'إضافة منتج جديد' : 'Add New Product'}
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--muted)' }}>
          {isAr
            ? 'اختر نوع المنتج المناسب لبدء إنشاء وتخصيص منتجك'
            : 'Choose the appropriate product type to start creating your product'}
        </p>
      </div>

      {/* ── 8 Product Type Cards Grid (4x2 on large screens) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {types.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-6 rounded-2xl border text-center flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-[#071E26] dark:hover:bg-[#0b2731]"
              style={{
                background: isDark ? undefined : item.bgTone,
                borderColor: isDark ? `color-mix(in srgb, ${item.accentColor} 35%, var(--border))` : item.borderTone,
              }}
            >
              <div>
                <div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                  style={{
                    background: item.accentColor,
                    color: '#ffffff',
                  }}
                >
                  <Icon className="w-7 h-7" strokeWidth={2.2} />
                </div>

                <h3 className="font-black text-base mb-2 text-slate-900 dark:text-white">
                  {item.title}
                </h3>

                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-semibold mb-6">
                  {item.desc}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectType(item.id, item.title)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.98] bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-white"
                style={{
                  borderColor: isDark ? `color-mix(in srgb, ${item.accentColor} 45%, var(--border))` : item.borderTone,
                  color: isDark ? '#ffffff' : item.accentColor,
                }}
              >
                <span>{item.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Guide & Help Callout Banner ── */}
      <div
        className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs bg-blue-50/70 dark:bg-[#071E26] border-blue-200/80 dark:border-slate-800"
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs bg-blue-100 dark:bg-sky-950/60 text-blue-700 dark:text-sky-300 font-bold"
          >
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
              {isAr
                ? 'لست متأكداً أي نوع تختار لمنتجك؟'
                : 'Not sure which product type to choose?'}
            </h4>
            <p className="text-[11px] sm:text-xs mt-0.5 text-slate-700 dark:text-slate-300 font-semibold">
              {isAr
                ? 'يمكنك مراجعة دليلنا السريع للتعرف على ميزات كل نوع وكيفية بيعه بكفاءة.'
                : 'You can check our guide to learn more about each product type and how to use it.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-colors shrink-0"
        >
          <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>{isAr ? 'عرض الدليل' : 'View Guide'}</span>
        </button>
      </div>
    </AdminPageShell>
  );
};
