import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Share2,
  Tag,
  ShoppingBag,
  Sparkles,
  Flower2,
} from 'lucide-react';
import type { BlogArticleItem } from '../settings/themeSettingsStore';

interface BlogPageViewProps {
  articles: BlogArticleItem[];
  lang: string;
  onBack: () => void;
  onGoToShop: () => void;
}

export const BlogPageView: React.FC<BlogPageViewProps> = ({
  articles,
  lang,
  onBack,
  onGoToShop,
}) => {
  const isAr = lang === 'ar';
  const [selectedArticle, setSelectedArticle] = useState<BlogArticleItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(articles.map((a) => a.category).filter(Boolean)))];

  const filteredArticles = articles.filter(
    (a) => selectedCategory === 'All' || a.category === selectedCategory
  );

  if (selectedArticle) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <button
          type="button"
          onClick={() => setSelectedArticle(null)}
          className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          <span>{isAr ? 'العودة لقائمة المقالات' : 'Back to Blog List'}</span>
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {selectedArticle.category}
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedArticle.date}</span>
            </span>
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedArticle.readTime}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black" style={{ color: 'var(--sf-text)' }}>
            {selectedArticle.title}
          </h1>

          <div className="aspect-16/9 rounded-3xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <img
              src={selectedArticle.image}
              alt={selectedArticle.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose max-w-none text-sm leading-relaxed space-y-4 pt-2" style={{ color: 'var(--sf-text)' }}>
            <p className="font-semibold text-base" style={{ color: 'var(--sf-muted)' }}>
              {selectedArticle.excerpt}
            </p>
            <p>
              {isAr
                ? 'تعتبر العناية بالأزهار الطبيعية في الأجواء الحارة بمكة المكرمة أمراً بالغ الأهمية للحفاظ على رونقها ونضارتها لأطول فترة ممكنة. ننصح دائماً بوضع الفازة في مكان مكيف بدرجة حرارة معتدلة بعيداً عن أشعة الشمس المباشرة ومسارات التكييف القوية.'
                : 'Caring for fresh blooms in the holy city of Makkah requires special attention to keep them vibrant. Always keep the vase in a climate-controlled room away from direct desert sunlight.'}
            </p>
            <p>
              {isAr
                ? 'احرص على تغيير الماء يومياً وقص أطراف السيقان بزاوية 45 درجة بمقدار 2 سم لضمان امتصاص الماء والمغذيات بسلاسة. تشكيلتنا المختارة من هولندا والإكوادور مصممة لتدوم أكثر من 10 أيام مع العناية الصحيحة.'
                : 'Trim stems at a 45-degree angle every 2 days and refresh water daily. Our Dutch and Ecuadorian floral selections are specially chosen for resilience and long-lasting beauty.'}
            </p>
          </div>

          {/* CTA Box */}
          <div className="p-6 rounded-3xl bg-emerald-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Flower2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-sm">{isAr ? 'أعجبتك التنسيقات؟' : 'Loved our flowers?'}</h4>
                <p className="text-xs text-emerald-200">
                  {isAr ? 'تصفح تشكيلة باقات الورد الملكية مع توصيل خلال ساعتين بمكة' : 'Browse royal fresh bouquets with 2-hour Makkah delivery'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoToShop}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-95 shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAr ? 'تسوق الآن' : 'Shop Bouquets'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--sf-border)' }}>
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1 cursor-pointer mb-2"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>{isAr ? 'العودة للمتجر' : 'Back to Storefront'}</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--sf-text)' }}>
              {isAr ? 'مدونة زهور مكة الفاخرة' : 'Makkah Fresh Flowers Blog & Guide'}
            </h1>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--sf-muted)' }}>
            {isAr
              ? 'مقالات حصرية عن تنسيق الأزهار، إرشادات العناية بالورد الطبيعي، وهدايا الحرم المكي'
              : 'Exclusive articles on luxury floral arrangements, rose care guides, and holy sanctuary gifts'}
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {cat === 'All' ? (isAr ? 'جميع المقالات' : 'All Articles') : cat}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            onClick={() => setSelectedArticle(art)}
            className="group rounded-3xl border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col justify-between"
            style={{
              background: 'var(--sf-surface)',
              borderColor: 'var(--sf-border)',
              color: 'var(--sf-text)',
            }}
          >
            <div className="aspect-16/10 overflow-hidden relative">
              <img
                src={art.image}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 start-3 px-3 py-1 rounded-full text-[10px] font-black bg-black/60 backdrop-blur-md text-white">
                {art.category}
              </span>
            </div>

            <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--sf-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{art.date}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </span>
                </div>
                <h3 className="font-extrabold text-base group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--sf-muted)' }}>
                  {art.excerpt}
                </p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--sf-border)' }}>
                <span className="text-xs font-bold text-emerald-600 group-hover:underline inline-flex items-center gap-1">
                  <span>{isAr ? 'اقرأ المقال كاملاً' : 'Read Full Article'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
