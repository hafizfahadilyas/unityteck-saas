import React, { useState } from 'react';
import { X, Smartphone, Monitor, Calendar, User, Eye, MessageSquare, ArrowLeft, Share2, Tag } from 'lucide-react';
import type { BlogArticleItem, BlogPostSettings, BlogSeoSettings } from '../../../types/blog';
import { usePrefs } from '../../../i18n/PrefsContext';

interface ArticlePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: BlogArticleItem | null;
  allArticles?: BlogArticleItem[];
  postSettings?: BlogPostSettings;
  seoSettings?: BlogSeoSettings;
  mode?: 'article' | 'blog_list';
}

export const ArticlePreviewModal: React.FC<ArticlePreviewModalProps> = ({
  isOpen,
  onClose,
  article,
  allArticles = [],
  postSettings,
  seoSettings,
  mode = 'article',
}) => {
  const { locale } = usePrefs();
  const isAr = locale === 'ar';
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-6 max-h-[92vh] transition-all duration-300 ${
          deviceMode === 'mobile' ? 'w-[420px]' : 'w-full max-w-4xl'
        }`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {mode === 'blog_list'
                ? isAr
                  ? 'معاينة صفحة المدونة (Live Blog)'
                  : 'Live Blog Preview'
                : isAr
                ? 'معاينة المقال للعملاء'
                : 'Customer Article Preview'}
            </span>
            <span className="text-[10px] bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded-full font-semibold border border-teal-200 dark:border-teal-800">
              {isAr ? 'وضع المعاينة الآمنة' : 'Preview Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  deviceMode === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  deviceMode === 'mobile'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Mockup Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 dark:bg-slate-950 custom-sidebar-scroll">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs max-w-3xl mx-auto space-y-6">
            {mode === 'blog_list' ? (
              /* Blog Listing Preview */
              <div className="space-y-6">
                <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {seoSettings?.meta_title || (isAr ? 'مدونة المتجر' : 'Store Blog')}
                  </h1>
                  <p className="text-sm text-slate-500 max-w-xl mx-auto">
                    {seoSettings?.meta_description ||
                      (isAr
                        ? 'أحدث المقالات، النصائح والأفكار الملهمة'
                        : 'Explore inspiring guides, product insights, and lifestyle tips.')}
                  </p>
                </div>

                {/* Articles Grid according to layout */}
                <div
                  className={`grid gap-6 ${
                    postSettings?.layout === 'Grid 3-Column'
                      ? 'grid-cols-1 md:grid-cols-3'
                      : postSettings?.layout === 'Grid 2-Column'
                      ? 'grid-cols-1 md:grid-cols-2'
                      : 'grid-cols-1'
                  }`}
                >
                  {allArticles.map((art) => (
                    <article
                      key={art.id}
                      className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow bg-white dark:bg-slate-900 flex flex-col"
                    >
                      <div className="aspect-16/9 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <img
                          src={art.thumbnail}
                          alt={art.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <span className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-xs font-semibold px-2.5 py-1 rounded-full text-slate-800 dark:text-slate-200 shadow-xs">
                          {art.category}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug hover:text-teal-600 transition-colors">
                            {art.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={art.author?.avatar}
                              alt={art.author?.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span>{art.author?.name}</span>
                          </div>
                          <span>{art.published_at.split(' ')[0]}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : article ? (
              /* Single Article Preview */
              <div className="space-y-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Home</span>
                  <span>/</span>
                  <span>Blog</span>
                  <span>/</span>
                  <span className="text-teal-600 dark:text-teal-400 font-semibold">{article.category}</span>
                </div>

                {/* Hero Header */}
                <div className="space-y-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    {article.category}
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                    {article.title}
                  </h1>

                  {/* Author meta */}
                  <div className="flex items-center justify-between border-y border-slate-100 dark:border-slate-800 py-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={article.author?.avatar}
                        alt={article.author?.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{article.author?.name}</div>
                        <div className="text-[11px] text-slate-400">{article.author?.role || 'Staff Editor'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {article.published_at.split(' ')[0]}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {article.views.toLocaleString()} views
                      </span>
                    </div>
                  </div>
                </div>

                {/* Featured Thumbnail */}
                <div className="aspect-16/9 w-full rounded-2xl overflow-hidden shadow-sm">
                  <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                </div>

                {/* Excerpt Lead */}
                {article.excerpt && (
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed border-s-4 border-teal-500 ps-4 italic">
                    {article.excerpt}
                  </p>
                )}

                {/* Body Content */}
                <div className="prose dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200 space-y-4 whitespace-pre-line leading-relaxed">
                  {article.content || 'No content written yet.'}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>{isAr ? 'اضغط خارج النافذة للإغلاق' : 'Preview rendered with real database values.'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-800 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
