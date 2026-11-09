import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';
import type { BlogArticleItem } from '../../../types/blog';
import { usePrefs } from '../../../i18n/PrefsContext';
import { GlobalModal } from '../../common/GlobalModal';
import { RichTextEditor } from '../../common/RichTextEditor';
import { MediaUploadField } from '../../common/MediaUploadField';

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: BlogArticleItem | null;
  onSave: (articleData: Partial<BlogArticleItem> & Record<string, unknown>) => Promise<void>;
  categories: string[];
  onOpenCommerceTools?: (articleId: string) => void;
}

const DEFAULT_CATEGORIES_EN = [
  'Home Decor',
  'Fragrances',
  'Lifestyle',
  'Guides',
  'Wellness',
  'Science',
  'Products',
];

const DEFAULT_CATEGORIES_AR = [
  'ديكور المنزل',
  'عطور',
  'أسلوب حياة',
  'أدلة',
  'عافية',
  'علوم',
  'منتجات',
];

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
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [thumbnail, setThumbnail] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [featured, setFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const categoryOptions = Array.from(
    new Set([
      ...categories.filter(Boolean),
      ...(isAr ? DEFAULT_CATEGORIES_AR : DEFAULT_CATEGORIES_EN),
    ]),
  );

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setExcerpt(article.excerpt || '');
      setContent(article.content || '');
      setCategory(article.category || categoryOptions[0] || '');
      setStatus(article.status || 'draft');
      setThumbnail(article.thumbnail || '');
      setAuthorName(article.author?.name || '');
      setFeatured(Boolean(article.featured));
      setMetaTitle(article.seo?.meta_title || '');
      setMetaDescription(article.seo?.meta_description || '');
      setFocusKeyword(article.seo?.focus_keyword || '');
    } else {
      setTitle('');
      setExcerpt('');
      setContent('');
      setCategory(categories[0] || categoryOptions[0] || '');
      setStatus('draft');
      setThumbnail('');
      setAuthorName('');
      setFeatured(false);
      setMetaTitle('');
      setMetaDescription('');
      setFocusKeyword('');
    }
    setNewCategory('');
    setErrorMsg(null);
  }, [article, categories, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة عنوان المقال' : 'Article title is required.');
      return;
    }

    const selectedCategory = newCategory.trim() ? newCategory.trim() : category;
    if (!selectedCategory) {
      setErrorMsg(isAr ? 'يرجى اختيار التصنيف' : 'Category is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      // API expects flat author_* / meta_* fields (BlogController validate).
      await onSave({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content || '',
        category: selectedCategory,
        status,
        thumbnail: thumbnail.trim(),
        featured,
        author_name: authorName.trim() || undefined,
        author_avatar: article?.author?.avatar || undefined,
        meta_title: metaTitle.trim() || title.trim(),
        meta_description: metaDescription.trim() || excerpt.trim(),
        focus_keyword: focusKeyword.trim(),
        // Keep nested shapes for local optimistic UI consumers.
        author: {
          name: authorName.trim() || (isAr ? 'المسؤول' : 'Admin'),
          avatar: article?.author?.avatar || '',
          role: article?.author?.role || (isAr ? 'طاقم المتجر' : 'Store Staff'),
        },
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
    <GlobalModal
      isOpen={isOpen}
      onClose={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      aria-label={
        article
          ? isAr
            ? 'تعديل المقال'
            : 'Edit Article'
          : isAr
            ? 'إضافة مقال جديد'
            : 'Add New Article'
      }
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-8 max-h-[92vh]">
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
                ? 'قم بإعداد محتوى المقال والصور والتصنيف وبيانات تحسين البحث'
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
                placeholder={
                  isAr
                    ? 'مثال: ٥ طرق لتنسيق ديكور المنزل'
                    : 'e.g. 5 Simple Ways to Create a Cozy Home'
                }
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
                <option value="published">{isAr ? 'منشور' : 'Published'}</option>
                <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
              </select>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isAr ? 'المقتطف القصير' : 'Short Excerpt / Summary'}
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder={
                isAr
                  ? 'مقدمة مختصرة تظهر في قائمة المقالات وبطاقات المشاركة...'
                  : 'Short preview shown on cards and social shares...'
              }
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
          </div>

          {/* Rich Text Body */}
          <RichTextEditor
            label={isAr ? 'محتوى المقال' : 'Article Body Content'}
            value={content}
            onChange={setContent}
            placeholder={
              isAr
                ? 'اكتب المقال مع العناوين والتنسيق والصور والروابط...'
                : 'Write your full article with headings, formatting, images, and links...'
            }
            minHeight={220}
            rows={10}
            isAr={isAr}
            enableHeadings
            enableMedia
            mediaFolder="marketing"
          />

          {/* Category, Author, Featured */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'التصنيف' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder={isAr ? 'أو أضف تصنيفاً جديداً...' : 'Or add a new category...'}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'اسم الكاتب' : 'Author Name'}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder={isAr ? 'مثال: فريق المتجر' : 'e.g. Store Team'}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isAr ? 'تمييز كمقال بارز' : 'Featured Article'}
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

          {/* Featured Image Upload */}
          <MediaUploadField
            label={isAr ? 'الصورة البارزة' : 'Featured Image / Thumbnail'}
            value={thumbnail}
            onChange={(url) => setThumbnail(url)}
            recommendedSize={isAr ? '١٢٠٠ × ٦٣٠ بكسل' : '1200 × 630 px'}
            aspectRatio="banner"
            allowedTypes={['image', 'gif', 'svg']}
            initialFolder="marketing"
            showUrlInput
          />

          {/* SEO Metadata */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>{isAr ? 'إعدادات تحسين محركات البحث' : 'SEO Metadata'}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isAr ? 'عنوان تحسين البحث' : 'Meta Title'}
                </label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={
                    title ||
                    (isAr ? 'عنوان المقال في نتائج البحث' : 'Blog post meta title')
                  }
                  maxLength={70}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 font-mono">
                  {(metaTitle || title).length}/70
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  {isAr ? 'الكلمة المفتاحية المستهدفة' : 'Focus Keyword'}
                </label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder={
                    isAr ? 'مثال: عطور منزلية' : 'e.g. home fragrance'
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {isAr ? 'وصف تحسين البحث' : 'Meta Description'}
              </label>
              <textarea
                rows={2}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder={
                  isAr
                    ? 'مقتطف يظهر في نتائج محركات البحث...'
                    : 'Search result snippet...'
                }
                maxLength={160}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 font-mono">
                {(metaDescription || excerpt).length}/160
              </p>
            </div>
          </div>

          {/* Quick link to Article Commerce Tools */}
          {article && onOpenCommerceTools && (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-900/60 flex items-center justify-between gap-3">
              <div className="text-xs text-teal-800 dark:text-teal-200">
                <span className="font-bold">
                  {isAr ? 'أدوات التجارة للمقال:' : 'Article Commerce Tools:'}
                </span>{' '}
                {isAr
                  ? 'يمكنك ربط المنتجات والكوبونات والمقارنة لهذا المقال.'
                  : 'Add interactive product cards, bundles, quiz, and coupons.'}
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCommerceTools(article.id);
                }}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {isAr ? 'تخصيص أدوات التجارة ←' : 'Customize Tools →'}
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
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSubmitting
                ? isAr
                  ? 'جاري الحفظ...'
                  : 'Saving...'
                : isAr
                  ? 'حفظ المقال'
                  : 'Save Article'}
            </span>
          </button>
        </div>
      </div>
    </GlobalModal>
  );
};
