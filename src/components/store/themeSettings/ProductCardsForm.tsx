import React, { useState } from 'react';
import {
  Save,
  Check,
  RotateCcw,
  ShoppingBag,
  Star,
  Heart,
  Eye,
  ShoppingCart,
  Clock,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type ProductCardsSettings,
} from '../../../themes/settings/themeSettingsStore';

const IMAGE_ANIMATION_LABELS: Record<string, { en: string; ar: string }> = {
  zoom: { en: 'Zoom', ar: 'تكبير' },
  fade: { en: 'Fade', ar: 'تلاشي' },
  slide: { en: 'Slide', ar: 'انزلاق' },
};

const BUTTON_POSITION_LABELS: Record<string, { en: string; ar: string }> = {
  'on-image-hover': { en: 'On Image (Hover)', ar: 'على الصورة (عند التحويم)' },
  'card-bottom': { en: 'Card Bottom', ar: 'أسفل البطاقة' },
};

export const ProductCardsForm: React.FC = () => {
  const { activeStore, currentProducts } = useTenant();
  const { locale, money } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<ProductCardsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.productCards;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [notified, setNotified] = useState(false);

  const toggle = (key: keyof ProductCardsSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof ProductCardsSettings>(key: K, val: ProductCardsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.productCards = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات بطاقات المنتجات' : 'Product cards settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const sampleProd = currentProducts[0] || {
    id: 'sample',
    name: isAr ? 'باقة الملكية المخملية الفاخرة' : 'Luxury Velvet Royal Bouquet',
    price: 189.0,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    category: 'Vases',
  };

  const toggleCls = (on: boolean) =>
    `w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer ${
      on ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
    }`;

  return (
    <form
      onSubmit={handleSave}
      className="rounded-2xl border p-5 sm:p-6 space-y-6"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--card-shadow)',
        color: 'var(--text)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 unity-icon-box">
            <ShoppingBag className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {isAr ? 'إعدادات الثيم · 15' : 'Theme Settings · 15'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                {isAr ? 'احترافي' : 'Pro'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'تصميم بطاقات المنتجات (Product Cards Selia)' : 'Product Cards (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'تصميم بطاقات منتجات تفاعلية فائقة الجمال مع أزرار التحويم والخيارات والعد التنازلي'
                : 'Design beautiful and interactive product cards to boost sales and improve shopping experience'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          15_Product_Cards
        </span>
      </div>

      {/* LIVE INTERACTIVE CARDS PREVIEW ROW */}
      <div className="rounded-2xl border p-6 space-y-6" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black">{isAr ? 'منتجات مميزة' : 'Featured Products'}</h3>
            <p className="text-xs text-muted">
              {isAr ? 'اكتشف أحدث مجموعاتنا من المنتجات الفاخرة' : 'Discover our latest collection of premium products'}
            </p>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={() => toast(isAr ? 'هذه معاينة فقط — سيتم فتح صفحة جميع المنتجات في المتجر' : 'Preview only — this opens the all-products page in your store', 'info')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline"
          >
            {isAr ? 'عرض جميع المنتجات ←' : 'View All Products →'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Standard Hover Quick Actions */}
          <div className="group rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all p-3 flex flex-col justify-between" style={{ borderColor: settings.addBorder ? settings.borderColor : 'transparent' }}>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src={sampleProd.image} alt={sampleProd.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                {isAr ? 'جديد' : 'New'}
              </span>
              <button
                type="button"
                title={isAr ? 'أضف إلى المفضلة' : 'Add to wishlist'}
                aria-label={isAr ? 'أضف إلى المفضلة' : 'Add to wishlist'}
                onClick={() => {
                  const next = !wishlisted;
                  setWishlisted(next);
                  toast(
                    next
                      ? (isAr ? 'تمت الإضافة إلى المفضلة (معاينة)' : 'Added to wishlist (preview)')
                      : (isAr ? 'تمت الإزالة من المفضلة (معاينة)' : 'Removed from wishlist (preview)'),
                    'info',
                  );
                }}
                className={`absolute top-2.5 end-2.5 w-7 h-7 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center hover:text-rose-500 ${
                  wishlisted ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              {/* Hover Quick Action Buttons */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  title={isAr ? 'أضف إلى السلة' : 'Add to cart'}
                  aria-label={isAr ? 'أضف إلى السلة' : 'Add to cart'}
                  onClick={() => toast(isAr ? 'تمت الإضافة إلى السلة (معاينة)' : 'Added to cart (preview)', 'success')}
                  className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={isAr ? 'عرض سريع' : 'Quick view'}
                  aria-label={isAr ? 'عرض سريع' : 'Quick view'}
                  onClick={() => toast(isAr ? 'العرض السريع يفتح نافذة تفاصيل المنتج في المتجر' : 'Quick view opens the product details popup in your store', 'info')}
                  className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold">4.9 (124)</span>
              </div>
              <h4 className="text-xs font-bold truncate">{sampleProd.name}</h4>
              <p className="text-[11px] text-muted">{isAr ? 'نضارة طبيعية عالية' : 'High natural freshness'}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-black text-slate-900 dark:text-white">{money(sampleProd.price)}</span>
                {/* Color swatches */}
                <div className="flex gap-1">
                  <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-amber-200 border border-white shadow-xs" />
                  <span className="w-3 h-3 rounded-full bg-emerald-700 border border-white shadow-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Discount & Fast Add */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs p-3 flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80" alt={isAr ? 'سلة الأوركيد الملكية' : 'Royal Orchid Basket'} className="w-full h-full object-cover" />
              <span className="absolute top-2.5 start-2.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white">
                -30%
              </span>
            </div>

            <div className="pt-3 space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold">4.8 (96)</span>
              </div>
              <h4 className="text-xs font-bold truncate">{isAr ? 'سلة الأوركيد الملكية' : 'Royal Orchid Basket'}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-slate-900 dark:text-white">{money(69.0)}</span>
                <span className="text-[11px] text-muted line-through">{money(99.0)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Countdown Timer Card */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs p-3 space-y-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-[10px] font-black text-white bg-rose-600 p-2 rounded-xl">
              <span>{isAr ? 'عرض خاطف' : 'FLASH SALE'}</span>
              <div className="flex items-center gap-1 font-mono" dir="ltr">
                <Clock className="w-3 h-3" />
                <span>02 : 12 : 45</span>
              </div>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80" alt={isAr ? 'ورود هولندية حمراء فاخرة' : 'Dutch Red Grand Roses'} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="text-xs font-bold truncate">{isAr ? 'ورود هولندية حمراء فاخرة' : 'Dutch Red Grand Roses'}</h4>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{money(75.0)}</span>
            </div>
          </div>

          {/* Card 4: Out of Stock / Notify Me */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs p-3 space-y-3 opacity-90" style={{ borderColor: 'var(--border)' }}>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 filter grayscale">
              <img src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=80" alt={isAr ? 'فاوانيا بيضاء للعرائس' : 'Bridal White Peonies'} className="w-full h-full object-cover" />
              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-black">
                {isAr ? 'نفدت الكمية' : 'Out of Stock'}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold truncate">{isAr ? 'فاوانيا بيضاء للعرائس' : 'Bridal White Peonies'}</h4>
              <button
                type="button"
                onClick={() => {
                  const next = !notified;
                  setNotified(next);
                  toast(
                    next
                      ? (isAr ? 'سيتم إشعار العميل عند توفر المنتج (معاينة)' : 'Customer will be notified when back in stock (preview)')
                      : (isAr ? 'تم إلغاء الإشعار (معاينة)' : 'Notification cancelled (preview)'),
                    'info',
                  );
                }}
                className="w-full py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                {notified ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Bell className="w-3 h-3 text-amber-500" />}
                <span>
                  {notified ? (isAr ? 'سيتم إشعارك' : "You'll be notified") : (isAr ? 'أبلغني عند التوفر' : 'Notify Me')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Layout & Size */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
            {isAr ? '1. التخطيط والحجم' : '1. Layout & Size'}
          </h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'عدد المنتجات في الصف' : 'Products Per Row'}
              </span>
              <select
                value={settings.productsPerRow}
                onChange={(e) => setVal('productsPerRow', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                <option value={3}>{isAr ? '3 منتجات' : '3 Products'}</option>
                <option value={4}>{isAr ? '4 منتجات' : '4 Products'}</option>
                <option value={5}>{isAr ? '5 منتجات' : '5 Products'}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'ارتفاع موحّد للمنتجات' : 'Equal Product Height'}</span>
              <button
                type="button"
                onClick={() => toggle('equalHeight')}
                className={toggleCls(settings.equalHeight)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'بطاقات بزوايا دائرية' : 'Rounded Cards'}</span>
              <button
                type="button"
                onClick={() => toggle('roundedCards')}
                className={toggleCls(settings.roundedCards)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Image & Animation */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
            {isAr ? '2. الصورة والحركة' : '2. Image & Animation'}
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'تغيير الصورة عند التحويم' : 'Change Image on Hover'}</span>
              <button
                type="button"
                onClick={() => toggle('changeImageOnHover')}
                className={toggleCls(settings.changeImageOnHover)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'حركة الصورة' : 'Image Animation'}
              </span>
              <select
                value={settings.imageAnimation}
                onChange={(e) => setVal('imageAnimation', e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {(['zoom', 'fade', 'slide'] as const).map((v) => (
                  <option key={v} value={v}>
                    {isAr ? IMAGE_ANIMATION_LABELS[v].ar : IMAGE_ANIMATION_LABELS[v].en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Product Actions & Buttons */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
            {isAr ? '3. الإجراءات والأزرار' : '3. Actions & Buttons'}
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'إظهار أزرار المنتج' : 'Show Product Buttons'}</span>
              <button
                type="button"
                onClick={() => toggle('showProductButtons')}
                className={toggleCls(settings.showProductButtons)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">
                {isAr ? 'موضع الأزرار' : 'Button Position'}
              </span>
              <select
                value={settings.buttonPosition}
                onChange={(e) => setVal('buttonPosition', e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {(['on-image-hover', 'card-bottom'] as const).map((v) => (
                  <option key={v} value={v}>
                    {isAr ? BUTTON_POSITION_LABELS[v].ar : BUTTON_POSITION_LABELS[v].en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 4. Badges & Information */}
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
            {isAr ? '4. الشارات والتقييم' : '4. Badges & Rating'}
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'إظهار نسبة الخصم' : 'Show Discount Percentage'}</span>
              <button
                type="button"
                onClick={() => toggle('showDiscountPercentage')}
                className={toggleCls(settings.showDiscountPercentage)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{isAr ? 'إظهار تقييم المنتج' : 'Show Product Rating'}</span>
              <button
                type="button"
                onClick={() => toggle('showProductRating')}
                className={toggleCls(settings.showProductRating)}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.productCards);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved cards', 'info');
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isAr ? 'استرجاع' : 'Reset'}</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all hover:opacity-90 unity-btn-primary"
        >
          {savedFlash ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ بطاقات المنتجات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
