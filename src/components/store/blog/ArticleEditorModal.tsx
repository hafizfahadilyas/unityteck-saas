import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Sparkles, AlertCircle, Check } from 'lucide-react';
import type { BlogArticleItem } from '../../../types/blog';
import { usePrefs } from '../../../i18n/PrefsContext';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: BlogArticleItem | null;
  onSave: (articleData: Partial<BlogArticleItem>) => Promise<void>;
  categories: string[];
  onOpenCommerceTools?: (articleId: string) => void;
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  article,
  onSave,
  categories,
  onOpenCommerceTools,
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Home Decor');
  const [newCategory, setNewCategory] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [thumbnail, setThumbnail] = useState('');
  const [authorName, setAuthorName] = useState('Sarah Ahmed');
  const [featured, setFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setCategory(article.category || 'Home Decor');
      setStatus(article.status || 'published');
      setThumbnail(article.thumbnail || '');
      setAuthorName(article.author?.name || 'Sarah Ahmed');
      setFeatured(Boolean(article.featured));
      setMetaTitle(article.seo?.meta_title || article.title || '');
      setMetaDescription(article.seo?.meta_description || article.excerpt || '');
      setFocusKeyword(article.seo?.focus_keyword || '');
    } else {
      setTitle('');
      setExcerpt('');
      setContent('');
      setCategory(categories[0] || 'Home Decor');
      setStatus('published');
      setThumbnail('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80');
      setAuthorName('Sarah Ahmed');
      setFeatured(false);
      setMetaTitle('');
      setMetaDescription('');
      setFocusKeyword('');
    }
    setErrorMsg(null);
  }, [article, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة عنوان المقال' : 'Article title is required.');
      return;
    }

    const selectedCategory = newCategory.trim() ? newCategory.trim() : category;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        category: selectedCategory,
        status,
        thumbnail: thumbnail.trim() || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
        author: {
          name: authorName.trim() || 'Admin',
          avatar: article?.author?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          role: article?.author?.role || 'Staff Editor',
        },
        featured,
        seo: {
          meta_title: metaTitle.trim() || title.trim(),
          meta_description: metaDescription.trim() || excerpt.trim(),
          focus_keyword: focusKeyword.trim(),
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'فشل حفظ المقال' : 'Failed to save article.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8 max-h-[90vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {article
                ? isAr
                  ? 'تعديل المقال'
                  : 'Edit Article'
                : isAr
                ? 'إضافة مقال جديد'
                : 'Add New Article'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'قم بملء تفاصيل المقال، الكلمات المفتاحية وبيانات السيو'
                : 'Configure article content, imagery, category, and SEO metadata.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-sidebar-scroll">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title & Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'عنوان المقال *' : 'Article Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isAr ? 'مثال: 5 طرق لتنسيق ديكور المنزل' : 'e.g. 5 Simple Ways to Create a Cozy Home'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'حالة النشر' : 'Publish Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="published">{isAr ? 'منشور (Published)' : 'Published'}</option>
                <option value="draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'المقتطف القصير (Excerpt)' : 'Short Excerpt / Summary'}
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={isAr ? 'مقدمة مختصرة تظهر في قائمة المقالات وبطاقات المشاركة...' : 'Short preview shown on cards and social shares...'}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Content Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'محتوى المقال (Markdown / Text)' : 'Article Body Content'}
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAr ? 'اكتب محتوى المقال هنا بالتفصيل...' : 'Write your full article content here...'}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Category, Author, Thumbnail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'التصنيف (Category)' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Home Decor">Home Decor</option>
                <option value="Fragrances">Fragrances</option>
                <option value="Lifestyle">Lifestyle</option>
                <option value="Guides">Guides</option>
                <option value="Wellness">Wellness</option>
                <option value="Science">Science</option>
                <option value="Products">Products</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'اسم الكاتب' : 'Author Name'}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>{isAr ? 'تمييز كمقال بارز' : 'Featured Article'}</span>
              </label>
              <div className="flex items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {isAr ? 'عرض في بطاقة المقال المميز' : 'Show as Featured Article'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Thumbnail URL with Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'رابط الصورة البارزة (Thumbnail URL)' : 'Featured Image / Thumbnail URL'}
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              {thumbnail && (
                <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* SEO Metadata Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>{isAr ? 'إعدادات تحسين محركات البحث (SEO)' : 'SEO Metadata'}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isAr ? 'عنوان السيو (Meta Title)' : 'Meta Title'}
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || 'Blog post meta title'}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isAr ? 'الكلمة المفتاحية المستهدفة' : 'Focus Keyword'}
                </label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g. home fragrance"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {isAr ? 'وصف السيو (Meta Description)' : 'Meta Description'}
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Search result snippet..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick link to Article Commerce Tools */}
          {article && onOpenCommerceTools && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900/60 flex items-center justify-between">
              <div className="text-xs text-teal-800 dark:text-teal-200">
                <span className="font-bold">{isAr ? 'أدوات التجارة للمقال:' : 'Article Commerce Tools:'}</span>{' '}
                {isAr ? 'يمكنك ربط المنتجات، الكوبونات، المقارنة، والمسابقات لهذا المقال.' : 'Add interactive product cards, bundles, quiz, and coupons.'}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCommerceTools(article.id);
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'تخصيص أدوات التجارة →' : 'Customize Tools →'}
              </button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ المقال' : 'Save Article'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
