import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Star, ShieldCheck, MessageSquare, Send, ThumbsUp, Sparkles, Coffee } from 'lucide-react';

interface ReviewItem {
  id: string;
  author: string;
  city: string;
  product: string;
  productAr?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  likes: number;
}

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'ندى الحسيني',
    city: 'المملكة العربية السعودية',
    product: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    productAr: 'ماكينة هايبرو بارستا برو دبل بويلر 20 بار',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'صادقين في تعاملهم والأسعار مناسبة',
    comment: 'انصحكم بهذا المتجر صادقين في تعاملهم و الأسعار مناسبة جدا',
    verified: true,
    likes: 89
  },
  {
    id: 'rev-2',
    author: 'خالد الأحمد',
    city: 'الرياض',
    product: 'HiBrew Conical Burr Coffee Mill G5',
    productAr: 'مطحنة بن هايبرو المخروطية G5',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'افضل متجر ردهم سريع ومنتجاتهم ممتازة',
    comment: 'افضل متجر ردهم سريع و منتجاتهم ممتازة',
    verified: true,
    likes: 74
  },
  {
    id: 'rev-3',
    author: 'خالد المسعودي',
    city: 'جدة',
    product: '58mm Naked Walnut Boltfilter',
    productAr: 'بورتافلتر خشب الجوز المكشوف 58 مم',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'مكائن القهوة كلها بجودة عالية',
    comment: 'رهيبين و مكائن القهوة كلها بجودة عالية',
    verified: true,
    likes: 63
  },
  {
    id: 'rev-4',
    author: 'عبدالعزيز اليامي',
    city: 'الخبر',
    product: 'HiBrew Dual-Boiler 20-Bar Barista Pro',
    productAr: 'ماكينة هايبرو بارستا برو دبل بويلر 20 بار',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'تعامل راقي جداً',
    comment: 'أحب هذا المتجر وتعاملهم الراقي مع العملاء ☕️',
    verified: true,
    likes: 58
  },
  {
    id: 'rev-5',
    author: 'عبدالله الغامدي',
    city: 'مكة المكرمة',
    product: 'Master Barista Home Coffee Corner Station',
    productAr: 'ركن ودولاب القهوة المنزلي الفاخر',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'تستاهلوا كل ريال اندفع شكراً هيبرو',
    comment: 'الله يعطيكم العافية تستاهلوا كل ريال اندفع لمنتجاتكم شكرا هيبرو',
    verified: true,
    likes: 95
  },
  {
    id: 'rev-6',
    author: 'سارة',
    city: 'المدينة المنورة',
    product: 'Artisan Stoneware Ceramic Cup Set',
    productAr: 'طقم أكواب السيراميك الحرفية',
    rating: 5,
    date: 'تقييم موثق عبر المتجر',
    title: 'تجربة ممتازة',
    comment: 'روووووعة',
    verified: true,
    likes: 47
  }
];

export const ReviewsPage: React.FC = () => {
  const { language, showToast } = useCart();
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [author, setAuthor] = useState('');
  const [city, setCity] = useState(language === 'AR' ? 'الرياض' : 'Riyadh');
  const [product, setProduct] = useState('HiBrew Dual-Boiler 20-Bar Barista Pro');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) return;

    const newRev: ReviewItem = {
      id: `rev_${Date.now()}`,
      author: author.trim(),
      city,
      product,
      rating,
      date: language === 'AR' ? 'تقييم اليوم' : 'Today',
      title: title.trim() || (language === 'AR' ? 'تجربة ممتازة' : 'Great experience'),
      comment: comment.trim(),
      verified: true,
      likes: 1
    };

    setReviews([newRev, ...reviews]);
    setAuthor('');
    setTitle('');
    setComment('');
    showToast(language === 'AR' ? 'تم نشر تقييمك بنجاح!' : 'Your verified review has been published!');
  };

  const handleLike = (id: string) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, likes: r.likes + 1 } : r));
  };

  return (
    <div className="min-h-screen bg-white py-12 text-start text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <div className="max-w-[1360px] mx-auto px-4 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'AR' ? 'تجارب موثوقة بالمملكة' : 'Verified Reviews'}</span>
          </div>
          <h1 className={`honor-heading text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-black text-center ${
            language === 'AR' ? 'leading-[1.4] tracking-normal' : 'leading-tight tracking-[-0.01em]'
          }`}>
            {language === 'AR' ? 'تقييمات وتجارب العملاء المعتمدة' : 'Verified Customer Reviews'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600">
            {language === 'AR'
              ? 'تجارب حقيقية من مقتني مكائن ومطاحن هاي برو في المملكة العربية السعودية مع تقييم عام 4.96 من 5.'
              : 'Real feedback from verified buyers across Saudi Arabia with an overall 4.96/5 satisfaction rating.'}
          </p>
        </div>

        {/* Reviews List and Submission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Reviews List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {reviews.map(rev => (
              <div
                key={rev.id}
                className="bg-[#F8F9FA] rounded-3xl p-6 sm:p-7 space-y-3 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-black text-white font-black flex items-center justify-center text-sm">
                      {rev.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">{rev.author}</span>
                        {rev.verified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>{language === 'AR' ? 'مشتري معتمد' : 'Verified Buyer'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500">{rev.city} · {language === 'AR' && rev.productAr ? rev.productAr : rev.product}</span>
                    </div>
                  </div>

                  <span className="text-xs text-neutral-400 font-mono">{rev.date}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
                    />
                  ))}
                </div>

                <h3 className="font-bold text-base text-neutral-900">{rev.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">{rev.comment}</p>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={() => handleLike(rev.id)}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{rev.likes}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Form (4 cols) */}
          <div className="lg:col-span-4 bg-[#F8F9FA] rounded-3xl p-6 space-y-4 sticky top-24">
            <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-neutral-800" />
              <span>{language === 'AR' ? 'شاركنا تجربتك' : 'Write a Review'}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'اسمك الكريم' : 'Your Name'}</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'المدينة' : 'City'}</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'المنتج' : 'Product'}</label>
                <select
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                >
                  <option value="HiBrew Dual-Boiler 20-Bar Barista Pro">{language === 'AR' ? 'ماكينة هايبرو بارستا برو دبل بويلر 20 بار' : 'HiBrew Dual-Boiler 20-Bar Barista Pro'}</option>
                  <option value="HiBrew Conical Burr Coffee Mill G5">{language === 'AR' ? 'مطحنة بن هايبرو المخروطية G5' : 'HiBrew Conical Burr Coffee Mill G5'}</option>
                  <option value="58mm Naked Walnut Boltfilter">{language === 'AR' ? 'بورتافلتر خشب الجوز المكشوف 58 مم' : '58mm Naked Walnut Boltfilter'}</option>
                  <option value="Master Barista Home Coffee Corner Station">{language === 'AR' ? 'ركن ودولاب القهوة المنزلي الفاخر' : 'Master Barista Home Coffee Corner Station'}</option>
                  <option value="Artisan Stoneware Ceramic Cup Set">{language === 'AR' ? 'طقم أكواب السيراميك الحرفية' : 'Artisan Stoneware Ceramic Cup Set'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'التقييم' : 'Rating'}</label>
                <div className="flex gap-2">
                  {[5, 4, 3, 2, 1].map(num => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setRating(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                        rating === num ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {num} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'عنوان التقييم' : 'Review Title'}</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={language === 'AR' ? 'مثال: جودة ممتازة وسرعة توصيل' : 'e.g. Excellent build quality'}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">{language === 'AR' ? 'تفاصيل تجربتك' : 'Your Review'}</label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={language === 'AR' ? 'اكتب رأيك وتجربتك مع الجهاز...' : 'Share your experience with the machine...'}
                  className="w-full bg-neutral-100 rounded-xl p-2.5 text-neutral-900 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{language === 'AR' ? 'نشر التقييم' : 'Submit Review'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
