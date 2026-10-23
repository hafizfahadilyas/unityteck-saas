import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { fetchBlogDataApi } from '../../../api/tenantApi';
import type { BlogArticleItem } from '../../../types/blog';
import { ArrowLeft, ArrowRight, BookOpen, Clock, X, Sparkles, Share2 } from 'lucide-react';
import { handleImageError, cleanImageUrl } from '../../../utils/imageFallback';

export const MagazineSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';
  const { activeStore } = useTenant();
  const storeId = activeStore?.id || 'store-1';

  const [articles, setArticles] = useState<BlogArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticleItem | null>(null);

  // Load articles from real backend Hostinger API
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchBlogDataApi(storeId);
      if (res && res.data && res.data.length > 0) {
        setArticles(res.data);
      }
    } catch (err) {
      console.error('Failed to load magazine articles from API:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Listen to blog update events from admin dashboard
  useEffect(() => {
    const handleUpdate = () => loadArticles();
    window.addEventListener('unityteck-blog-updated', handleUpdate);
    window.addEventListener('unityteck-data', handleUpdate);
    return () => {
      window.removeEventListener('unityteck-blog-updated', handleUpdate);
      window.removeEventListener('unityteck-data', handleUpdate);
    };
  }, [loadArticles]);

  if (!loading && articles.length === 0) {
    return null;
  }

  return (
    <section id="magazine-section" className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Title Header matching site-wide uniform styling */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c]">
            {isAr ? 'أسرار وفنون الإهداء الملكي' : 'The Art of Royal Gifting'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1 font-light">
            {isAr
              ? 'مقالات وإلهام من خبراء ومنسقي الزهور في مكة المكرمة'
              : 'Exclusive articles from master florists and gift concierges in Mecca'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold shrink-0">
          <BookOpen className="w-3.5 h-3.5 text-[#102a1c]" />
          <span>{isAr ? 'مجلة هدايا مكة' : 'Mecca Journal'}</span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && articles.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-[#e8e4dc] rounded-t-[2.5rem] rounded-b-2xl h-80 p-4 space-y-4">
              <div className="w-full h-44 bg-slate-200 rounded-t-[2.5rem]" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* 4 Articles Sculptural Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.slice(0, 4).map((article: any) => {
          const title = isAr ? (article.titleAr || article.title) : (article.titleEn || article.title);
          const category = isAr ? (article.categoryAr || article.category) : (article.categoryEn || article.category);
          const summary = isAr ? (article.summaryAr || article.summary || article.excerpt) : (article.summaryEn || article.summary || article.excerpt);
          const readTime = isAr ? (article.readTime || article.read_time || '3 دقائق قراءة') : (article.readTimeEn || '3 min read');
          const image = article.thumbnail || article.image;

          return (
            <article
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="group cursor-pointer flex flex-col justify-between bg-white border border-[#e8e4dc] rounded-t-[2.5rem] rounded-b-2xl overflow-hidden hover:shadow-2xl hover:border-[#102a1c]/40 transition-all duration-300 transform hover:-translate-y-2 relative"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-[#eeebe3] relative rounded-t-[2.5rem]">
                <img
                  src={cleanImageUrl(image)}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto bg-[#102a1c]/90 backdrop-blur-md text-[#e6ca98] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                  {category}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8c8275] mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{readTime}</span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1a1f1b] group-hover:text-[#102a1c] transition-colors leading-snug line-clamp-2">
                    {title}
                  </h3>

                  <p className="text-xs text-[#6c757d] mt-1.5 line-clamp-2 leading-relaxed">
                    {summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs font-bold text-[#102a1c] group-hover:text-[#8b263e] transition-colors">
                  <span>{isAr ? 'اقرأ المقال كاملاً' : 'Read Article'}</span>
                  {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ARTICLE FULL MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e8e4dc] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Image Header */}
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img
                src={(selectedArticle as any).thumbnail || (selectedArticle as any).image}
                alt={isAr ? ((selectedArticle as any).titleAr || selectedArticle.title) : ((selectedArticle as any).titleEn || selectedArticle.title)}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto w-9 h-9 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 inset-x-6 text-white">
                <span className="px-2.5 py-0.5 rounded-full bg-[#102a1c] text-[#e6ca98] text-[10px] font-bold">
                  {isAr
                    ? ((selectedArticle as any).categoryAr || selectedArticle.category)
                    : ((selectedArticle as any).categoryEn || selectedArticle.category)}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-1">
                  {isAr
                    ? ((selectedArticle as any).titleAr || selectedArticle.title)
                    : ((selectedArticle as any).titleEn || selectedArticle.title)}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#444] leading-relaxed">
              <p className="font-semibold text-sm text-[#102a1c]">
                {isAr
                  ? ((selectedArticle as any).summaryAr || (selectedArticle as any).summary || selectedArticle.excerpt)
                  : ((selectedArticle as any).summaryEn || (selectedArticle as any).summary || selectedArticle.excerpt)}
              </p>
              
              <p>
                {isAr
                  ? ((selectedArticle as any).contentAr || (selectedArticle as any).content || 'في متجر هدايا مكة، نؤمن بأن كل باقة ورد تحمل حكاية مشاعر فريدة. لذلك نعتني باختيار أجود زهور المزارع العالمية في هولندا والإكوادور، وننسقها بأيدي خبراء معتمدين لتصلكم في أبهى حلة تليق بمناسباتكم الملكية والخاصة.')
                  : ((selectedArticle as any).contentEn || (selectedArticle as any).content || 'At Hadaya Mecca, we believe every bouquet embodies a unique emotional bond. We select the finest Dutch blooms and arrange them with meticulous care.')}
              </p>

              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#e8e4dc] space-y-1">
                <span className="font-bold text-[#102a1c] block">
                  {isAr ? 'نصيحة منسق هدايا مكة:' : 'Mecca Florist Tip:'}
                </span>
                <p className="text-xs text-[#666]">
                  {isAr
                    ? 'لحفظ نضارة الورد الطبيعي لأكثر من 10 أيام، احرص على وضعه في مكان بارد وتغيير الماء كل يومين مع قص أطراف السيقان بزاوية 45 درجة.'
                    : 'To extend bouquet freshness beyond 10 days, place it in a cool ambiance, change fresh water every 48 hours and trim stems at a 45-degree angle.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF9F5] border-t border-[#e8e4dc] flex items-center justify-between">
              <span className="text-xs text-[#8c8275]">
                {isAr
                  ? ((selectedArticle as any).readTime || (selectedArticle as any).read_time || '3 دقائق قراءة')
                  : ((selectedArticle as any).readTimeEn || '3 min read')}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2 rounded-xl bg-[#102a1c] text-white text-xs font-bold hover:bg-[#1a3f2b] transition-colors"
              >
                {isAr ? 'إغلاق المقال' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
