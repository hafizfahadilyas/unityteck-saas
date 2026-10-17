import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  HelpCircle,
  Copy,
  Plus,
  Minus,
  MessageCircle,
} from 'lucide-react';
import type { BlecoBlogPost, Product } from '../../../data/blecoStoreData';
import { BLECO_STORE_PRODUCTS, BLECO_BLOG_POSTS } from '../../../data/blecoStoreData';

interface AutomotiveBlogModalProps {
  post: BlecoBlogPost;
  isAr: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectBlogPost?: (post: BlecoBlogPost) => void;
  openWhatsAppOrder?: (customMsg?: string) => void;
}

// WhatsApp icon glyph
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.03-.491-1.607-.66-2.617-2.28-2.697-2.387-.078-.107-.655-.873-.655-1.665 0-.793.414-1.184.561-1.344.144-.159.317-.198.423-.198.106 0 .211.002.304.006.098.005.231-.037.36.273.134.321.458 1.116.498 1.198.04.082.066.177.013.283-.053.106-.079.172-.158.265-.08.092-.167.206-.239.277-.08.079-.163.165-.07.324.093.159.412.679.883 1.098.607.54 1.119.707 1.278.786.159.08.252.069.346-.039.093-.108.397-.463.503-.621.106-.159.212-.132.358-.079.146.053.927.437 1.086.516.159.079.265.119.304.185.04.066.04.384-.104.789z" />
  </svg>
);

export const AutomotiveBlogModal: React.FC<AutomotiveBlogModalProps> = ({
  post,
  isAr,
  onClose,
  onSelectProduct,
  onSelectBlogPost,
  openWhatsAppOrder,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [likesCount, setLikesCount] = useState(post.likes || 120);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate reading scroll progress
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const totalScroll = scrollHeight - clientHeight;
    if (totalScroll > 0) {
      setScrollProgress((scrollTop / totalScroll) * 100);
    }
  };

  const handleLike = () => {
    if (!hasLiked) {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    } else {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href.split('#')[0] + `#blog-${post.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const title = isAr ? post.titleAr : post.titleEn;
    const text = isAr
      ? `أنصحك بقراءة هذا المقال المتخصص من متجر السعيدي لتنجيد السيارات: "${title}"`
      : `Check out this expert car care & upholstery guide from Al-Saeedi: "${title}"`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + window.location.href)}`;
    window.open(shareUrl, '_blank');
  };

  // Find related products mentioned in the article
  const relatedProducts = (post.relatedProductIds || [])
    .map(id => BLECO_STORE_PRODUCTS.find(p => p.id === id))
    .filter((p): p is Product => Boolean(p));

  // Find other articles for recommendations
  const otherPosts = BLECO_BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 2);

  // Font size class mapping
  const bodyTextSizeClass =
    fontSize === 'xlarge'
      ? 'text-base sm:text-lg leading-loose'
      : fontSize === 'large'
      ? 'text-sm sm:text-base leading-relaxed'
      : 'text-xs sm:text-sm leading-relaxed';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[94vh] sm:h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col justify-between">
        {/* ========================================================
            TOP BAR: Sticky Header with Reading Progress & Controls
            ======================================================== */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-xs">
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-[#3e0f77] via-[#5d17b3] to-[#f6c344] transition-all duration-150"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="px-4 py-3 flex items-center justify-between gap-3">
            {/* Left: Category & Title snippet */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-[#3e0f77]/10 text-[#3e0f77]">
                <BookOpen className="w-3 h-3 text-[#3e0f77]" />
                <span>{isAr ? post.categoryAr : post.categoryEn}</span>
              </span>
              <h3 className="font-bold text-xs text-slate-800 truncate hidden sm:block">
                {isAr ? post.titleAr : post.titleEn}
              </h3>
            </div>

            {/* Right: Actions (Font Size, Share, Like, Close) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Font size toggles */}
              <div className="hidden sm:flex items-center border border-slate-200 rounded-full px-1.5 py-0.5 bg-slate-50 text-[11px] font-bold text-slate-600">
                <button
                  type="button"
                  title="Normal font size"
                  onClick={() => setFontSize('normal')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${fontSize === 'normal' ? 'bg-white shadow-xs text-[#3e0f77]' : 'hover:text-slate-900'}`}
                >
                  A
                </button>
                <button
                  type="button"
                  title="Large font size"
                  onClick={() => setFontSize('large')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${fontSize === 'large' ? 'bg-white shadow-xs text-[#3e0f77]' : 'hover:text-slate-900'}`}
                >
                  A+
                </button>
                <button
                  type="button"
                  title="Extra large font size"
                  onClick={() => setFontSize('xlarge')}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${fontSize === 'xlarge' ? 'bg-white shadow-xs text-[#3e0f77]' : 'hover:text-slate-900'}`}
                >
                  A++
                </button>
              </div>

              {/* Like / Helpful button */}
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                  hasLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="text-[11px]">{likesCount}</span>
              </button>

              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                title={isAr ? 'مشاركة عبر الواتساب' : 'Share on WhatsApp'}
                className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-pointer transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </button>

              {/* Copy link */}
              <button
                type="button"
                onClick={handleCopyLink}
                title={isAr ? 'نسخ رابط المقال' : 'Copy article link'}
                className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer transition-colors relative"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedLink && (
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                    {isAr ? 'تم النسخ!' : 'Copied!'}
                  </span>
                )}
              </button>

              {/* Close Modal */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            SCROLLABLE ARTICLE BODY
            ======================================================== */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8 text-slate-700"
        >
          {/* Article Header & Meta */}
          <div className="space-y-4 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full font-black text-xs bg-[#3e0f77] text-[#f6c344] shadow-xs">
                {isAr ? post.categoryAr : post.categoryEn}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? post.readTimeAr : post.readTimeEn}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{post.date}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{post.views?.toLocaleString() || '3,450'} {isAr ? 'قراءة' : 'reads'}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-black text-slate-900 leading-snug tracking-tight">
              {isAr ? post.titleAr : post.titleEn}
            </h1>

            {post.subtitleAr && (
              <p className="text-xs sm:text-base text-slate-600 leading-relaxed font-medium">
                {isAr ? post.subtitleAr : post.subtitleEn}
              </p>
            )}

            {/* Author Card Ribbon */}
            <div className="flex items-center justify-between gap-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <img
                  src={post.author.avatar}
                  alt={isAr ? post.author.nameAr : post.author.nameEn}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#3e0f77]/20 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      {isAr ? post.author.nameAr : post.author.nameEn}
                    </h4>
                    {post.author.verified && (
                      <span className="inline-flex items-center text-emerald-600" title="خبير معتمد">
                        <ShieldCheck className="w-4 h-4 fill-emerald-100" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? post.author.roleAr : post.author.roleEn}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (openWhatsAppOrder) {
                    const msg = isAr
                      ? `السلام عليكم، أود استشارة ${post.author.nameAr} بخصوص مقال "${post.titleAr}"`
                      : `Hello, I'd like to consult ${post.author.nameEn} regarding the guide: "${post.titleEn}"`;
                    openWhatsAppOrder(msg);
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'استشارة الكاتب' : 'Consult Author'}</span>
              </button>
            </div>
          </div>

          {/* High-Resolution Hero Banner */}
          <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-slate-950 shadow-lg border border-slate-200 relative group">
            <img
              src={post.image}
              alt={isAr ? post.titleAr : post.titleEn}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-[11px] sm:text-xs flex items-center justify-between">
              <span className="font-medium bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                {isAr ? 'تصوير حصري لمقصورات متجر السعيدي' : 'Al-Saeedi Bespoke Automotive Upholstery'}
              </span>
              <span className="text-[#f6c344] font-bold">
                {isAr ? 'ضمان سنتين ذهبي' : '2-Year Warranty'}
              </span>
            </div>
          </div>

          {/* ========================================================
              KEY TAKEAWAYS BOX (أبرز ما في هذا الدليل)
              ======================================================== */}
          {post.keyTakeawaysAr && post.keyTakeawaysAr.length > 0 && (
            <div className="bg-gradient-to-br from-[#3e0f77]/5 via-amber-500/5 to-slate-50 rounded-2xl p-5 border border-[#3e0f77]/15 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-[#3e0f77]">
                <Sparkles className="w-4 h-4 text-[#f6c344]" />
                <h3 className="font-black text-xs sm:text-sm tracking-tight text-[#3e0f77]">
                  {isAr ? 'أبرز النقاط والمخرجات في هذا الدليل الهندي:' : 'Key Takeaways & Engineering Highlights:'}
                </h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                {(isAr ? post.keyTakeawaysAr : post.keyTakeawaysEn).map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ========================================================
              STRUCTURED SECTIONS (MULTI-SECTION REAL CONTENT)
              ======================================================== */}
          {post.sections && post.sections.length > 0 ? (
            <div className="space-y-8">
              {post.sections.map((sec, sIdx) => (
                <div key={sec.id || sIdx} className="space-y-3">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 border-r-4 sm:border-r-4 border-[#3e0f77] pr-3 rtl:border-r-4 rtl:pr-3 ltr:border-l-4 ltr:pl-3 ltr:border-r-0">
                    {isAr ? sec.headingAr : sec.headingEn}
                  </h3>

                  <div className={`space-y-3 text-slate-700 ${bodyTextSizeClass}`}>
                    {(isAr ? sec.paragraphsAr : sec.paragraphsEn).map((p, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* Pro Tip Callout Box */}
                  {(sec.tipAr || sec.tipEn) && (
                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-2xl border border-amber-400/30 text-amber-900 text-xs sm:text-sm my-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-black text-amber-950 block">
                          {isAr ? 'نصيحة خبراء تنجيد مكة:' : 'Al-Saeedi Master Tip:'}
                        </span>
                        <p className="leading-relaxed font-medium">
                          {isAr ? sec.tipAr : sec.tipEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning Callout Box */}
                  {(sec.warningAr || sec.warningEn) && (
                    <div className="flex items-start gap-3 p-4 bg-rose-500/10 rounded-2xl border border-rose-400/30 text-rose-950 text-xs sm:text-sm my-3">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-black text-rose-950 block">
                          {isAr ? 'تنبيه أمان جوهري:' : 'Safety Critical Warning:'}
                        </span>
                        <p className="leading-relaxed font-medium">
                          {isAr ? sec.warningAr : sec.warningEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Spec Table */}
                  {sec.specTable && sec.specTable.length > 0 && (
                    <div className="overflow-x-auto my-4 rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-xs text-left rtl:text-right">
                        <thead className="bg-[#3e0f77] text-white">
                          <tr>
                            <th className="p-3 font-bold">{isAr ? 'المعيار الفني' : 'Technical Criteria'}</th>
                            <th className="p-3 font-bold">{isAr ? 'مواصفات تنجيد مكة' : 'Al-Saeedi Specification'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {sec.specTable.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                              <td className="p-3 font-bold text-slate-800">{isAr ? row.labelAr : row.labelEn}</td>
                              <td className="p-3 text-slate-600">{isAr ? row.valueAr : row.valueEn}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Fallback to simple paragraphs if no structured sections */
            <div className={`space-y-4 text-slate-700 ${bodyTextSizeClass}`}>
              {(isAr ? post.contentAr : post.contentEn).map((para, pIdx) => (
                <p key={pIdx} className="leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* ========================================================
              MENTIONED / RECOMMENDED STORE PRODUCTS IN THIS ARTICLE
              ======================================================== */}
          {relatedProducts.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 to-[#3e0f77] rounded-3xl p-6 text-white space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#f6c344]" />
                  <h3 className="font-black text-sm sm:text-base text-[#f6c344]">
                    {isAr ? 'منتجات متجر السعيدي المذكورة في هذا المقال:' : 'Featured Store Products in This Guide:'}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-300">
                  {isAr ? 'مطابقة للأبعاد ومعايير الأمان 100%' : '100% Precision Fit & Airbag Certified'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 flex items-center justify-between gap-3 hover:bg-white/15 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white/20 overflow-hidden shrink-0">
                        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate group-hover:text-[#f6c344] transition-colors">
                          {isAr ? prod.nameAr : prod.nameEn || prod.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-black text-xs text-[#f6c344]">
                            {prod.discountedPrice || prod.price} {isAr ? 'ر.س' : 'SAR'}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {prod.originalPrice} {isAr ? 'ر.س' : 'SAR'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      {onSelectProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSelectProduct(prod);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                        >
                          {isAr ? 'معاينة' : 'View'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (openWhatsAppOrder) {
                            const pName = isAr ? prod.nameAr : prod.nameEn || prod.name;
                            openWhatsAppOrder(
                              isAr
                                ? `السلام عليكم، أود طلب: "${pName}" المذكور في مقال المدونة بسعر ${prod.discountedPrice || prod.price} ر.س`
                                : `Hello, I'd like to order: "${pName}" mentioned in the blog post for ${prod.discountedPrice || prod.price} SAR`
                            );
                          }
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors flex items-center gap-1 justify-center whitespace-nowrap"
                      >
                        <WhatsAppIcon className="w-3 h-3" />
                        <span>{isAr ? 'طلب' : 'Order'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              ARTICLE FAQS ACCORDION
              ======================================================== */}
          {post.faq && post.faq.length > 0 && (
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-900">
                <HelpCircle className="w-4 h-4 text-[#3e0f77]" />
                <h4 className="font-bold text-sm">
                  {isAr ? 'أسئلة شائعة يجيب عنها خبراؤنا:' : 'Frequently Asked Questions:'}
                </h4>
              </div>

              <div className="space-y-2">
                {post.faq.map((item, fIdx) => (
                  <div key={fIdx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(openFaqIdx === fIdx ? null : fIdx)}
                      className="w-full p-3 text-start flex items-center justify-between gap-2 font-bold text-xs text-slate-900 hover:text-[#3e0f77] transition-colors cursor-pointer"
                    >
                      <span>{isAr ? item.qAr : item.qEn}</span>
                      <span className="shrink-0 text-slate-400">
                        {openFaqIdx === fIdx ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {openFaqIdx === fIdx && (
                      <div className="p-3 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {isAr ? item.aAr : item.aEn}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              AUTHOR BIO SIGNATURE
              ======================================================== */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.author.avatar}
                alt={isAr ? post.author.nameAr : post.author.nameEn}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow"
              />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  {isAr ? post.author.nameAr : post.author.nameEn}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isAr ? post.author.roleAr : post.author.roleEn} · {isAr ? 'متجر السعيدي - مكة المكرمة' : 'Al-Saeedi Store, Makkah'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>{isAr ? 'شارك المقال' : 'Share'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ الرابط' : 'Copy')}</span>
              </button>
            </div>
          </div>

          {/* ========================================================
              RELATED ARTICLES
              ======================================================== */}
          {otherPosts.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3e0f77]" />
                <span>{isAr ? 'مقالات ذات صلة قد تهمك:' : 'Related Articles You May Like:'}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherPosts.map(op => (
                  <div
                    key={op.id}
                    onClick={() => {
                      if (onSelectBlogPost) {
                        onSelectBlogPost(op);
                        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
                      }
                    }}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-[#3e0f77]/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-3 group"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={op.image} alt={op.titleAr} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[#3e0f77]">{isAr ? op.categoryAr : op.categoryEn}</span>
                        <h5 className="font-bold text-xs text-slate-900 group-hover:text-[#3e0f77] transition-colors line-clamp-2 leading-snug">
                          {isAr ? op.titleAr : op.titleEn}
                        </h5>
                      </div>
                      <span className="text-[10px] text-slate-400">{op.date} · {isAr ? op.readTimeAr : op.readTimeEn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            MODAL BOTTOM BAR
            ======================================================== */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            {isAr
              ? 'متجر السعيدي لخدمات السيارات — معتمد في المركز السعودي للأعمال'
              : 'Al-Saeedi Auto Services — SBC Verified Store'}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                if (openWhatsAppOrder) {
                  openWhatsAppOrder(
                    isAr
                      ? `السلام عليكم، قرأت مقال "${post.titleAr}" وأود الاستفسار عن تلابيس وأرضيات مناسبة لسيارتي`
                      : `Hello, I read the guide "${post.titleEn}" and would like to inquire about covers/mats for my car`
                  );
                }
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>{isAr ? 'استشارة مجانية عبر الواتساب' : 'Free WhatsApp Consultation'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold text-xs cursor-pointer transition-colors"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
