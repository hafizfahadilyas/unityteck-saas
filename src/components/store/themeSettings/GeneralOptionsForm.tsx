import React, { useState } from 'react';
import { Save, Check, RotateCcw, Sliders, Upload, CheckCircle2, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, Layers } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type GeneralOptionsSettings,
} from '../../../themes/settings/themeSettingsStore';

export const GeneralOptionsForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<GeneralOptionsSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.general;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const toggle = (key: keyof GeneralOptionsSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setVal = <K extends keyof GeneralOptionsSettings>(key: K, val: GeneralOptionsSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.general = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ خيارات تصميم الثيم بنجاح' : 'Theme design options saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
  };

  const handleReset = () => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    setSettings(full.general);
    toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved settings', 'info');
  };

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
            <Sliders className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 02
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'خيارات تصميم الثيم — العامة' : 'Theme Design Options'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'خيارات عامة للصفحة الرئيسية، الرأس، التذييل، والتنقل'
                : 'General options for homepage, header, footer, and navigation'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          02_General_Options
        </span>
      </div>

      {/* Card 1: Main Toggles */}
      <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          {isAr ? 'مفاتيح التفعيل العامة' : 'Core Feature Switches'}
        </h3>

        <div className="space-y-3.5 divide-y" style={{ borderColor: 'var(--border)' }}>
          {/* Arabic Numerals */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-bold block">{isAr ? 'الأرقام العربية' : 'Arabic Numerals'}</span>
              <span className="text-[11px] text-muted">
                {isAr ? 'عرض الأرقام بالصيغة العربية في واجهات المتجر' : 'Use Arabic numerals in storefront UI'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('arabicNumerals')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.arabicNumerals ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Content Protection */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold block">{isAr ? 'حماية المحتوى' : 'Content Protection'}</span>
              <span className="text-[11px] text-muted">
                {isAr ? 'منع النسخ وحفظ الصور غير المصرح به' : 'Prevent right-click image saving and unauthorized copy'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('contentProtection')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.contentProtection ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold block">{isAr ? 'شريط مسار التصفح (Breadcrumbs)' : 'Breadcrumb Navigation'}</span>
              <span className="text-[11px] text-muted">
                {isAr ? 'عرض مسار الصفحة الحالية أعلى المحتوى' : 'Show hierarchical page trail on product & category pages'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('breadcrumbNav')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.breadcrumbNav ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Equal Product Heights */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold block">{isAr ? 'توحيد ارتفاع بطاقات المنتجات' : 'Equal Product Heights'}</span>
              <span className="text-[11px] text-muted">
                {isAr ? 'توحيد مقاسات الصور وعناوين البطاقات تلقائياً' : 'Align image heights and product titles in equal grid rows'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('equalProductHeights')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.equalProductHeights ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>

          {/* Homepage Animations */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-xs font-bold block">{isAr ? 'الحركات التفاعلية للواجهة' : 'Homepage Animations'}</span>
              <span className="text-[11px] text-muted">
                {isAr ? 'تأثيرات حركة تفاعلية وسلسة عند التمرير والظهور' : 'Enable smooth scroll entrance and motion effects'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => toggle('homepageAnimations')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                settings.homepageAnimations ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Alternative Logo */}
      <div className="rounded-xl border p-4 space-y-2" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <label className="text-xs font-bold block">{isAr ? 'الشعار البديل (Alternative Logo)' : 'Alternative Logo'}</label>
        <p className="text-[11px] text-muted">
          {isAr ? 'يستخدم على الخلفيات الشفافة أو الداكنة' : 'Used on transparent navigation or dark header backgrounds'}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={settings.alternativeLogoUrl}
            onChange={(e) => setVal('alternativeLogoUrl', e.target.value)}
            placeholder="https://.../alt-logo.png"
            className="flex-1 px-3 py-2 text-xs rounded-xl border outline-none"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
          />
          <button
            type="button"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
            style={{ borderColor: 'var(--border)' }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع ملف' : 'Upload'}</span>
          </button>
        </div>
      </div>

      {/* Card 3: Section Title Design */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <label className="text-xs font-bold block">{isAr ? 'تصميم عناوين الأقسام' : 'Section Title Design'}</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="radio"
              name="titleDesign"
              checked={settings.sectionTitleDesign === 'classic'}
              onChange={() => setVal('sectionTitleDesign', 'classic')}
              className="accent-emerald-600"
            />
            <span>{isAr ? 'كلاسيكي (Classic)' : 'Classic'}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
            <input
              type="radio"
              name="titleDesign"
              checked={settings.sectionTitleDesign === 'modern'}
              onChange={() => setVal('sectionTitleDesign', 'modern')}
              className="accent-emerald-600"
            />
            <span>{isAr ? 'عصري وحديث (Modern)' : 'Modern'}</span>
          </label>
        </div>
      </div>

      {/* Card 4: Container vs Full-Width & Mobile Layout */}
      <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          {isAr ? 'تخطيط العرض وعرض الجوال' : 'Container Width & Mobile Layout'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Container Width vs Full Width */}
          <div className="space-y-2">
            <span className="text-xs font-bold block">
              {isAr ? 'عرض الأقسام والصفحة الرئيسية' : 'Category & Section Width'}
            </span>
            <p className="text-[11px] text-muted">
              {isAr ? 'اختر بين عرض مقيد بالحاوية أو بعرض الشاشة الكامل' : 'Choose bounded container width or full-bleed screen width'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVal('categoryLayoutWidth', 'container')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  (settings.categoryLayoutWidth || 'container') === 'container'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isAr ? 'حاوية محددة (Container)' : 'Container (Standard)'}
              </button>
              <button
                type="button"
                onClick={() => setVal('categoryLayoutWidth', 'fullwidth')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  settings.categoryLayoutWidth === 'fullwidth'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isAr ? 'عرض كامل (Full Width)' : 'Full Width (Edge-to-Edge)'}
              </button>
            </div>
          </div>

          {/* Mobile Display Mode */}
          <div className="space-y-2">
            <span className="text-xs font-bold block">
              {isAr ? 'طريقة عرض المنتجات بالجوال (Mobile Display)' : 'Mobile Products & Grid Display'}
            </span>
            <p className="text-[11px] text-muted">
              {isAr ? 'عرض منتجين في الصف أو منتج واحد مع كاروسيل سلايدر' : 'Display 2 items per row or 1 item full / carousel'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setVal('mobileDisplayMode', '2-columns')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  (settings.mobileDisplayMode || '2-columns') === '2-columns'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isAr ? 'منتجان في الصف (2 Col)' : '2 Items Per Row'}
              </button>
              <button
                type="button"
                onClick={() => setVal('mobileDisplayMode', '1-column')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  settings.mobileDisplayMode === '1-column'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isAr ? 'منتج واحد / كاروسيل (1 Col)' : '1 Item Full / Carousel'}
              </button>
            </div>
          </div>
        </div>

        {/* Auto Sync Season Theme Colors */}
        <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div>
            <span className="text-xs font-bold block">
              {isAr ? 'مزامنة ألوان الثيم مع مناسبة الواجهة تلقائياً' : 'Auto-sync Theme Colors with Active Season'}
            </span>
            <span className="text-[11px] text-muted">
              {isAr
                ? 'تغيير ألوان الهيدر والفوتر والأزرار تلقائياً (أخضر للعيد، كحلي لرمضان، أحمر للفالنتاين)'
                : 'Auto-apply matching emerald for Eid, amber/indigo for Ramadan, and crimson for Valentine'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggle('autoSeasonThemeColors')}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              settings.autoSeasonThemeColors !== false ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
          </button>
        </div>
      </div>

      {/* Card 5: Navigation Menu & Custom Pages Manager */}
      <div className="rounded-xl border p-4 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {isAr ? 'إدارة القوائم وشريط التنقل (Navbar & Mega Menu)' : 'Navbar & Menu Navigation Manager'}
            </h3>
            <p className="text-[11px] text-muted mt-0.5">
              {isAr ? 'تخصيص روابط شريط التنقل العلوي، ترتيبها بالسحب والأزرار، وتفعيل الميجا منيو' : 'Customize top navigation links, reorder with buttons, and toggle Mega Menus'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const newId = `menu-${Date.now().toString().slice(-4)}`;
              const current = settings.customNavigationMenu || [];
              setVal('customNavigationMenu', [
                ...current,
                {
                  id: newId,
                  labelEn: 'New Page',
                  labelAr: 'صفحة جديدة',
                  url: 'shop',
                  type: 'page',
                  active: true,
                  isMegaMenu: false,
                },
              ]);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <span>+</span>
            <span>{isAr ? 'إضافة عنصر للقائمة' : 'Add Menu Item'}</span>
          </button>
        </div>

        {/* Menu Items Ledger */}
        <div className="space-y-2.5">
          {(settings.customNavigationMenu && settings.customNavigationMenu.length > 0 ? settings.customNavigationMenu : [
            { id: 'm1', labelEn: 'Home', labelAr: 'الرئيسية', url: 'home', type: 'page' as const, active: true, isMegaMenu: false },
            { id: 'm2', labelEn: 'Shop', labelAr: 'المتجر', url: 'shop', type: 'page' as const, active: true, isMegaMenu: true },
            { id: 'm3', labelEn: 'Track Order', labelAr: 'تتبع الطلب', url: 'track-order', type: 'page' as const, active: true, isMegaMenu: false },
            { id: 'm4', labelEn: 'Blog', labelAr: 'المدونة', url: 'blog', type: 'page' as const, active: true, isMegaMenu: false },
            { id: 'm5', labelEn: 'About Us', labelAr: 'من نحن', url: 'about', type: 'page' as const, active: true, isMegaMenu: false },
            { id: 'm6', labelEn: 'Contact', labelAr: 'تواصل معنا', url: 'contact', type: 'page' as const, active: true, isMegaMenu: false },
          ]).map((item, idx, fullList) => (
            <div
              key={item.id || idx}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                item.active !== false ? 'opacity-100' : 'opacity-60 bg-slate-50/50'
              }`}
              style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 flex-1">
                {/* Reorder Up/Down Buttons */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const list = [...fullList];
                      const temp = list[idx];
                      list[idx] = list[idx - 1];
                      list[idx - 1] = temp;
                      setVal('customNavigationMenu', list);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer"
                    title={isAr ? 'تحريك للأعلى' : 'Move Up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === fullList.length - 1}
                    onClick={() => {
                      const list = [...fullList];
                      const temp = list[idx];
                      list[idx] = list[idx + 1];
                      list[idx + 1] = temp;
                      setVal('customNavigationMenu', list);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 disabled:opacity-20 cursor-pointer"
                    title={isAr ? 'تحريك للأسفل' : 'Move Down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {idx + 1}
                </span>

                <input
                  type="text"
                  value={item.labelAr}
                  onChange={(e) => {
                    const list = [...fullList];
                    list[idx] = { ...list[idx], labelAr: e.target.value };
                    setVal('customNavigationMenu', list);
                  }}
                  placeholder="العنوان بالعربية"
                  className="px-2.5 py-1 rounded-lg border text-xs flex-1 outline-none font-bold"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                />
                <input
                  type="text"
                  value={item.labelEn}
                  onChange={(e) => {
                    const list = [...fullList];
                    list[idx] = { ...list[idx], labelEn: e.target.value };
                    setVal('customNavigationMenu', list);
                  }}
                  placeholder="English Title"
                  className="px-2.5 py-1 rounded-lg border text-xs flex-1 outline-none"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* Select target page */}
                <select
                  value={item.url}
                  onChange={(e) => {
                    const list = [...fullList];
                    list[idx] = { ...list[idx], url: e.target.value };
                    setVal('customNavigationMenu', list);
                  }}
                  className="px-2 py-1 rounded-lg border text-xs outline-none cursor-pointer"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <option value="home">Home (الرئيسية)</option>
                  <option value="shop">Shop / Catalog (المتجر)</option>
                  <option value="categories">Categories (الأقسام)</option>
                  <option value="product">Single Product (صفحة منتج)</option>
                  <option value="cart">Cart (السلة)</option>
                  <option value="checkout">Checkout (إتمام الطلب)</option>
                  <option value="thankyou">Thank You (تأكيد الطلب)</option>
                  <option value="account">Account (حسابي)</option>
                  <option value="track-order">Track Order (تتبع الطلب)</option>
                  <option value="blog">Blog (المدونة)</option>
                  <option value="about">About (من نحن)</option>
                  <option value="contact">Contact (تواصل)</option>
                  <option value="location">Location (الفروع)</option>
                  <option value="privacy">Privacy (الخصوصية)</option>
                  <option value="return">Returns (الإرجاع)</option>
                  <option value="custom-page">Custom Page (صفحة مخصصة)</option>
                </select>

                {/* Mega Menu Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const list = [...fullList];
                    list[idx] = { ...list[idx], isMegaMenu: !list[idx].isMegaMenu };
                    setVal('customNavigationMenu', list);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                    item.isMegaMenu
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                  title={isAr ? 'تفعيل ميجا منيو شامل للتصنيفات' : 'Toggle Mega Menu'}
                >
                  {item.isMegaMenu ? 'Mega Menu ✓' : 'Mega Menu'}
                </button>

                {/* Toggle Active / Visible */}
                <button
                  type="button"
                  onClick={() => {
                    const list = [...fullList];
                    list[idx] = { ...list[idx], active: item.active === false ? true : false };
                    setVal('customNavigationMenu', list);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={item.active !== false ? 'Active' : 'Hidden'}
                >
                  {item.active !== false ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => {
                    const list = fullList.filter((_, i) => i !== idx);
                    setVal('customNavigationMenu', list);
                  }}
                  className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold cursor-pointer"
                  title="Delete item"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 6: Header & Footer layout options */}
      <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <label className="text-xs font-bold block">{isAr ? 'تنسيق رأس وتذييل المتجر' : 'Header & Footer layout options'}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase text-muted block mb-1">
              {isAr ? 'تخطيط الهيدر (Header Layout)' : 'Header Layout'}
            </span>
            <select
              value={settings.headerLayout}
              onChange={(e) => setVal('headerLayout', e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
            >
              <option value="standard">Standard (Logo Left, Search Center, Icons Right)</option>
              <option value="centered">Centered (Logo Top Center, Navigation Below)</option>
              <option value="minimal">Minimalist (Compact Bar with Drawer)</option>
              <option value="split">Split Navigation (Links on Both Sides of Logo)</option>
            </select>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted block mb-1">
              {isAr ? 'تخطيط الفوتر (Footer Layout)' : 'Footer Layout'}
            </span>
            <select
              value={settings.footerLayout}
              onChange={(e) => setVal('footerLayout', e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border outline-none cursor-pointer"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
            >
              <option value="standard">Standard 4-Column with Saudi Trust Badges</option>
              <option value="columns">Wide 5-Column Mega Footer</option>
              <option value="saudi-minimal">Compact Saudi Vision 2030 Minimalist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={handleReset}
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
