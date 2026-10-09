import React, { useState } from 'react';
import { Save, Check, RotateCcw, BookOpen, Clock, Calendar, ArrowRight, Eye } from 'lucide-react';
import { useTenant } from '../../../context/TenantContext';
import { usePrefs } from '../../../i18n/PrefsContext';
import { useToast } from '../../common/ToastProvider';
import {
  readAllThemeSettings,
  writeAllThemeSettings,
  type BlogSettings,
} from '../../../themes/settings/themeSettingsStore';

export const BlogForm: React.FC = () => {
  const { activeStore } = useTenant();
  const { locale } = usePrefs();
  const { toast } = useToast();
  const isAr = locale === 'ar';

  const [settings, setSettings] = useState<BlogSettings>(() => {
    const full = readAllThemeSettings(activeStore.id, activeStore);
    return full.blog;
  });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setVal = <K extends keyof BlogSettings>(key: K, val: BlogSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const full = readAllThemeSettings(activeStore.id, activeStore);
    full.blog = settings;
    writeAllThemeSettings(activeStore.id, full);

    setTimeout(() => {
      setSaving(false);
      setSavedFlash(true);
      toast(isAr ? 'تم حفظ إعدادات مقالات المدونة' : 'Blog settings saved', 'success');
      setTimeout(() => setSavedFlash(false), 2500);
    }, 300);
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
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Theme Settings · 12
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {isAr ? 'مدونة المتجر والمقالات (Blog Selia)' : 'Blog (Selia)'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {isAr
                ? 'عرض المقالات، نصائح العناية، والأخبار التفاعلية لجذب العملاء ومحركات البحث'
                : 'Display the latest blog articles to keep your customers informed and engaged'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg border self-start"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
          12_Blog
        </span>
      </div>

      {/* LIVE PREVIEW OF BLOG SECTION */}
      <div className="rounded-2xl border p-6 space-y-6" style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">OUR BLOG</span>
            <h3 className="text-2xl font-black">{settings.title}</h3>
            <p className="text-xs text-muted">{settings.subtitle}</p>
          </div>
          {settings.showViewAll && (
            <button type="button" className="px-4 py-2 rounded-xl border border-slate-300 bg-white dark:bg-slate-800 text-xs font-bold self-start cursor-pointer hover:bg-slate-50 transition-colors shadow-xs">
              {settings.buttonText}
            </button>
          )}
        </div>

        {/* Featured + 2 Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Big Featured Card */}
          {settings.articles[0] && (
            <div className="lg:col-span-2 rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-md flex flex-col justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="aspect-16/9 sm:aspect-21/10 overflow-hidden relative">
                <img src={settings.articles[0].image} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-3 start-3 px-3 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-sm">
                  {settings.articles[0].category}
                </span>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-4 text-[11px] text-muted">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {settings.articles[0].date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {settings.articles[0].readTime}</span>
                </div>
                <h4 className="text-lg font-black">{settings.articles[0].title}</h4>
                <p className="text-xs text-muted leading-relaxed">{settings.articles[0].excerpt}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 cursor-pointer hover:underline">
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2 Smaller Cards Side */}
          <div className="space-y-4">
            {settings.articles.slice(1, 3).map((art) => (
              <div key={art.id} className="rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex gap-3">
                  <img src={art.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {art.category}
                    </span>
                    <h5 className="text-xs font-bold leading-snug line-clamp-2">{art.title}</h5>
                    <span className="text-[10px] text-muted block">{art.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Blog General Titles</h3>
          <div className="space-y-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Title</span>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setVal('title', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Subtitle</span>
              <input
                type="text"
                value={settings.subtitle}
                onChange={(e) => setVal('subtitle', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-bold uppercase text-emerald-600">Layout & Display Style</h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Display Style</span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['featured-cards', 'grid', 'carousel'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVal('displayStyle', s)}
                    className={`py-1.5 rounded-lg border font-bold capitalize cursor-pointer ${
                      settings.displayStyle === s ? 'bg-emerald-600 text-white border-emerald-600' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted block mb-1">Button Text</span>
              <input
                type="text"
                value={settings.buttonText}
                onChange={(e) => setVal('buttonText', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Article Manager (Insert New Blog Post) */}
      <div className="rounded-xl border p-4 sm:p-5 space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {isAr ? 'إدارة مقالات المدونة (إضافة وتعديل المقالات)' : 'Manage & Insert Blog Posts'}
            </h3>
            <p className="text-[11px] text-muted">
              {isAr
                ? 'أضف مقالات جديدة عن العناية بالأزهار وهدايا الحرم، وانشرها فوراً على المتجر'
                : 'Publish new articles and guides directly to your storefront'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const newArticle = {
                id: `art-${Date.now()}`,
                image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
                title: isAr ? 'طرق الحفاظ على ورود الجوري في أجواء مكة' : 'How to Preserve Rose Bouquets in Makkah Climate',
                excerpt: isAr
                  ? 'خطوات عملية ميسرة تبقي باقات الورد نضرة وفواحة لأكثر من أسبوعين.'
                  : 'Actionable tips from our Makkah floral florists to keep your blooms fresh for over 14 days.',
                category: isAr ? 'العناية بالورد' : 'Floral Care',
                date: '2026-10-03',
                readTime: isAr ? '3 دقائق قراءة' : '3 min read',
              };
              setVal('articles', [newArticle, ...settings.articles]);
              toast(isAr ? 'تمت إضافة مقال جديد بنجاح! يمكنك تعديل تفاصيله أدناه.' : 'New blog post added! You can edit details below.', 'success');
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs self-start"
          >
            <span>+</span>
            <span>{isAr ? 'إضافة مقال جديد (Insert Post)' : 'Add New Blog Post'}</span>
          </button>
        </div>

        {/* Articles List */}
        <div className="space-y-3">
          {settings.articles.map((art, idx) => (
            <div
              key={art.id || idx}
              className="p-4 rounded-xl border space-y-3 text-xs"
              style={{ background: 'var(--hover-bg)', borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                    {idx + 1}
                  </span>
                  <span>{isAr ? `مقال: ${art.title}` : `Article #${idx + 1}`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = settings.articles.filter((_, i) => i !== idx);
                    setVal('articles', filtered);
                  }}
                  className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer self-start"
                >
                  {isAr ? 'حذف المقال' : 'Delete Article'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-muted block">{isAr ? 'عنوان المقال' : 'Article Title'}</span>
                  <input
                    type="text"
                    value={art.title}
                    onChange={(e) => {
                      const updated = [...settings.articles];
                      updated[idx].title = e.target.value;
                      setVal('articles', updated);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none font-bold"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted block">{isAr ? 'التصنيف' : 'Category'}</span>
                  <input
                    type="text"
                    value={art.category}
                    onChange={(e) => {
                      const updated = [...settings.articles];
                      updated[idx].category = e.target.value;
                      setVal('articles', updated);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-muted block">{isAr ? 'الموجز / الملخص' : 'Excerpt'}</span>
                  <textarea
                    rows={2}
                    value={art.excerpt}
                    onChange={(e) => {
                      const updated = [...settings.articles];
                      updated[idx].excerpt = e.target.value;
                      setVal('articles', updated);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none resize-none"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted block">{isAr ? 'رابط الصورة' : 'Image URL'}</span>
                  <input
                    type="text"
                    value={art.image}
                    onChange={(e) => {
                      const updated = [...settings.articles];
                      updated[idx].image = e.target.value;
                      setVal('articles', updated);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none font-mono"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => {
            const full = readAllThemeSettings(activeStore.id, activeStore);
            setSettings(full.blog);
            toast(isAr ? 'تم استرجاع الإعدادات' : 'Reset to saved blog', 'info');
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
          <span>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : savedFlash ? (isAr ? 'تم الحفظ!' : 'Saved!') : (isAr ? 'حفظ المدونة' : 'Save Changes')}</span>
        </button>
      </div>
    </form>
  );
};
