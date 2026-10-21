import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  MessageCircle,
  Phone,
  CheckCircle2,
  MapPin,
  Calendar,
  CreditCard,
  RotateCcw,
  Sparkles,
  Search,
  ExternalLink,
  ChevronDown,
  Copy,
  Check,
  FileText,
  Building,
  Navigation,
  Send,
  Lock,
  Gift,
  HelpCircle,
  Package,
  User,
  Flower2,
  Zap,
  Trash2,
} from 'lucide-react';
import { useTenant } from '../../../../context/TenantContext';

interface BuilderPageProps {
  isAr: boolean;
  money: (amount: number) => string;
  onNavigateHome: () => void;
  onNavigatePage: (page: string) => void;
  isMobile?: boolean;
}

function useBuilderStoreContext(isAr: boolean) {
  const tenant = useTenant();
  const activeStore = tenant?.activeStore;
  const currentProducts = tenant?.currentProducts || [];
  const currentOrders = tenant?.currentOrders || [];

  const isCoffee = activeStore?.id === 'store-coffee' || Boolean(activeStore?.category && activeStore.category.includes('قهوة'));
  const isAuto = activeStore?.id === 'store-transport' || Boolean(activeStore?.category && (activeStore.category.includes('سيار') || activeStore.category.includes('نقل')));

  const storeName = isAr
    ? (activeStore?.nameAr || activeStore?.name || (isCoffee ? 'محمصة القهوة المختصة' : isAuto ? 'نقليات ومعدات الجزيرة' : 'هدايا مكة'))
    : (activeStore?.nameEn || activeStore?.name || (isCoffee ? 'Specialty Coffee Roasters' : isAuto ? 'Saudia Transport Logistics' : 'Hadaya Flowers & Gifts'));

  const primaryProduct = currentProducts[0] || null;
  const secondaryProduct = currentProducts[1] || null;

  return {
    activeStore,
    currentProducts,
    currentOrders,
    isCoffee,
    isAuto,
    storeName,
    primaryProduct,
    secondaryProduct,
  };
}

// =========================================================================
// 1. LUXURY SINGLE PRODUCT PAGE
// =========================================================================
export const BuilderProductPage: React.FC<BuilderPageProps> = ({
  isAr,
  money,
  onNavigateHome,
  onNavigatePage,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, primaryProduct } = useBuilderStoreContext(isAr);

  const [selectedSize, setSelectedSize] = useState('24');
  const [selectedVase, setSelectedVase] = useState('crystal');
  const [activeTab, setActiveTab] = useState<'desc' | 'care' | 'reviews'>('desc');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const images = useMemo(() => {
    if (primaryProduct?.images && primaryProduct.images.length > 0) return primaryProduct.images;
    if (primaryProduct?.image) return [primaryProduct.image];
    if (isCoffee) {
      return [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=80',
      ];
    }
    if (isAuto) {
      return [
        'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
      ];
    }
    return [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1000&q=80',
    ];
  }, [primaryProduct, isCoffee, isAuto]);

  const handleAdd = () => {
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const defaultPrice = primaryProduct?.price || (isCoffee ? 85 : isAuto ? 1500 : 490);
  const basePrice = selectedSize === '12' ? Math.round(defaultPrice * 0.75) : selectedSize === '24' ? defaultPrice : Math.round(defaultPrice * 1.4);
  const vaseExtra = selectedVase === 'crystal' ? (isCoffee ? 25 : isAuto ? 100 : 90) : 0;
  const totalPrice = basePrice + vaseExtra;

  const categoryTitle = isAr
    ? (primaryProduct?.category || (isCoffee ? 'محاصيل القهوة المختصة' : isAuto ? 'خدمات النقل والأساطيل' : 'الباقات الفاخرة'))
    : (primaryProduct?.categoryEn || primaryProduct?.category || (isCoffee ? 'Specialty Coffee Beans' : isAuto ? 'Fleet & Logistics' : 'Luxury Bouquets'));

  const productTitle = isAr
    ? (primaryProduct?.name || (isCoffee ? 'محصول سلفادور سانتا لوسيا كلاسيك' : isAuto ? 'شاحنة مرسيدس أكتروس للنقل الثقيل' : 'حامل ورود حمراء مخملية ملكية'))
    : (primaryProduct?.nameEn || primaryProduct?.name || (isCoffee ? 'El Salvador Santa Lucia Specialty' : isAuto ? 'Mercedes Actros Heavy Truck' : 'Royal Velvet Red Roses Stand'));

  const productDesc = isAr
    ? (primaryProduct?.description || (isCoffee ? 'محصول بن مختص فاخر طازج التحميص بإيحاءات الفواكه والكراميل والشوكولاتة الداكنة.' : isAuto ? 'مقطورة شحن وأسطول نقل معتمد بأعلى معايير السلامة والتتبع اللحظي عبر الأقمار الصناعية.' : 'تنسيق ملكي مجهز يدوياً من أرقى الورود الجورية المنتقاة بعناية للمناسبات الراقية.'))
    : (primaryProduct?.descriptionEn || primaryProduct?.description || (isCoffee ? 'Fresh roasted single-origin specialty coffee beans featuring notes of sweet fruit, caramel, and chocolate.' : isAuto ? 'Heavy-duty certified cargo fleet equipped with real-time satellite tracking and safety systems.' : 'Hand-curated floral masterpiece featuring imported velvety roses crafted for luxury gifting.'));

  const featureTag = isCoffee
    ? (isAr ? 'بن مختص ١٠٠٪ أرابيكا' : '100% Specialty Arabica')
    : isAuto
    ? (isAr ? 'أسطول معتمد ومفحوص' : 'Certified Safe Fleet')
    : (isAr ? 'ورد طبيعي ١٠٠٪ طازج' : '100% Fresh Blooms');

  return (
    <div className={`space-y-8 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={onNavigateHome} className="hover:text-indigo-600 font-medium cursor-pointer">
          {isAr ? 'الرئيسية' : 'Home'}
        </button>
        <span>/</span>
        <button onClick={() => onNavigatePage('home')} className="hover:text-indigo-600 font-medium cursor-pointer">
          {categoryTitle}
        </button>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate">
          {productTitle}
        </span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Gallery */}
        <div className={isMobile ? 'col-span-1' : 'lg:col-span-6 space-y-3'}>
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md aspect-square bg-slate-50">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={productTitle}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <span className="absolute top-4 start-4 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-md">
              {isAr ? 'عرض حصري' : 'Special Offer'}
            </span>
            <span className="absolute top-4 end-4 px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{featureTag}</span>
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-18 h-18 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImageIndex === idx
                      ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                      : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div className={isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-6 space-y-5'}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>4.9 (124 {isAr ? 'تقييم موثق' : 'verified reviews'})</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isAr ? 'متوفر للتوصيل الفوري' : 'In Stock · Fast Dispatch'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {productTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {productDesc}
            </p>
          </div>

          {/* Pricing */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-black text-indigo-700">{money(totalPrice)}</span>
              <span className="text-sm text-slate-400 line-through">{money(totalPrice + 120)}</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {isAr ? 'شامل الضريبة ١٥٪' : 'Includes 15% VAT'}
            </span>
          </div>

          {/* Variations: Number of Stems */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 flex justify-between">
              <span>{isAr ? 'عدد الورود (الحجم):' : 'Bouquet Size (Stems):'}</span>
              <span className="text-indigo-600 font-extrabold">{selectedSize} {isAr ? 'وردة' : 'Roses'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: '12', labelAr: '١٢ وردة كلاسيك', labelEn: '12 Roses', delta: '350 ر.س' },
                { id: '24', labelAr: '٢٤ وردة فاخرة', labelEn: '24 Roses VIP', delta: '490 ر.س' },
                { id: '36', labelAr: '٣٦ وردة ملكية', labelEn: '36 Royal', delta: '680 ر.س' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    selectedSize === s.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>{isAr ? s.labelAr : s.labelEn}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.delta}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Variations: Vase Option */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              {isAr ? 'نوع التغليف أو الفازة:' : 'Packaging / Vase:'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setSelectedVase('standard')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedVase === 'standard'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {isAr ? 'تغليف مخملي فاخر (مشمول)' : 'Luxury Velvet Wrap (Included)'}
              </button>
              <button
                onClick={() => setSelectedVase('crystal')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedVase === 'crystal'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-200'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {isAr ? 'فازة كريستال إيطالية (+90 ر.س)' : 'Italian Crystal Vase (+90 SAR)'}
              </button>
            </div>
          </div>

          {/* Express Delivery Promise Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {isAr ? 'توصيل مبرد سريع خلال ٦٠ دقيقة في مكة المكرمة' : 'Chilled Express 60-Minute Delivery in Makkah'}
              </span>
              <span className="text-[11px] opacity-85 block">
                {isAr
                  ? 'اطلب قبل ٠٩:٠٠ م ليصلك اليوم لجميع الفنادق المركزية، برج الساعة، العزيزية، والشوقية.'
                  : 'Order before 9:00 PM for same-day delivery to central hotels, Clock Towers, and all districts.'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleAdd}
              className={`w-full py-3.5 rounded-2xl font-black text-sm text-white shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                addedSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01]'
              }`}
            >
              {addedSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isAr ? 'تمت الإضافة للسلة بنجاح!' : 'Added to Cart Successfully!'}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>{isAr ? 'أضف إلى السلة' : 'Add to Bag'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                    {money(totalPrice)}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigatePage('checkout')}
              className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'شراء فوري عبر مدى / أبل باي' : 'Express 1-Click Checkout'}</span>
            </button>

            <a
              href="https://wa.me/966504428819?text=السلام%20عليكم%20أرغب%20في%20طلب%20حامل%20الورود%20المخملية"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-2xl font-bold text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'طلب مباشر عبر واتساب المتجر' : 'Instant WhatsApp Order'}</span>
            </a>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-[11px] text-slate-600 font-semibold">
            <div className="flex flex-col items-center gap-1 p-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'سيارات مبردة' : 'Chilled Vans'}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'ضمان نضارة ٧ أيام' : '7-Day Freshness'}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'استبدال مجاني' : 'Easy Exchange'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description, Care, Reviews */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 cursor-pointer transition-colors ${
              activeTab === 'desc'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isAr ? 'تفاصيل التنسيق والمحتوى' : 'Description & Details'}
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`pb-3 cursor-pointer transition-colors ${
              activeTab === 'care'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isAr ? 'نصائح العناية بالورد' : 'Floral Care Instructions'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 cursor-pointer transition-colors ${
              activeTab === 'reviews'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {isAr ? 'آراء ضيوف المتجر (١٢٤)' : 'Customer Reviews (124)'}
          </button>
        </div>

        {activeTab === 'desc' && (
          <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
            <p>
              {isAr
                ? 'تم تصميم هذه الباقة الملكية في ورشاتنا المركزية بمكة المكرمة بأيدي منسقي زهور معتمدين. نستخدم حصرياً جوري إكوادوري أحمر طبيعي مقطوف طازجاً، يتم حفظه في درجات حرارة مثالية لضمان استمراره في كامل رونقه وعطره لعدة أيام داخل غرفتك أو فندقك.'
                : 'Hand-assembled by master florists at our central Makkah boutique using authentic Ecuadorian long-stem roses kept in strictly climate-controlled chambers for peak vitality.'}
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
              <li>{isAr ? 'نوع الورد: جوري إكوادوري فئة أولى (Premium Grade A)' : 'Floral Grade: Premium Grade A Ecuadorian Roses'}</li>
              <li>{isAr ? 'الارتفاع التقريبي: ٥٥ سم · العرض: ٤٠ سم' : 'Approx Dimensions: 55cm Height · 40cm Width'}</li>
              <li>{isAr ? 'الملحقات: بطاقة إهداء فاخرة + مغذي زهور هولندي مجاني' : 'Includes: Luxury gold-foil gift card & Dutch flower food'}</li>
            </ul>
          </div>
        )}

        {activeTab === 'care' && (
          <div className="text-xs sm:text-sm text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">{isAr ? 'إرشادات الحفاظ على نضارة الورد:' : 'To extend freshness:'}</p>
            <p>1. {isAr ? 'قص أطراف السيقان بزاوية ٤٥ درجة قبل وضعها في ماء بارد ونظيف.' : 'Trim stems at a 45° angle before placing in cool fresh water.'}</p>
            <p>2. {isAr ? 'تجنب وضع الباقة تحت تيار هواء التكييف المباشر أو أشعة الشمس القوية.' : 'Keep away from direct air conditioning vents and sunlight.'}</p>
            <p>3. {isAr ? 'استبدال الماء كل يومين وإضافة كيس المغذي المرفق.' : 'Change water every 2 days and dissolve the provided nutrients.'}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {[
              {
                name: 'سلطان بن عبدالله - فندق فيرمونت برج الساعة',
                date: 'أمس',
                rating: 5,
                comment: 'تنسيق في منتهى الفخامة، وصل الفندق خلال ٤٠ دقيقة فقط والورد بارد ونضر جداً، شكراً لفريق العمل الرائع.',
              },
              {
                name: 'د. منيرة القحطاني - جبل عمر',
                date: 'قبل ٣ أيام',
                rating: 5,
                comment: 'أجمل باقة طلبتها في مكة بدون مبالغة، رائحة الجوري منعشة وطريقة التقديم تبيض الوجه.',
              },
            ].map((rev, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rev.name}</span>
                  <span className="text-slate-400 text-[10px]">{rev.date}</span>
                </div>
                <div className="flex text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600">{rev.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// 2. MODERN CART PAGE / DRAWER
// =========================================================================
export const BuilderCartPage: React.FC<BuilderPageProps> = ({
  isAr,
  money,
  onNavigateHome,
  onNavigatePage,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, currentProducts } = useBuilderStoreContext(isAr);

  const initialItems = useMemo(() => {
    if (currentProducts.length > 0) {
      return currentProducts.slice(0, 2).map((p) => ({
        id: p.id,
        name: isAr ? p.name : (p.nameEn || p.name),
        price: p.price || 150,
        qty: 1,
        img: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        specs: isAr
          ? (isCoffee ? '٢٥٠ جرام · بن حبوب كاملة' : isAuto ? 'تأجير معتمد · شامل التأمين' : 'تغليف فاخر · بطاقة إهداء')
          : (isCoffee ? '250g · Whole Bean' : isAuto ? 'Certified · Full Insurance' : 'Luxury Wrap · Gift Card'),
      }));
    }
    return [
      {
        id: 'p1',
        name: isAr
          ? (isCoffee ? 'محصول بن كولومبي مختص' : isAuto ? 'خدمة نقل شحن لوجستي' : 'باقة زهور طبيعية فاخرة')
          : (isCoffee ? 'Colombian Specialty Coffee' : isAuto ? 'Logistics Transport Service' : 'Luxury Flower Bouquet'),
        price: isCoffee ? 95 : isAuto ? 1200 : 490,
        qty: 1,
        img: isCoffee
          ? 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80'
          : isAuto
          ? 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
        specs: isAr
          ? (isCoffee ? '٢٥٠ جرام' : isAuto ? 'شاحنة مجهزة' : '٢٤ وردة')
          : (isCoffee ? '250g' : isAuto ? 'Equipped Truck' : '24 Stems'),
      },
    ];
  }, [currentProducts, isAr, isCoffee, isAuto]);

  const [items, setItems] = useState(initialItems);
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [cardMessage, setCardMessage] = useState('');

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const discount = couponApplied ? 50 : 0;
  const vat = (subtotal - discount) * 0.15;
  const delivery = subtotal > 300 ? 0 : 35;
  const total = subtotal - discount + vat + delivery;

  return (
    <div className={`space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isAr ? 'سلة المشتريات' : 'Shopping Bag'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? `لديك (${items.length}) عناصر في سلتك` : `${items.length} items in your bag`}
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          {isAr ? '← متابعة التسوق' : '← Continue Shopping'}
        </button>
      </div>

      {/* Free Delivery Bar */}
      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isAr
              ? (isCoffee ? 'شحن سريع مجاني لطلبات البن والمعدات فوق ٢٠٠ ر.س' : isAuto ? 'تأكيد فوري للجدولة وبدء العمليات اللوجستية' : 'توصيل سريع وموثوق إلى باب موقعك')
              : (isCoffee ? 'Free fast shipping on coffee and gear orders above 200 SAR' : isAuto ? 'Instant scheduling and certified logistics dispatch' : 'Express delivery right to your location')}
          </span>
        </div>
        <span className="font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded-md text-[11px] shadow-2xs">
          {isAr ? 'مشمول' : 'Included'}
        </span>
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Items List */}
        <div className={isMobile ? 'col-span-1 space-y-3' : 'lg:col-span-8 space-y-4'}>
          {items.map((it) => (
            <div
              key={it.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-center gap-4"
            >
              <img
                src={it.img}
                alt={it.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-slate-100"
              />
              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="font-black text-xs sm:text-sm text-slate-900 truncate">{it.name}</h3>
                <p className="text-[11px] text-slate-400">{it.specs}</p>
                <div className="font-extrabold text-xs sm:text-sm text-indigo-700">{money(it.price)}</div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                  <button
                    onClick={() => updateQty(it.id, -1)}
                    className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black">{it.qty}</span>
                  <button
                    onClick={() => updateQty(it.id, 1)}
                    className="w-7 h-7 flex items-center justify-center font-bold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(it.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title={isAr ? 'حذف العنصر' : 'Remove item'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Complimentary Gift Card Input */}
          <div className="p-4 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/40 space-y-2.5">
            <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'كتابة رسالة إهداء مجانية على كرت فاخر مع الباقة:' : 'Complimentary luxury gift card message:'}</span>
            </label>
            <textarea
              rows={2}
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              placeholder={isAr ? 'مثال: أطيب التهاني بمناسبة قدومكم لمكة، حفظكم الله وسدد خطاكم...' : 'Example: May your visit to the Holy City be filled with peace and blessings...'}
              className="w-full p-2.5 rounded-xl border border-indigo-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Order Summary & Coupon */}
        <div className={isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-4 space-y-4'}>
          {/* Coupon Input */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-xs font-bold text-slate-800">{isAr ? 'كوبون الخصم:' : 'Promo / Coupon Code:'}</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isAr ? 'أدخل الكود (MAKKAH2026)' : 'Enter Code'}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs uppercase font-mono"
              />
              <button
                onClick={() => setCouponApplied(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'تطبيق' : 'Apply'}
              </button>
            </div>
            {couponApplied && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'تم تطبيق خصم ٥٠ ر.س بنجاح' : '50 SAR Discount Applied!'}</span>
              </span>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 text-xs">
            <h4 className="font-black text-sm text-slate-900">{isAr ? 'ملخص الفاتورة' : 'Order Breakdown'}</h4>
            <div className="space-y-2 border-b border-slate-200 pb-3">
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span>
                <span className="font-bold text-slate-900">{money(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>{isAr ? 'خصم الكوبون' : 'Coupon Discount'}</span>
                  <span>-{money(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'ضريبة القيمة المضافة (١٥٪)' : 'VAT (15%)'}</span>
                <span className="font-bold text-slate-900">{money(vat)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{isAr ? 'التوصيل المبرد في مكة' : 'Chilled Express Delivery'}</span>
                <span>{delivery === 0 ? (isAr ? 'مجاني' : 'FREE') : money(delivery)}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900 pt-1">
              <span>{isAr ? 'المجموع الإجمالي' : 'Grand Total'}</span>
              <span className="text-indigo-600">{money(total)}</span>
            </div>

            <button
              onClick={() => onNavigatePage('checkout')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isAr ? 'المتابعة للدفع السريع' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. SAUDI 1-PAGE EXPRESS CHECKOUT & ZATCA TAX COMPLIANCE
// =========================================================================
export const BuilderCheckoutPage: React.FC<BuilderPageProps> = ({
  isAr,
  money,
  onNavigateHome,
  onNavigatePage,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, primaryProduct, secondaryProduct } = useBuilderStoreContext(isAr);
  const [payment, setPayment] = useState<'mada' | 'apple' | 'tabby' | 'cod'>('mada');

  const item1Name = isAr
    ? (primaryProduct?.name || (isCoffee ? 'محصول بن مختص' : isAuto ? 'خدمة نقل أسطول' : 'باقة زهور فاخرة'))
    : (primaryProduct?.nameEn || primaryProduct?.name || (isCoffee ? 'Specialty Coffee' : isAuto ? 'Fleet Transport' : 'Luxury Bouquet'));
  const item1Price = primaryProduct?.price || (isCoffee ? 95 : isAuto ? 1200 : 490);

  const item2Name = isAr
    ? (secondaryProduct?.name || (isCoffee ? 'فلاتر ترشيح V60' : isAuto ? 'تأمين أسطول إضافي' : 'بوكس شوكولاتة فاخر'))
    : (secondaryProduct?.nameEn || secondaryProduct?.name || (isCoffee ? 'V60 Paper Filters' : isAuto ? 'Cargo Insurance' : 'Luxury Chocolate Box'));
  const item2Price = secondaryProduct?.price || (isCoffee ? 35 : isAuto ? 250 : 180);

  const subtotal = item1Price + item2Price;
  const vat = subtotal * 0.15;
  const grandTotal = subtotal + vat;

  return (
    <div className={`space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isAr ? 'الدفع السريع المعتمد (مدى · أبل باي · تمارا)' : 'Saudi Express Checkout & ZATCA Invoice'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr ? 'دفع آمن ومشفر متوافق مع هيئة الزكاة والضريبة والجمارك' : 'Encrypted 256-bit checkout compliant with ZATCA KSA standards'}
          </p>
        </div>
        <button
          onClick={() => onNavigatePage('cart')}
          className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
        >
          {isAr ? '← العودة للسلة' : '← Back to Cart'}
        </button>
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
        {/* Left Form: Address & Payment */}
        <div className={isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-8 space-y-5'}>
          {/* Saudi National Address Section */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-2xs">
            <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'العنوان الوطني وبيانات التوصيل' : 'National Address & Delivery Details'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'الاسم الكامل للعميل / المستلم:' : 'Recipient Full Name:'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'الاسم الكامل للعميل / المستلم' : 'Recipient Full Name'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'رقم الجوال السعودي للتواصل وتتبع السائق:' : 'Saudi Mobile (WhatsApp / Driver GPS):'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? '05xxxxxxxx' : '+966 5xxxxxxxx'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'المدينة والحي:' : 'City & District:'}
                </label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600">
                  <option>{isAr ? 'الرياض - حي النرجس / العليا' : 'Riyadh - Al Narjis / Olaya'}</option>
                  <option>{isAr ? 'جدة - حي الروضة / الشاطئ' : 'Jeddah - Al Rawdah / Al Shati'}</option>
                  <option>{isAr ? 'مكة المكرمة - العزيزية / الشوقية' : 'Makkah - Al Aziziyah / Al Shawqiyyah'}</option>
                  <option>{isAr ? 'الدمام والخبر - الشاطئ' : 'Dammam & Khobar'}</option>
                  <option>{isAr ? 'المدينة المنورة - قباء' : 'Madinah - Quba'}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم المبنى / الشارع / رقم الوحدة:' : 'Building / Street / Unit:'}
                </label>
                <input
                  type="text"
                  placeholder={isAr ? 'اسم المبنى أو رقم الوحدة' : 'Building or Unit Number'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Time slot */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {isAr ? 'الموعد المفضل للتسليم:' : 'Preferred Delivery Window:'}
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  className="p-2 rounded-xl border border-indigo-600 bg-indigo-50 font-bold text-indigo-900 text-center cursor-pointer"
                >
                  {isAr ? 'فوري وسريع' : 'Express'}
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-center cursor-pointer"
                >
                  {isAr ? 'مساءً (٦:٠٠ - ٩:٠٠ م)' : 'Evening (6-9 PM)'}
                </button>
                <button
                  type="button"
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-center cursor-pointer"
                >
                  {isAr ? 'صباح الغد' : 'Tomorrow Morning'}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3.5 shadow-2xs">
            <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'طرق الدفع الإلكتروني المعتمدة بالسعودية' : 'Approved Saudi Payment Gateways'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { id: 'mada' as const, label: 'مدى Mada', badge: '0% رسوم' },
                { id: 'apple' as const, label: 'Apple Pay', badge: '١-كليك' },
                { id: 'tabby' as const, label: 'تمارا / تابي', badge: '٤ دفعات' },
                { id: 'cod' as const, label: isAr ? 'عند الاستلام' : 'Cash on Delivery', badge: 'COD' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPayment(p.id)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    payment === p.id
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-2 ring-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="font-black">{p.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.badge}</div>
                </button>
              ))}
            </div>

            {payment === 'mada' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder={isAr ? 'رقم بطاقة مدى (16 رقم)' : 'Mada Card Number'}
                  defaultValue="4000 1234 5678 9010"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="12/28"
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="123"
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Summary */}
        <div className={isMobile ? 'col-span-1 space-y-4' : 'lg:col-span-4 space-y-4'}>
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4 text-xs">
            <h4 className="font-black text-sm text-slate-900 flex items-center justify-between">
              <span>{isAr ? 'ملخص الطلب والفاتورة' : 'Order & Invoice'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                #ORD-{Date.now().toString().slice(-4)}
              </span>
            </h4>

            <div className="space-y-2 text-slate-600 border-b border-slate-200 pb-3">
              <div className="flex justify-between">
                <span>{item1Name}</span>
                <span className="font-bold text-slate-900">{money(item1Price)}</span>
              </div>
              <div className="flex justify-between">
                <span>{item2Name}</span>
                <span className="font-bold text-slate-900">{money(item2Price)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? 'ضريبة القيمة المضافة (١٥٪)' : 'VAT (15%)'}</span>
                <span className="font-bold text-slate-900">{money(vat)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>{isAr ? 'الشحن والتوصيل' : 'Shipping'}</span>
                <span>{isAr ? 'مجاني' : 'FREE'}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-black text-slate-900">
              <span>{isAr ? 'المجموع النهائي' : 'Total Amount'}</span>
              <span className="text-indigo-600">{money(grandTotal)}</span>
            </div>

            <button
              onClick={() => onNavigatePage('thankyou')}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-indigo-200" />
              <span>{isAr ? 'تأكيد ودفع الطلب فوراً' : 'Confirm & Pay Now'}</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isAr ? 'حماية مشفرة ومعتمد من البنك المركزي السعودي SAMA' : 'SAMA certified & encrypted gateway'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. ORDER CONFIRMATION & LIVE TRACKING THANK YOU PAGE
// =========================================================================
export const BuilderThankYouPage: React.FC<BuilderPageProps> = ({
  isAr,
  money,
  onNavigateHome,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, storeName } = useBuilderStoreContext(isAr);

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {isAr ? 'تم استلام وتأكيد طلبك بنجاح!' : 'Order Placed & Confirmed Successfully!'}
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isAr
            ? `شكراً لاختيارك ${storeName}. تم إصدار فاتورة زاتكا الضريبية وتجهيز طلبك بأعلى معايير الإتقان.`
            : `Thank you for choosing ${storeName}. Your official ZATCA tax invoice is ready and your order is confirmed.`}
        </p>
      </div>

      {/* Live Order GPS Simulation Box */}
      <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-slate-400 text-[10px] block">{isAr ? 'رقم الطلب' : 'Order ID'}</span>
            <span className="font-mono font-black text-sm text-slate-900">#ORD-{Date.now().toString().slice(-4)}</span>
          </div>
          <div className="text-end">
            <span className="text-slate-400 text-[10px] block">{isAr ? 'الوقت المتوقع للتسليم' : 'Estimated Arrival'}</span>
            <span className="font-extrabold text-sm text-emerald-600">
              {isAr ? 'اليوم خلال ٣٥ دقيقة' : 'Today within 35 mins'}
            </span>
          </div>
        </div>

        {/* 4-Stage Progress Timeline */}
        <div className="space-y-3 py-2">
          <span className="font-bold text-slate-800 block">{isAr ? 'حالة الشحنة المباشرة:' : 'Live Shipment Status:'}</span>
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-emerald-700">{isAr ? 'تم التأكيد' : 'Confirmed'}</span>
            </div>
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-emerald-700">
                {isAr ? (isCoffee ? 'تحميص وتجهيز' : isAuto ? 'تجهيز الأسطول' : 'تجهيز الطلب') : (isCoffee ? 'Roasting' : isAuto ? 'Fleet Prep' : 'Preparing')}
              </span>
            </div>
            <div className="space-y-1">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto text-xs animate-pulse">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="text-indigo-700 font-black">
                {isAr ? (isAuto ? 'جاري التنفيذ' : 'مع المندوب') : 'Dispatched'}
              </span>
            </div>
            <div className="space-y-1 opacity-40">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto text-xs font-mono">4</div>
              <span>{isAr ? 'تم التسليم' : 'Delivered'}</span>
            </div>
          </div>
        </div>

        {/* Driver Details */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <span className="font-black text-slate-900 block">{isAr ? 'مندوب التوصيل المعتمد' : 'Certified Dispatcher'}</span>
              <span className="text-[11px] text-slate-500 block">{storeName}</span>
            </div>
          </div>
          <a
            href={`tel:${activeStore?.contactPhone || '+966559876543'}`}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-emerald-700 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{isAr ? 'اتصال بالدعم' : 'Call Support'}</span>
          </a>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onNavigateHome}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          {isAr ? `العودة لـ ${storeName}` : `Back to ${storeName}`}
        </button>
      </div>
    </div>
  );
};

// =========================================================================
// 5. LUXURY ABOUT US PAGE
// =========================================================================
export const BuilderAboutPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, storeName } = useBuilderStoreContext(isAr);

  const heroSub = isCoffee
    ? (isAr ? 'قصة شغف بالبن المختص وطرق التحميص الاحترافية' : 'Our Passion for Specialty Coffee Roasting')
    : isAuto
    ? (isAr ? 'ريادة في النقل اللوجستي وتجهيز الأساطيل بالمملكة' : 'Pioneering Transport & Fleet Solutions in Saudi Arabia')
    : (isAr ? 'عراقة وفخامة الهدايا والزهور الطبيعية' : 'Heritage of Curated Luxury & Elegant Gifting');

  const heroStory = isCoffee
    ? (isAr ? 'نختار بعناية أجود محاصيل البن من مرتفعات إثيوبيا، كولومبيا، والبرازيل، ونحمصها بملامح حرارية دقيقة لتمنحك تجربة قهوة فاخرة لا مثيل لها.' : 'We meticulously source the finest beans from top estates worldwide and roast with precision profiles to deliver unmatched flavor notes.')
    : isAuto
    ? (isAr ? 'نقدم حلولاً لوجستية ونقلاً معتمداً بأحدث معايير السلامة والتتبع الحي للشركات والأفراد على امتداد طرق المملكة.' : 'We provide premier transport, logistics, and heavy fleet solutions with 24/7 reliability across Saudi Arabia.')
    : (isAr ? 'نقدم أرقى التنسيقات الفاخرة لعملائنا لنوثق أجمل اللحظات والمناسبات بأعلى معايير الإتقان والسرعة.' : 'Crafting bespoke luxury arrangements and hampers with uncompromising attention to detail and rapid dispatch.');

  return (
    <div className={`max-w-4xl mx-auto space-y-10 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="text-center space-y-3">
        <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
          {storeName}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {heroSub}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {heroStory}
        </p>
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            icon: ShieldCheck,
            iconColor: 'text-rose-500 bg-rose-50',
            titleAr: 'أصالة وجودة معتمدة',
            titleEn: '100% Certified Quality',
            descAr: 'منتجات ومحاصيل وخدمات أصلية متوافقة مع أعلى معايير الجودة والمواصفات القياسية.',
            descEn: 'Authentic products and certified services compliant with the highest industry standards.',
          },
          {
            icon: Zap,
            iconColor: 'text-amber-500 bg-amber-50',
            titleAr: 'سرعة ودقة في التنفيذ',
            titleEn: 'Rapid & Reliable Fulfillment',
            descAr: 'معالجة فورية وتجهيز احترافي لضمان وصول طلبك في الوقت المحدد بأقصى سرعة.',
            descEn: 'Immediate processing and swift fulfillment ensuring prompt delivery to your location.',
          },
          {
            icon: MapPin,
            iconColor: 'text-emerald-500 bg-emerald-50',
            titleAr: 'تغطية واسعة لكافة المناطق',
            titleEn: 'Kingdom-Wide Coverage',
            descAr: 'شبكة شحن وتوصيل تغطي المدن الرئيسية مع تتبع لحظي مباشر للشحنة.',
            descEn: 'Extensive delivery network covering major cities with live dispatch tracking.',
          },
          {
            icon: Sparkles,
            iconColor: 'text-indigo-500 bg-indigo-50',
            titleAr: 'خدمة عملاء على مدار الساعة',
            titleEn: '24/7 Dedicated Support',
            descAr: 'فريق دعم محترف جاهز لخدمتكم ومساعدتكم عبر الواتساب والمكالمات في أي وقت.',
            descEn: 'Dedicated customer care available around the clock via WhatsApp and phone.',
          },
        ].map((pillar, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 flex gap-3 text-xs">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pillar.iconColor}`}>
              <pillar.icon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">{isAr ? pillar.titleAr : pillar.titleEn}</h4>
              <p className="text-slate-500 leading-relaxed text-[11px]">{isAr ? pillar.descAr : pillar.descEn}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Numbers */}
      <div className="p-6 rounded-3xl bg-indigo-900 text-white grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div>
          <span className="text-2xl sm:text-3xl font-black block">15,000+</span>
          <span className="text-[11px] text-indigo-200">{isAr ? 'طلبية موثقة' : 'Happy Orders'}</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black block">50+</span>
          <span className="text-[11px] text-indigo-200">{isAr ? 'فندق نخدمه يومياً' : 'Partner Hotels'}</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black block">60 دقيقة</span>
          <span className="text-[11px] text-indigo-200">{isAr ? 'متوسط سرعة التوصيل' : 'Avg Delivery Time'}</span>
        </div>
        <div>
          <span className="text-2xl sm:text-3xl font-black block">4.9 / 5.0</span>
          <span className="text-[11px] text-indigo-200">{isAr ? 'تقييم رضا العملاء' : 'Customer Rating'}</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 6. CONTACT US & HARAM HOTLINE PAGE
// =========================================================================
export const BuilderContactPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const { activeStore, storeName } = useBuilderStoreContext(isAr);
  const [sent, setSent] = useState(false);
  const phone = activeStore?.contactPhone || '+966 50 123 4567';
  const locationText = isAr
    ? (activeStore?.domain || 'المملكة العربية السعودية')
    : (activeStore?.domain || 'Saudi Arabia');

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {isAr ? `تواصل مع فريق خدمة عملاء ${storeName}` : `Contact ${storeName} Concierge`}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr ? 'فريقنا متواجد على مدار الساعة لخدمة طلباتكم والإجابة على استفساراتكم' : 'Our team is available 24/7 to assist with your orders and inquiries'}
        </p>
      </div>

      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`}>
        {/* Contact Info Cards */}
        <div className={isMobile ? 'col-span-1 space-y-3' : 'md:col-span-5 space-y-3'}>
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1 text-xs">
            <span className="text-indigo-600 font-black flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span>{isAr ? 'الهاتف المباشر:' : 'Direct Phone:'}</span>
            </span>
            <p className="font-mono font-bold text-slate-900 text-sm" dir="ltr">{phone}</p>
            <p className="text-slate-400 text-[10px]">{isAr ? 'متاح من ٨ ص حتى ١٢ ليلاً' : 'Available 8 AM - Midnight'}</p>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 space-y-1 text-xs">
            <span className="text-emerald-700 font-black flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              <span>{isAr ? 'واتساب الدعم السريع:' : 'Express WhatsApp:'}</span>
            </span>
            <p className="font-mono font-bold text-emerald-900 text-sm" dir="ltr">{phone}</p>
            <p className="text-emerald-700 text-[10px]">{isAr ? 'رد فوري ومباشر' : 'Instant response'}</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1 text-xs">
            <span className="text-slate-700 font-black flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'المقر والنطاق:' : 'Hub & Coverage:'}</span>
            </span>
            <p className="text-slate-900 font-bold">
              {locationText}
            </p>
          </div>
        </div>

        {/* Message Form */}
        <div className={isMobile ? 'col-span-1' : 'md:col-span-7'}>
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4 text-xs">
            <h3 className="font-black text-sm text-slate-900">
              {isAr ? 'أرسل استفسارك وسنعاود الاتصال بك' : 'Send Inquiry or Request'}
            </h3>

            {sent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{isAr ? 'تم إرسال رسالتك بنجاح! سيتواصل معك فريقنا قريباً.' : 'Message received! Our team will reach out shortly.'}</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">{isAr ? 'الاسم:' : 'Name:'}</label>
                    <input
                      required
                      type="text"
                      placeholder={isAr ? 'اسمك الكريم' : 'Your Name'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">{isAr ? 'الجوال:' : 'Phone:'}</label>
                    <input
                      required
                      type="text"
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">{isAr ? 'تفاصيل الطلب:' : 'Details:'}</label>
                  <textarea
                    required
                    rows={3}
                    placeholder={isAr ? 'اكتب تفاصيل طلبك أو استفسارك...' : 'Describe your inquiry...'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 rtl:-scale-x-100" />
                  <span>{isAr ? 'إرسال الرسالة' : 'Send Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 7. STORE LOCATOR & BRANCHES PAGE
// =========================================================================
export const BuilderStoreLocatorPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const branches = [
    {
      nameAr: 'بوتيك العزيزية الرئيسي (Flagship)',
      nameEn: 'Al-Aziziyah Flagship Boutique',
      locationAr: 'مكة المكرمة · طريق المسجد الحرام · بجوار بن داود',
      locationEn: 'Al Masjid Al Haram Road, next to BinDawood',
      hoursAr: 'يومياً: ٠٨:٠٠ ص - ٠١:٠٠ ليلاً',
      hoursEn: 'Daily: 8:00 AM - 1:00 AM',
      phone: '+966 12 555 8920',
      tag: isAr ? 'المقر الرئيسي والورش المركزية' : 'Headquarters & Atelier',
    },
    {
      nameAr: 'فرع برج الساعة وفنادق الحرم (Clock Tower)',
      nameEn: 'Clock Tower & Central Haram Branch',
      locationAr: 'مجمع أبراج البيت · الدور التجاري الثالث',
      locationEn: 'Abraj Al-Bait Complex · Level 3 Mall',
      hoursAr: 'على مدار الساعة ٢٤/٧ في المواسم',
      hoursEn: '24/7 during seasons & prayer times',
      phone: '+966 50 442 8819',
      tag: isAr ? 'خدمة النزلاء وفنادق المركزية' : 'Hotel Guests Concierge',
    },
    {
      nameAr: 'فرع جبل عمر (Jabal Omar Branch)',
      nameEn: 'Jabal Omar Luxury Boutique',
      locationAr: 'شارع إبراهيم الخليل · ممشى جبل عمر التجاري',
      locationEn: 'Ibrahim Al Khalil Street · Jabal Omar Galleria',
      hoursAr: 'يومياً: ٠٩:٠٠ ص - ١٢:٠٠ ليلاً',
      hoursEn: 'Daily: 9:00 AM - Midnight',
      phone: '+966 55 987 6543',
      tag: isAr ? 'باقات فورية سريعة' : 'Instant Grab & Go Bouquets',
    },
  ];

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          {isAr ? 'فروعنا ونقاط التوزيع بمكة المكرمة' : 'Makkah Branches & Boutiques'}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr ? 'تفضل بزيارتنا أو اطلب توصيلاً مبرداً سريعاً لأي موقع بمكة' : 'Visit our stores or order express delivery to any location in Makkah'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map((b, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                {b.tag}
              </span>
              <h3 className="font-black text-sm text-slate-900">{isAr ? b.nameAr : b.nameEn}</h3>
              <p className="text-xs text-slate-500 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{isAr ? b.locationAr : b.locationEn}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{isAr ? b.hoursAr : b.hoursEn}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <a
                href={`tel:${b.phone}`}
                className="text-xs font-bold text-slate-700 hover:text-indigo-600 flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span dir="ltr">{b.phone}</span>
              </a>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] cursor-pointer"
              >
                {isAr ? 'اتجاهات الخريطة' : 'Directions'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Map Simulation Container */}
      <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-100 h-64 relative flex items-center justify-center text-center p-6 shadow-xs">
        <div className="space-y-2">
          <Navigation className="w-8 h-8 text-indigo-600 mx-auto animate-bounce" />
          <h4 className="font-black text-sm text-slate-900">
            {isAr ? 'تغطية مكة المكرمة وضواحيها بالكامل' : 'Full Makkah & Central Zone Coverage'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAr
              ? 'توصيل مبرد سريع لجميع الفنادق والعمائر والمستشفيات بمكة المكرمة خلال ٦٠ دقيقة.'
              : 'Refrigerated delivery across all Haram hotels, residences, and hospitals within 60 mins.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 8. ORDER TRACKING PAGE
// =========================================================================
export const BuilderTrackOrderPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const { activeStore, isCoffee, isAuto, storeName, currentOrders } = useBuilderStoreContext(isAr);
  const sampleOrderNumber = currentOrders?.[0]?.orderNumber || currentOrders?.[0]?.id || 'ORD-2026-1001';
  const [orderId, setOrderId] = useState(sampleOrderNumber);
  const [searched, setSearched] = useState(true);

  return (
    <div className={`max-w-2xl mx-auto space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">
          {isAr ? `تتبع مسار طلبك المباشر - ${storeName}` : `Live Order Tracker - ${storeName}`}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr ? 'أدخل رقم طلبك للاطلاع على خط سير الشحنة المباشر' : 'Enter order number or phone to view live driver ETA'}
        </p>
      </div>

      {/* Input */}
      <div className="p-2 rounded-2xl border border-slate-200 bg-white shadow-xs flex gap-2">
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder={isAr ? 'رقم الطلب (مثال: ORD-2026-1001)' : 'Order Number'}
          className="flex-1 px-3 py-2 text-xs font-mono uppercase focus:outline-none"
        />
        <button
          onClick={() => setSearched(true)}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
        >
          {isAr ? 'تتبع الآن' : 'Track'}
        </button>
      </div>

      {searched && (
        <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-6 text-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="font-mono font-black text-slate-900 text-sm">#{orderId}</span>
              <span className="text-[11px] text-slate-400 block">{storeName}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs">
              {isAr ? 'في الطريق مع السائق (٣٠ دقيقة)' : 'In Transit · 30 Mins'}
            </span>
          </div>

          {/* Stepper */}
          <div className="space-y-4">
            {[
              { titleAr: 'تم استلام وتأكيد الطلب', titleEn: 'Order Confirmed', time: '11:15 ص', done: true },
              {
                titleAr: isCoffee ? 'تحميص وتجهيز البن في المحمصة' : isAuto ? 'تجهيز وفحص الأسطول' : 'تجهيز وتغليف الطلب',
                titleEn: isCoffee ? 'Coffee Roasting & Packing' : isAuto ? 'Fleet Prep & Safety Check' : 'Order Assembly & Packing',
                time: '11:32 ص',
                done: true
              },
              {
                titleAr: isAuto ? 'جاري التنفيذ والتشغيل' : 'تم تسليم الشحنة لمندوب التوصيل',
                titleEn: isAuto ? 'Fleet In Transit' : 'Dispatched with Courier',
                time: '11:45 ص',
                current: true
              },
              { titleAr: 'التسليم لاستقبال أو عنوان العميل', titleEn: 'Delivered to Customer', time: 'متوقع 12:15 م', pending: true },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    step.done
                      ? 'bg-emerald-500 text-white'
                      : step.current
                        ? 'bg-indigo-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step.done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="flex-1">
                  <span className={`font-bold block ${step.current ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                    {isAr ? step.titleAr : step.titleEn}
                  </span>
                  <span className="text-[10px] text-slate-400">{step.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 9. PRIVACY POLICY PAGE (SAUDI PDPL COMPLIANT)
// =========================================================================
export const BuilderPrivacyPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const { storeName } = useBuilderStoreContext(isAr);

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="border-b pb-4 space-y-2">
        <h1 className="text-2xl font-black text-slate-900">
          {isAr ? `سياسة الخصوصية وسرية البيانات - ${storeName}` : `Privacy & Data Protection Policy - ${storeName}`}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr
            ? 'متوافقة مع نظام حماية البيانات الشخصية (PDPL) بالمملكة وهيئة الزكاة والضريبة والجمارك'
            : 'Compliant with KSA Personal Data Protection Law (PDPL) and ZATCA regulations'}
        </p>
      </div>

      <div className="text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '١. جمع البيانات واستخدامها:' : '1. Data Collection & Purpose:'}
          </h3>
          <p>
            {isAr
              ? `نقوم بجمع بيانات العميل الأساسية (الاسم، رقم الجوال، عنوان التوصيل) حصراً لغرض معالجة وتوصيل طلبات ${storeName}، وإصدار الفواتير الضريبية الإلكترونية المعتمدة.`
              : `We collect customer contact details solely for ${storeName} order fulfillment, dispatch, and official ZATCA tax invoice generation.`}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '٢. أمان المدفوعات والبطاقات:' : '2. Payment Security:'}
          </h3>
          <p>
            {isAr
              ? 'تتم جميع العمليات المالية عبر بوابات دفع وطنية معتمدة من البنك المركزي السعودي (مدى، أبل باي). لا يقوم المتجر بتخزين أرقام البطاقات الائتمانية أو رموز الأمان (CVV) على خوادمه نهائياً.'
              : 'All transactions are processed through SAMA-licensed gateways with 256-bit SSL encryption. We never store credit card or CVV details on our servers.'}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '٣. سرية معلومات العملاء:' : '3. Customer Information Confidentiality:'}
          </h3>
          <p>
            {isAr
              ? 'نلتزم بالسرية التامة لجميع بيانات واختيارات العميل ورسائله المرفقة، ولا تتم مشاركتها مع أي طرف ثالث غير معني بتنفيذ الطلب.'
              : 'All customer data and custom requests are strictly confidential and shared only with authorized fulfillment staff.'}
          </p>
        </section>
      </div>
    </div>
  );
};

// =========================================================================
// 10. RETURN & EXCHANGE POLICY PAGE
// =========================================================================
export const BuilderReturnPolicyPage: React.FC<BuilderPageProps> = ({
  isAr,
  onNavigateHome,
  isMobile,
}) => {
  const { activeStore, storeName } = useBuilderStoreContext(isAr);
  const contactPhone = activeStore?.contactPhone || '+966 50 123 4567';

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isMobile ? 'p-3' : 'p-6 sm:p-10'}`}>
      <div className="border-b pb-4 space-y-2">
        <h1 className="text-2xl font-black text-slate-900">
          {isAr ? `سياسة الاستبدال والاسترجاع وضمان الجودة - ${storeName}` : `Return & Quality Guarantee Policy - ${storeName}`}
        </h1>
        <p className="text-xs text-slate-500">
          {isAr
            ? `نضمن رضاكم التام عن كل منتج وخدمة تصلكم من ${storeName}`
            : `Our 100% satisfaction commitment for every order delivered by ${storeName}`}
        </p>
      </div>

      <div className="text-xs sm:text-sm text-slate-600 space-y-4 leading-relaxed">
        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '١. ضمان الجودة والاستبدال:' : '1. Quality & Replacement Guarantee:'}
          </h3>
          <p>
            {isAr
              ? 'يحق للعميل طلب استبدال فوري أو فحص للمنتج في حال وجود أي عيب مصنعي أو عدم تطابق مع المواصفات المسجلة بالفاتورة.'
              : 'Customers may request an immediate replacement if products arrive with defects or do not match order specifications.'}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '٢. خطوات طلب الاستبدال السريع:' : '2. Rapid Support Procedure:'}
          </h3>
          <p>
            {isAr
              ? `يكفي إرسال رقم الطلب عبر واتساب خدمة العملاء (${contactPhone}) وسيقوم فريقنا بمتابعة الطلب فوراً.`
              : `Simply send your order ID to our support WhatsApp (${contactPhone}) for swift assistance.`}
          </p>
        </section>

        <section className="space-y-1.5">
          <h3 className="font-black text-sm text-slate-900">
            {isAr ? '٣. استرجاع المبالغ المالية:' : '3. Refund Methods:'}
          </h3>
          <p>
            {isAr
              ? 'تتم استعادة المبالغ المدفوعة عبر بطاقات مدى أو أبل باي لنفس وسيلة الدفع الأصلية وفق مدد البنوك السعودية الرسمية.'
              : 'Refunds processed via Mada or Apple Pay are credited back to the original funding card within official banking timelines.'}
          </p>
        </section>
      </div>
    </div>
  );
};
