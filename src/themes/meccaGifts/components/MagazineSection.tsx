import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ARTICLES } from '../data/mockData';
import { Article } from '../types';
import { ArrowLeft, ArrowRight, BookOpen, Clock, X, Sparkles, Share2 } from 'lucide-react';

export const MagazineSection: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  return (
    <section id="magazine-section" className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-10 border-b border-[#e8e4dc] gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#102a1c]/10 text-[#102a1c] text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#102a1c]" />
            <span>{isAr ? 'مجلة وإلهام هدايا مكة' : 'Hadaya Mecca Journal & Inspiration'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#102a1c] font-serif">
            {isAr ? 'أسرار وفنون الإهداء الملكي' : 'The Art of Royal Gifting'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7164] mt-1">
            {isAr ? 'مقالات حصرية من خبراء ومنسقي الزهور في مكة المكرمة' : 'Exclusive articles from master florists and gift concierges in Mecca'}
          </p>
        </div>
      </div>

      {/* 4 Articles Sculptural Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ARTICLES.map((article) => (
          <article
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group cursor-pointer flex flex-col justify-between bg-white border border-[#e8e4dc] rounded-t-[2.5rem] rounded-b-2xl overflow-hidden hover:shadow-2xl hover:border-[#102a1c]/40 transition-all duration-300 transform hover:-translate-y-2 relative"
          >
            <div className="aspect-[4/3] w-full overflow-hidden bg-[#eeebe3] relative rounded-t-[2.5rem]">
              <img
                src={article.image}
                alt={isAr ? article.title : article.titleEn}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto bg-[#102a1c]/90 backdrop-blur-md text-[#e6ca98] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                {isAr ? article.category : article.categoryEn}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#8c8275] mb-1">
                  <Clock className="w-3 h-3" />
                  <span>{article.readTime}</span>
                </div>

                <h3 className="text-sm font-bold text-[#1a1f1b] group-hover:text-[#102a1c] transition-colors leading-snug line-clamp-2">
                  {isAr ? article.title : article.titleEn}
                </h3>

                <p className="text-xs text-[#6c757d] mt-1.5 line-clamp-2 leading-relaxed">
                  {isAr ? article.summary : article.summaryEn}
                </p>
              </div>

              <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs font-bold text-[#102a1c] group-hover:text-[#8b263e] transition-colors">
                <span>{isAr ? 'اقرأ المقال كاملاً' : 'Read Article'}</span>
                {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* ARTICLE FULL MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e8e4dc] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Image Header */}
            <div className="relative h-60 w-full overflow-hidden shrink-0">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto w-9 h-9 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 inset-x-6 text-white">
                <span className="px-2.5 py-0.5 rounded-full bg-[#102a1c] text-[#e6ca98] text-[10px] font-bold">
                  {isAr ? selectedArticle.category : selectedArticle.categoryEn}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif text-white mt-1">
                  {isAr ? selectedArticle.title : selectedArticle.titleEn}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#444] leading-relaxed">
              <p className="font-semibold text-sm text-[#102a1c]">
                {isAr ? selectedArticle.summary : selectedArticle.summaryEn}
              </p>
              
              <p>
                {isAr
                  ? 'في متجر هدايا مكة، نؤمن بأن كل باقة ورد تحمل حكاية مشاعر فريدة. لذلك نعتني باختيار أجود زهور المزارع العالمية في هولندا والإكوادور، وننسقها بأيدي خبراء معتمدين لتصلكم في أبهى حلة تليق بمناسباتكم الملكية والخاصة.'
                  : 'At Hadaya Mecca, we believe every bouquet embodies a unique emotional bond. We select the finest Dutch blooms and arrange them with meticulous care.'}
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
              <span className="text-xs text-[#8c8275]">{selectedArticle.readTime}</span>
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
