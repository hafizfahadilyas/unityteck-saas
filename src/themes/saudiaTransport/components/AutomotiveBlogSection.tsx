import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Calendar,
  Clock,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { BlecoBlogPost } from '../../../data/blecoStoreData';
import { BLECO_BLOG_POSTS } from '../../../data/blecoStoreData';

interface AutomotiveBlogSectionProps {
  isAr: boolean;
  onSelectPost: (post: BlecoBlogPost) => void;
  openWhatsAppOrder?: (customMsg?: string) => void;
}

// WhatsApp icon glyph
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.03-.491-1.607-.66-2.617-2.28-2.697-2.387-.078-.107-.655-.873-.655-1.665 0-.793.414-1.184.561-1.344.144-.159.317-.198.423-.198.106 0 .211.002.304.006.098.005.231-.037.36.273.134.321.458 1.116.498 1.198.04.082.066.177.013.283-.053.106-.079.172-.158.265-.08.092-.167.206-.239.277-.08.079-.163.165-.07.324.093.159.412.679.883 1.098.607.54 1.119.707 1.278.786.159.08.252.069.346-.039.093-.108.397-.463.503-.621.106-.159.212-.132.358-.079.146.053.927.437 1.086.516.159.079.265.119.304.185.04.066.04.384-.104.789z" />
  </svg>
);

const AutomotiveBlogSectionComponent: React.FC<AutomotiveBlogSectionProps> = ({
  isAr,
  onSelectPost,
  openWhatsAppOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});

  const toggleLike = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setLikedPostIds(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const categories = [
    { key: 'all', labelAr: 'جميع المقالات', labelEn: 'All Articles' },
    { key: 'seat-covers', labelAr: 'تلابيس وتنجيد المقاعد', labelEn: 'Seat Covers & Upholstery' },
    { key: 'floor-mats', labelAr: 'أرضيات الليزر والدايموند', labelEn: '3D & 5D Floor Mats' },
    { key: 'care-detailing', labelAr: 'العناية والتلميع', labelEn: 'Care & Detailing' },
  ];

  // Filter posts by category and search keyword
  const filteredPosts = useMemo(() => {
    return BLECO_BLOG_POSTS.slice(0, 3).filter(post => {
      // Category match
      const matchesCategory =
        selectedCategory === 'all' || post.categoryKey === selectedCategory;

      // Keyword match
      if (!searchQuery.trim()) return matchesCategory;
      const query = searchQuery.toLowerCase().trim();
      const title = (isAr ? post.titleAr : post.titleEn).toLowerCase();
      const summary = (isAr ? post.summaryAr : post.summaryEn).toLowerCase();
      const tags = (isAr ? post.tagsAr : post.tagsEn).join(' ').toLowerCase();

      return matchesCategory && (title.includes(query) || summary.includes(query) || tags.includes(query));
    });
  }, [selectedCategory, searchQuery, isAr]);

  // Show all 3 blog posts directly in the 3-column grid
  const featuredPost = null as BlecoBlogPost | null;

  // Posts for standard 3-column card grid
  const standardPosts = filteredPosts;

  return (
    <section id="blog-section" className="space-y-8 scroll-mt-24">
      {/* ========================================================
          1. SECTION HEADER WITH AUTOMOTIVE BADGE & TRUST METRICS
          ======================================================== */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a0638] via-[#2a0a55] to-[#12042a] border border-[#f6c344]/25 p-6 sm:p-9 space-y-6 shadow-2xl shadow-[#3e0f77]/20">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#f6c344]/10 blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f6c344]/70 to-transparent" />

        <div className="relative flex flex-col items-center text-center gap-2">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-[0.35em] uppercase font-semibold text-[#f6c344]">
            <span className="w-8 h-px bg-[#f6c344]/60" />
            {isAr ? 'المجلة' : 'The Journal'}
            <span className="w-8 h-px bg-[#f6c344]/60" />
          </span>

          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
            {isAr ? (
              <>مدونة <span className="font-semibold text-[#f6c344]">العناية بالسيارات</span></>
            ) : (
              <>Cabin <span className="font-semibold text-[#f6c344]">Luxury</span> Journal</>
            )}
          </h2>
        </div>

        {/* ========================================================
            2. CATEGORY TABS & LIVE SEARCH BAR
            ======================================================== */}
        <div className="relative flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            {categories.map(cat => {
              const active = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    active
                      ? 'bg-gradient-to-r from-[#f6c344] to-[#e0a82e] text-[#2a0a55] border-transparent shadow-lg shadow-[#f6c344]/25'
                      : 'bg-white/5 text-white/75 border-white/15 hover:border-[#f6c344]/50 hover:text-[#f6c344]'
                  }`}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[220px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-[#f6c344]/70 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث...' : 'Search...'}
              className="w-full text-xs text-white placeholder:text-white/40 bg-white/5 rounded-full border border-white/15 py-2.5 rtl:pr-9 rtl:pl-8 ltr:pl-9 ltr:pr-8 focus:outline-hidden focus:border-[#f6c344]/70 focus:ring-1 focus:ring-[#f6c344]/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 rtl:left-2.5 ltr:right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-white/50 hover:text-white rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. FEATURED LEAD ARTICLE (EDITORIAL HERO CARD)
          ======================================================== */}
      {featuredPost && (
        <div
          onClick={() => onSelectPost(featuredPost)}
          className="bg-white rounded-3xl border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group grid grid-cols-1 lg:grid-cols-12 gap-0"
        >
          {/* Left / Top: High-Res 16:9 Image */}
          <div className="lg:col-span-7 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto overflow-hidden bg-slate-900 relative">
            <img
              src={featuredPost.image}
              alt={isAr ? featuredPost.titleAr : featuredPost.titleEn}
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent lg:hidden" />

            {/* Floating Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="bg-[#3e0f77] text-[#f6c344] text-[11px] font-black px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                {isAr ? featuredPost.categoryAr : featuredPost.categoryEn}
              </span>

              <span className="bg-amber-500/90 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-md">
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'المقال الأكثر قراءة' : 'Most Read'}</span>
              </span>
            </div>

            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white text-[11px] lg:hidden">
              <span className="font-bold">{featuredPost.date}</span>
              <span className="bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                {isAr ? featuredPost.readTimeAr : featuredPost.readTimeEn}
              </span>
            </div>
          </div>

          {/* Right / Bottom: Content */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Meta Ribbon */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <img
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.nameAr}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                  />
                  <span className="font-bold text-slate-800">
                    {isAr ? featuredPost.author.nameAr : featuredPost.author.nameEn}
                  </span>
                  {featuredPost.author.verified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <span>·</span>
                <span className="hidden sm:inline">{featuredPost.date}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{isAr ? featuredPost.readTimeAr : featuredPost.readTimeEn}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className="font-black text-lg sm:text-xl text-slate-900 group-hover:text-[#3e0f77] transition-colors leading-snug">
                {isAr ? featuredPost.titleAr : featuredPost.titleEn}
              </h3>

              {/* Subtitle / Summary */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                {isAr ? featuredPost.summaryAr : featuredPost.summaryEn}
              </p>

              {/* Takeaway Bullets Preview */}
              {featuredPost.keyTakeawaysAr && (
                <div className="pt-2 space-y-1.5 hidden sm:block">
                  {featuredPost.keyTakeawaysAr.slice(0, 2).map((takeaway, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{takeaway}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#3e0f77] group-hover:underline">
                <span>{isAr ? 'اقرأ الدليل الشامل' : 'Read Full Guide'}</span>
                {isAr ? (
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                )}
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-xs">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{featuredPost.views.toLocaleString()}</span>
                </span>
                <button
                  type="button"
                  onClick={e => toggleLike(e, featuredPost.id)}
                  className={`flex items-center gap-1 transition-colors cursor-pointer ${
                    likedPostIds[featuredPost.id] ? 'text-rose-600' : 'hover:text-rose-500'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedPostIds[featuredPost.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{(featuredPost.likes || 120) + (likedPostIds[featuredPost.id] ? 1 : 0)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. STANDARD ARTICLES GRID (RESPONSIVE 3 COLUMNS)
          ======================================================== */}
      {standardPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standardPosts.map(post => (
            <article
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group relative aspect-[4/5] rounded-[28px] overflow-hidden bg-[#12042a] cursor-pointer ring-1 ring-white/10 hover:ring-[#f6c344]/60 shadow-xl hover:shadow-2xl hover:shadow-[#3e0f77]/40 hover:-translate-y-1.5 transition-all duration-500"
            >
              <img
                src={post.image}
                alt={isAr ? post.titleAr : post.titleEn}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
              />
              {/* Luxury gradient veil */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#12042a] via-[#12042a]/55 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />

              {/* Top row: category + like */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                <span className="px-3.5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-[#f6c344]/40 text-[#f6c344] text-[10px] font-semibold tracking-[0.18em] uppercase">
                  {isAr ? post.categoryAr : post.categoryEn}
                </span>

                <button
                  type="button"
                  onClick={e => toggleLike(e, post.id)}
                  aria-label="Like"
                  className={`w-9 h-9 rounded-full bg-black/35 backdrop-blur-md border border-white/15 flex items-center justify-center transition-colors cursor-pointer ${
                    likedPostIds[post.id] ? 'text-rose-400' : 'text-white/80 hover:text-rose-400'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedPostIds[post.id] ? 'fill-rose-400' : ''}`} />
                </button>
              </div>

              {/* Bottom: title + meta + CTA */}
              <div className="absolute bottom-0 inset-x-0 p-6 space-y-4">
                <div className="flex items-center gap-3 text-[11px] text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f6c344]" />
                    {isAr ? post.readTimeAr : post.readTimeEn}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#f6c344]" />
                    {post.views?.toLocaleString()}
                  </span>
                </div>

                <h4 className="text-white font-semibold text-lg leading-snug tracking-tight line-clamp-2">
                  {isAr ? post.titleAr : post.titleEn}
                </h4>

                <div className="flex items-center justify-between pt-4 border-t border-white/15">
                  <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#f6c344]">
                    {isAr ? 'اقرأ المزيد' : 'Read More'}
                  </span>
                  <span className="w-10 h-10 rounded-full bg-[#f6c344] text-[#2a0a55] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#f6c344]/30">
                    {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">
            {isAr ? 'لا توجد مقالات مطابقة لبحثك' : 'No articles match your search'}
          </h4>
          <p className="text-xs text-slate-400">
            {isAr ? 'جرّب البحث بكلمة أخرى مثل "كامري" أو "ليزر" أو "جلد"' : 'Try searching for terms like "leather", "laser", or "Camry"'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-[#3e0f77] text-white rounded-full text-xs font-bold cursor-pointer"
          >
            {isAr ? 'عرض جميع المقالات' : 'Reset Filters'}
          </button>
        </div>
      )}

      {/* ========================================================
          5. CONSULTATION BANNER (MINIMAL LUXURY)
          ======================================================== */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a0638] via-[#2a0a55] to-[#12042a] border border-[#f6c344]/25 px-6 sm:px-10 py-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl shadow-[#3e0f77]/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#f6c344]/10 blur-3xl pointer-events-none" />
        <div className="relative text-center sm:text-start space-y-1">
          <span className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#f6c344]">
            {isAr ? 'استشارة خاصة' : 'Private Consultation'}
          </span>
          <h3 className="text-lg sm:text-2xl font-light text-white tracking-tight">
            {isAr ? 'صمّم داخلية سيارتك بذوق راقٍ' : 'Tailor your cabin to perfection'}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => {
            if (openWhatsAppOrder) {
              openWhatsAppOrder(
                isAr
                  ? 'السلام عليكم، قرأت مقالات مدونة متجر السعيدي وأود استشارة الفني بخصوص تجهيز وتلبيس سيارتي'
                  : 'Hello, I read Al-Saeedi blog articles and would like to consult your specialist for my vehicle'
              );
            }
          }}
          className="relative shrink-0 px-7 py-3 rounded-full bg-gradient-to-r from-[#f6c344] to-[#e0a82e] text-[#2a0a55] font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#f6c344]/20 hover:shadow-[#f6c344]/40 hover:scale-[1.03] transition-all cursor-pointer"
        >
          <WhatsAppIcon className="w-4 h-4" />
          <span>{isAr ? 'تواصل معنا' : 'Chat with us'}</span>
        </button>
      </div>
    </section>
  );
};

export const AutomotiveBlogSection = React.memo(AutomotiveBlogSectionComponent);
