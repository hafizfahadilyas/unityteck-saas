import React, { useRef, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { handleImageError } from '../../../utils/imageFallback';
import {
  Zap,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sparkles,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface SliderCardProps {
  product: Product;
  currency: string;
  isAr: boolean;
  onBuyNow: (product: Product) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
  onNavigate: (route: string, id?: string) => void;
}

const SliderCard: React.FC<SliderCardProps> = ({
  product,
  currency,
  isAr,
  onBuyNow,
  onAddToCart,
  onNavigate,
}) => {
  const price = Number(product.basePrice) || 0;
  const prodImg =
    product.images?.[0] ||
    product.colors?.[0]?.image ||
    (product as any).image ||
    '/src/assets/images/hibrew_h7a_flagship_machine.png';

  const prodTitle = isAr ? product.nameAr || product.name : product.name;
  const prodSlug = (product as any).slug || String(product.id) || (product.name || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      onClick={() => onNavigate('product-detail', String(product.id))}
      className="w-[260px] sm:w-[290px] md:w-[310px] shrink-0 snap-start bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-0 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer text-start select-none relative overflow-hidden"
    >
      {/* Top: Product Image Showcase */}
      <div className="relative w-full h-40 sm:h-48 flex items-center justify-center p-2 mb-2 bg-[#FAFAFA] rounded-xl sm:rounded-2xl overflow-hidden group-hover:bg-neutral-50 transition-colors">
        <img
          src={prodImg}
          alt={prodTitle}
          loading="lazy" decoding="async"
          onError={(e) =>
            handleImageError(e, '/src/assets/images/hibrew_h7a_flagship_machine.png')
          }
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-sm select-none pointer-events-none"
        />
        {product.badge && (
          <span className="absolute top-2.5 start-2.5 text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full shadow-2xs">
            {isAr ? product.badgeAr || product.badge : product.badge}
          </span>
        )}
      </div>

      {/* Middle Content */}
      <div className="w-full space-y-1 min-w-0">
        {/* LINE 1: Products Title (Strictly 1 single line) */}
        <h4
          className="font-extrabold text-sm sm:text-base text-neutral-900 group-hover:text-black truncate whitespace-nowrap block"
          title={prodTitle}
        >
          {prodTitle}
        </h4>

        {/* LINE 2: Products Slug / Model Identification (Strictly 1 single line) */}
        <p
          className="text-xs text-neutral-500 font-mono font-medium truncate whitespace-nowrap block"
          title={prodSlug}
        >
          #{prodSlug}
        </p>
      </div>

      {/* Bottom Action Row: PRICE, ADD TO CART, BUY NOW — ALL 3 TOGETHER IN ONE LINE WITH BLACK BUTTONS */}
      <div className="pt-3 border-0 flex items-center justify-between gap-2 w-full mt-3">
        {/* 1. Price */}
        <div className="flex flex-col text-start shrink-0 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-sm sm:text-base text-neutral-950 font-sans tracking-tight">
              {price.toLocaleString()}
            </span>
            <span className="text-[11px] font-bold text-neutral-800">{currency}</span>
          </div>
          {product.originalPrice && Number(product.originalPrice) > price && (
            <span className="text-[10px] text-neutral-400 line-through font-sans">
              {Number(product.originalPrice).toLocaleString()} {currency}
            </span>
          )}
        </div>

        {/* 2 & 3. Add to Cart + Buy Now Buttons (Black Buttons Together) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Add to Cart Button (Black) */}
          <button
            type="button"
            onClick={(e) => onAddToCart(e, product)}
            title={isAr ? 'أضف للسلة' : 'Add to Cart'}
            className="p-2 sm:px-2.5 sm:py-2 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Buy Now Button (Black) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(product);
            }}
            className="px-3 sm:px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center gap-1 whitespace-nowrap"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>{isAr ? 'شراء' : 'Buy Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface SliderGroupProps {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  products: Product[];
  currency: string;
  isAr: boolean;
  onBuyNow: (product: Product) => void;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
  onNavigate: (route: string, id?: string) => void;
}

const SingleProductSlider: React.FC<SliderGroupProps> = ({
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  icon: Icon,
  products,
  currency,
  isAr,
  onBuyNow,
  onAddToCart,
  onNavigate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'prev' | 'next') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    const delta = isAr
      ? direction === 'next'
        ? -scrollAmount
        : scrollAmount
      : direction === 'next'
      ? scrollAmount
      : -scrollAmount;
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border-0 shadow-xs space-y-4 sm:space-y-5">
      {/* Slider Header */}
      <div className="flex items-center justify-between gap-3 border-0 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3 text-start min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-base sm:text-xl lg:text-2xl text-neutral-950 tracking-tight truncate">
              {isAr ? titleAr : titleEn}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">
              {isAr ? subtitleAr : subtitleEn}
            </p>
          </div>
        </div>

        {/* Prev / Next Chevrons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScroll('prev')}
            title={isAr ? 'السابق' : 'Previous'}
            aria-label="Previous"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white flex items-center justify-center transition-colors active:scale-90 cursor-pointer border-0"
          >
            {isAr ? (
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleScroll('next')}
            title={isAr ? 'التالي' : 'Next'}
            aria-label="Next"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-100 hover:bg-neutral-900 text-neutral-700 hover:text-white flex items-center justify-center transition-colors active:scale-90 cursor-pointer border-0"
          >
            {isAr ? (
              <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="w-full flex items-stretch gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 no-scrollbar"
      >
        {products.map((prod) => (
          <SliderCard
            key={prod.id}
            product={prod}
            currency={currency}
            isAr={isAr}
            onBuyNow={onBuyNow}
            onAddToCart={onAddToCart}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

export const ShopTripleSlidersSection: React.FC = () => {
  const { navigateTo, addToCart, triggerFlyToCart, language, products: contextProducts } = useCart();
  const { activeStore } = useTenant();

  const isAr = language === 'AR';
  const currency = isAr ? 'ر.س' : activeStore?.currency || 'SAR';

  // Dynamic products catalog
  const catalog: Product[] = useMemo(() => {
    if (contextProducts && contextProducts.length > 0) return contextProducts;
    return PRODUCTS;
  }, [contextProducts]);

  // Handlers
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
    const prodImg =
      product.images?.[0] ||
      product.colors?.[0]?.image ||
      '/src/assets/images/hibrew_h7a_flagship_machine.png';
    if (triggerFlyToCart && rect) {
      triggerFlyToCart(rect, prodImg);
    }
    addToCart(product, undefined, undefined, undefined, undefined, true);
  };

  const handleBuyNow = (product: Product) => {
    addToCart(product, undefined, undefined, undefined, undefined, false);
    navigateTo('product-buy', String(product.id));
  };

  // Group 1: Commercial & Dual-Boiler Espresso Machines / مكائن الإسبريسو الاحترافية ٢٠ بار
  const machinesList = useMemo(() => {
    return catalog.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      const pid = String(p.id || '').toLowerCase();
      const pname = String(p.name || '').toLowerCase();
      return (
        cat.includes('machine') ||
        pid.includes('h10') ||
        pid.includes('h7') ||
        pid.includes('espresso') ||
        pid.includes('barista') ||
        pname.includes('machine')
      );
    });
  }, [catalog]);

  // Group 2: Compact, Capsule & Drip Coffee Makers or Mills / مكائن القهوة المدمجة والتقطير والمطاحن
  const millsList = useMemo(() => {
    const mills = catalog.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      const pid = String(p.id || '').toLowerCase();
      const pname = String(p.name || '').toLowerCase();
      return (
        cat.includes('mill') ||
        cat.includes('grind') ||
        pid.includes('mill') ||
        pid.includes('grinder') ||
        pid.includes('g3') ||
        pid.includes('g5') ||
        pname.includes('grinder')
      );
    });
    if (mills.length > 0) return mills;
    return catalog.filter((p) => {
      const pid = String(p.id || '').toLowerCase();
      return pid.includes('compact') || pid.includes('drip') || pid.includes('capsule');
    });
  }, [catalog]);

  // Group 3: Coffee Stations, Accessories & Barista Tools / أركان القهوة ومستلزمات الباريستا
  const stationsList = useMemo(() => {
    return catalog.filter((p) => {
      const cat = String(p.category || '').toLowerCase();
      const pid = String(p.id || '').toLowerCase();
      return (
        cat.includes('cabinet') ||
        cat.includes('station') ||
        cat.includes('corner') ||
        cat.includes('access') ||
        pid.includes('cabinet') ||
        pid.includes('station') ||
        pid.includes('corner') ||
        pid.includes('custom') ||
        pid.includes('scale') ||
        pid.includes('cup') ||
        pid.includes('tamper')
      );
    });
  }, [catalog]);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8 select-none">
      {/* 1. FIRST SLIDER: مكائن الإسبريسو الاحترافية */}
      <SingleProductSlider
        titleAr="مكائن الإسبريسو الفاخرة ٢٠ بار"
        titleEn="Luxury 20-Bar Espresso Machines"
        subtitleAr="أنظمة تحكم حراري رقمي مستقلة PID وضغط إيطالي تجاري ثابت"
        subtitleEn="Commercial Italian pumps with independent PID dual-boiler extraction"
        icon={Flame}
        products={machinesList}
        currency={currency}
        isAr={isAr}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onNavigate={navigateTo}
      />

      {/* 2. SECOND SLIDER: مطاحن البن والتيتانيوم */}
      <SingleProductSlider
        titleAr="مطاحن البن والشفرات المخروطية التيتانيوم"
        titleEn="Titanium Conical Burr Coffee Mills"
        subtitleAr="شفرات تيتانيوم ٤٠ مم صلبة مع ضبط ميكروني لجميع درجات الطحن"
        subtitleEn="40mm CNC titanium burrs minimizing heat with stepless micro-calibration"
        icon={Sparkles}
        products={millsList}
        currency={currency}
        isAr={isAr}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onNavigate={navigateTo}
      />

      {/* 3. THIRD SLIDER: أركان ودواليب القهوة الفاخرة ومستلزمات الباريستا */}
      <SingleProductSlider
        titleAr="أركان ودواليب القهوة الفاخرة ومستلزمات الباريستا"
        titleEn="Bespoke Coffee Stations & Barista Tools"
        subtitleAr="تفصيل أركان خشبية مخصصة وأدوات احترافية متكاملة بضمان معتمد"
        subtitleEn="Tailor-made natural oak stations, sintered stone tops & barista accessories"
        icon={Coffee}
        products={stationsList}
        currency={currency}
        isAr={isAr}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onNavigate={navigateTo}
      />
    </section>
  );
};

