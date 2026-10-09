import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ADDON_OPTIONS, PRODUCTS } from '../data/mockData';
import { AddonOption } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  Star,
  Heart,
  Truck,
  ShieldCheck,
  Clock,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  CreditCard,
  MessageSquare
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const {
    language,
    selectedProduct,
    addToCart,
    isWishlisted,
    toggleWishlist,
    setCurrentPage,
    setIsCartOpen,
    products
  } = useApp();

  const isAr = language === 'ar';
  const allProds = products && products.length > 0 ? products : PRODUCTS;
  const product = selectedProduct || allProds[0];

  // Gallery state
  const allImages = [product.image, ...(product.additionalImages || [])];
  const [activeImage, setActiveImage] = useState<string>(product.image);

  // Customization state
  const sizes = [
    { id: 'standard', name: isAr ? 'الحجم الكلاسيكي' : 'Classic Size', extra: 0 },
    { id: 'luxury', name: isAr ? 'الحجم الفاخر الملكي (+10 ورقات إضافية)' : 'Royal Luxury Size (+10 stems)', extra: 75 },
    { id: 'vip', name: isAr ? 'حجم النخبة VIP الكبير جداً' : 'VIP Grand Edition', extra: 150 },
  ];
  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  // Selected addons
  const [selectedAddons, setSelectedAddons] = useState<AddonOption[]>([]);

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Greeting card text
  const [cardMessage, setCardMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const toggleAddon = (addon: AddonOption) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = product.price + selectedSize.extra + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    addToCart(
      product,
      quantity,
      selectedAddons,
      cardMessage,
      selectedSize.name
    );
  };

  const handleBuyNow = () => {
    addToCart(
      product,
      quantity,
      selectedAddons,
      cardMessage,
      selectedSize.name
    );
    setIsCartOpen(false);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const wishlisted = isWishlisted(product.id);
  const tabbyInstallment = (unitPrice / 4).toFixed(2);

  // Related products
  const relatedProducts = allProds.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="py-8 md:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-xs text-[#8c8275] mb-6 flex items-center gap-2">
        <button onClick={() => setCurrentPage('home')} className="hover:text-[#102a1c]">
          {isAr ? 'الرئيسية' : 'Home'}
        </button>
        <span>/</span>
        <button onClick={() => setCurrentPage('catalog')} className="hover:text-[#102a1c]">
          {isAr ? product.category : product.categoryEn}
        </button>
        <span>/</span>
        <span className="text-[#102a1c] font-semibold">
          {isAr ? product.name : product.nameEn}
        </span>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Display */}
          <div className="relative aspect-[4/3] sm:aspect-square w-full rounded-3xl overflow-hidden bg-[#efebe3] border border-[#e2ddd1] shadow-sm">
            <img
              src={activeImage}
              alt={isAr ? product.name : product.nameEn}
              className="w-full h-full object-cover object-center transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            {product.badge && (
              <span className="absolute top-4 right-4 rtl:right-4 rtl:left-auto ltr:left-4 ltr:right-auto bg-[#102a1c] text-[#e6ca98] text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                {isAr ? product.badge : product.badgeEn}
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                wishlisted
                  ? 'bg-[#8b263e] text-white shadow-md'
                  : 'bg-white/85 hover:bg-white text-[#495057] shadow-sm'
              }`}
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnails row */}
          {allImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === img ? 'border-[#102a1c] scale-102 shadow-sm' : 'border-[#e2ddd1] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Guarantee Badges Row */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="p-3 bg-[#FAF9F5] border border-[#e8e4dc] rounded-2xl">
              <Clock className="w-5 h-5 text-[#102a1c] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#102a1c]">{isAr ? 'توصيل خلال ساعة' : '1-Hour Delivery'}</p>
              <p className="text-[10px] text-[#8c8275]">{isAr ? 'في كافة أحياء مكة' : 'Across all Mecca'}</p>
            </div>
            <div className="p-3 bg-[#FAF9F5] border border-[#e8e4dc] rounded-2xl">
              <Sparkles className="w-5 h-5 text-[#102a1c] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#102a1c]">{isAr ? 'ضمان نضارة 7 أيام' : '7-Day Fresh Guarantee'}</p>
              <p className="text-[10px] text-[#8c8275]">{isAr ? 'مستوردة من هولندا' : 'Direct Dutch import'}</p>
            </div>
            <div className="p-3 bg-[#FAF9F5] border border-[#e8e4dc] rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-[#102a1c] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#102a1c]">{isAr ? 'تغليف ملكي فاخر' : 'Royal Packaging'}</p>
              <p className="text-[10px] text-[#8c8275]">{isAr ? 'شريط حريري وبطاقة' : 'Silk ribbon & card'}</p>
            </div>
          </div>
        </div>

        {/* Purchase & Customization Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#8c8275] font-semibold">
              {isAr ? product.category : product.categoryEn}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c] mt-1">
              {isAr ? product.name : product.nameEn}
            </h1>

            {/* Stars & Reviews */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-[#e6a817]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-current text-[#d89f24]'
                        : 'text-[#d6cebf]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-[#495057]">
                {product.rating} ({product.reviewsCount} {isAr ? 'تقييم موثق' : 'verified reviews'})
              </span>
            </div>

            {/* Price Row */}
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-extrabold font-mono text-[#102a1c]">
                {unitPrice}
              </span>
              <span className="text-sm font-semibold text-[#102a1c]">
                {isAr ? 'ر.س شامل الضريبة' : 'SAR (VAT Incl.)'}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-[#999] line-through font-mono ml-2">
                  {product.originalPrice + selectedSize.extra}
                </span>
              )}
            </div>

            {/* Tabby / Tamara Installment Note */}
            <div className="mt-3 p-3 rounded-2xl bg-[#efebe1] border border-[#e0dad0] text-xs text-[#495057] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#102a1c]" />
                <span>
                  {isAr
                    ? `أو قسّمها على 4 دفعات بدون فوائد بقيمة ${tabbyInstallment} ر.س`
                    : `Or 4 interest-free payments of ${tabbyInstallment} SAR`}
                </span>
              </div>
              <span className="font-bold text-[#102a1c]">{isAr ? 'تمارا / تابي' : 'Tabby'}</span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#555] leading-relaxed mt-4">
              {isAr ? product.description : product.descriptionEn}
            </p>
          </div>

          {/* Size Selector */}
          <div className="space-y-2 pt-2 border-t border-[#e8e4dc]">
            <label className="text-xs font-bold text-[#102a1c] block">
              {isAr ? 'اختر حجم الباقة:' : 'Choose Arrangement Size:'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s)}
                  className={`p-3 rounded-xl border text-xs text-start flex items-center justify-between transition-all ${
                    selectedSize.id === s.id
                      ? 'border-[#102a1c] bg-[#102a1c]/5 font-semibold text-[#102a1c] ring-1 ring-[#102a1c]'
                      : 'border-[#d6cfc0] bg-white hover:border-[#102a1c]/40 text-[#495057]'
                  }`}
                >
                  <span>{s.name}</span>
                  {s.extra > 0 && (
                    <span className="font-mono text-[#8b263e]">+{s.extra} {isAr ? 'ر.س' : 'SAR'}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Luxury Add-ons (Chocolates, Vases, Sealed Card) */}
          <div className="space-y-2 pt-2 border-t border-[#e8e4dc]">
            <label className="text-xs font-bold text-[#102a1c] block">
              {isAr ? 'إضافات فاخرة لتكتمل هديتك:' : 'Luxury Add-ons to Elevate Your Gift:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADDON_OPTIONS.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-[#102a1c] bg-[#102a1c]/5 font-semibold ring-1 ring-[#102a1c]'
                        : 'border-[#d6cfc0] bg-white hover:border-[#102a1c]/40'
                    }`}
                  >
                    <img
                      src={addon.image}
                      alt={isAr ? addon.name : addon.nameEn}
                      className="w-10 h-10 rounded-lg object-cover border border-[#e2ddd1] shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-[#1a1f1b] leading-tight truncate">
                        {isAr ? addon.name : addon.nameEn}
                      </p>
                      <p className="text-[10px] text-[#102a1c] font-mono font-bold mt-0.5">
                        +{addon.price} {isAr ? 'ر.س' : 'SAR'}
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#102a1c] border-[#102a1c] text-white' : 'border-[#bbb]'}`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Personalized Greeting Card Section */}
          <div className="space-y-2 pt-2 border-t border-[#e8e4dc]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#102a1c]">
              <MessageSquare className="w-4 h-4" />
              <span>{isAr ? 'نص بطاقة الإهداء (تُكتب بخط اليد بختم شمعي):' : 'Handwritten Greeting Card Message:'}</span>
            </div>
            <textarea
              rows={2}
              value={cardMessage}
              onChange={(e) => setCardMessage(e.target.value)}
              placeholder={isAr ? 'اكتب كلماتك الصادقة هنا وسيقوم خطاطنا بكتابتها يدوياً على كرت الإهداء الفاخر...' : 'Write your sincere note and our calligrapher will handwrite it on a luxury card...'}
              className="w-full bg-[#f8f6f0] border border-[#d6cfc0] rounded-xl p-3 text-xs focus:outline-none focus:border-[#102a1c]"
            />
          </div>

          {/* Action Row: Quantity + Add to Cart + Buy Now */}
          <div className="pt-4 border-t border-[#e8e4dc] space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-[#d6cfc0] rounded-full bg-white px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:bg-[#ede9df] rounded-full text-[#495057]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono font-bold text-sm text-[#102a1c]">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:bg-[#ede9df] rounded-full text-[#495057]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 rounded-full bg-[#102a1c] hover:bg-[#1a3f2b] active:scale-98 text-[#FAF9F5] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <ShoppingBag className="w-4 h-4 text-[#e6ca98]" />
                <span>{isAr ? `أضف للسلة (${totalPrice} ر.س)` : `Add to Bag (${totalPrice} SAR)`}</span>
              </button>
            </div>

            {/* Instant Buy Now Button */}
            <button
              onClick={handleBuyNow}
              className="w-full py-3.5 rounded-full bg-[#e6ca98] hover:bg-[#dfc088] active:scale-98 text-[#102a1c] text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              {isAr ? 'شراء فوري وإرسال كهدية الآن' : 'Express Buy Now'}
            </button>

            {/* Direct WhatsApp Order */}
            <a
              href={`https://wa.me/966581617712?text=${encodeURIComponent(
                isAr
                  ? `مرحباً متجر هدايا مكة، أود طلب: *${product.name}* (${selectedSize.name}) بسعر إجمالي ${totalPrice} ر.س. أرجو التنسيق للتوصيل الفوري.`
                  : `Hello Hadaya Mecca, I want to order: *${product.nameEn}* (${selectedSize.name}) for ${totalPrice} SAR.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white border border-[#25D366]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 fill-current" />
              <span>{isAr ? 'طلب فوري ومباشر عبر واتساب' : 'Order Instantly via WhatsApp'}</span>
            </a>
          </div>

        </div>

      </div>

      {/* Related Products Showcase */}
      <div className="mt-16 sm:mt-24 pt-12 border-t border-[#e8e4dc]">
        <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#102a1c] mb-6">
          {isAr ? 'قد يعجبك أيضاً من تشكيلاتنا' : 'You May Also Like'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
};
