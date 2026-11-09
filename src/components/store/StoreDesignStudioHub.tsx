import React from 'react';
import { ImageIcon, BadgeCheck, ShoppingBag, Paintbrush, ArrowLeft } from 'lucide-react';
import { usePrefs } from '../../i18n/PrefsContext';

type Props = {
  onNavigateTab: (tab: string) => void;
};

export const StoreDesignStudioHub: React.FC<Props> = ({ onNavigateTab }) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const cards = [
    {
      id: 'canva-banner',
      icon: ImageIcon,
      titleEn: 'Banner Design Editor',
      titleAr: 'محرر تصميم البانر',
      descEn: 'Hero banners, promos, and store headers — 1600×600 workspace.',
      descAr: 'بانرات رئيسية وعروض — مساحة عمل ١٦٠٠×٦٠٠.',
    },
    {
      id: 'canva-logo',
      icon: BadgeCheck,
      titleEn: 'Logo Design Editor',
      titleAr: 'محرر تصميم الشعار',
      descEn: 'Text + icon logos with transparent export.',
      descAr: 'شعار نصي وأيقونة مع تصدير خلفية شفافة.',
    },
    {
      id: 'canva-product-card',
      icon: ShoppingBag,
      titleEn: 'Product Card Editor',
      titleAr: 'محرر بطاقة المنتج',
      descEn: 'Price, discount badge, and product photo layout.',
      descAr: 'السعر وشارة الخصم وصورة المنتج.',
    },
    {
      id: 'canva-studio',
      icon: Paintbrush,
      titleEn: 'Full Design Studio',
      titleAr: 'استوديو التصميم الكامل',
      descEn: 'All categories, social sizes, and imports.',
      descAr: 'كل الفئات ومقاسات السوشال والاستيراد.',
    },
  ] as const;

  return (
    <div className="u-page p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full min-w-0 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          <Paintbrush className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--text)' }}>
            {isAr ? 'أدوات التصميم' : 'Design Tools'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'ثلاث شاشات تحرير مستقلة مع حفظ على قاعدة بيانات المتجر.'
              : 'Three dedicated editors with saves to your store database.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigateTab(card.id)}
              className="text-start rounded-2xl border p-5 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[var(--surface)] min-w-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {isAr ? card.titleAr : card.titleEn}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {isAr ? card.descAr : card.descEn}
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold" style={{ color: 'var(--accent)' }}>
                {isAr ? 'فتح المحرر' : 'Open editor'}
                <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
