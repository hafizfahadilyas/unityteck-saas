import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../../../context/TenantContext';
import { Product } from '../types';
import { CATEGORIES } from '../data/products';
import { HeroSlider3D } from './HeroSlider3D';
import { ExclusivePerksBar } from './ExclusivePerksBar';
import { ShopTripleSlidersSection } from './ShopTripleSlidersSection';
import { HonorProductCard } from './HonorProductCard';
import { ShopFeaturedCarouselSection } from './ShopFeaturedCarouselSection';
import { resolveProductThumbnail } from '../../../utils/imageFallback';
import {
  Star,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Flame,
  Sparkles,
  Layers,
  ShieldCheck,
  Truck,
  Award,
  ShoppingBag,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Columns,
  List,
  RotateCcw,
  PackageOpen,
  Filter,
  CheckCircle2,
  X,
  Gauge,
  Headphones,
  Coffee,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const ProductsListPage: React.FC = () => {
  const { navigateTo, addToCart, triggerFlyToCart, language, products: contextProducts } = useCart();
  const { activeStore, currentProducts } = useTenant();

  const isAr = language === 'AR';

  // Active store details with localization fallback
  const storeName = isAr
    ? activeStore?.nameAr || activeStore?.name || 'متجر مكائن ومستلزمات القهوة (HiBrew KSA)'
    : activeStore?.nameEn || activeStore?.name || 'HiBrew KSA Official Coffee Store';

  const storeCurrency = isAr ? 'ر.س' : (activeStore?.currency || 'SAR');

  // Master product source: priority to context products (which already merges database/API products)
  const masterProducts: Product[] = useMemo(() => {
    if (contextProducts && contextProducts.length > 0) {
      return contextProducts;
    }
    return [];
  }, [contextProducts]);

  // Filters State
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number>(3500);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'grid'>('grid');
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);

  // Dynamic Categories derived from catalog with localized names & counts
  const dynamicCategories = useMemo(() => {
    const map = new Map<string, { id: string; name: string; nameAr: string; count: number }>();

    // Initial default categories
    map.set('all', {
      id: 'all',
      name: 'All Products',
      nameAr: 'جميع المنتجات',
      count: masterProducts.length
    });

    CATEGORIES.forEach(cat => {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr || cat.name,
        count: 0
      });
    });

    masterProducts.forEach(prod => {
      const catKey = String(prod.category || 'machines').toLowerCase();
      if (map.has(catKey)) {
        const item = map.get(catKey)!;
        item.count += 1;
      } else {
        map.set(catKey, {
          id: catKey,
          name: catKey.charAt(0).toUpperCase() + catKey.slice(1),
          nameAr: catKey,
          count: 1
        });
      }
    });

    return Array.from(map.values());
  }, [masterProducts]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...masterProducts];

    // Category Filter
    if (selectedCat !== 'all') {
      result = result.filter(p => String(p.category || '').toLowerCase() === String(selectedCat).toLowerCase());
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const matchName = String(p.name || '').toLowerCase().includes(q);
        const matchNameAr = String(p.nameAr || '').toLowerCase().includes(q);
        const matchTagline = String(p.tagline || '').toLowerCase().includes(q);
        const matchTaglineAr = String(p.taglineAr || '').toLowerCase().includes(q);
        const matchId = String(p.id || '').toLowerCase().includes(q);
        return matchName || matchNameAr || matchTagline || matchTaglineAr || matchId;
      });
    }

    // Price Filter
    result = result.filter(p => (Number(p.basePrice) || 0) <= priceRange);

    // In Stock Only Filter
    if (onlyInStock) {
      result = result.filter(p => (Number(p.basePrice) || 0) > 0);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => (Number(a.basePrice) || 0) - (Number(b.basePrice) || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (Number(b.basePrice) || 0) - (Number(a.basePrice) || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return result;
  }, [masterProducts, selectedCat, searchQuery, priceRange, onlyInStock, sortBy]);

  // Active filters count for clear button badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCat !== 'all') count++;
    if (searchQuery.trim()) count++;
    if (priceRange < 3500) count++;
    if (onlyInStock) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [selectedCat, searchQuery, priceRange, onlyInStock, sortBy]);

  const handleResetFilters = () => {
    setSelectedCat('all');
    setSearchQuery('');
    setPriceRange(3500);
    setOnlyInStock(false);
    setSortBy('featured');
  };

  // Mobile Carousel Intersection Observer
  useEffect(() => {
    const container = carouselRef.current;
    if (!container || mobileViewMode !== 'carousel') return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idxStr = entry.target.getAttribute('data-slide-index');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              if (!isNaN(idx)) {
                setActiveMobileSlide(idx);
              }
            }
          }
        });
      },
      { root: container, threshold: 0.55 }
    );

    Array.from(container.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [selectedCat, filteredProducts.length, mobileViewMode]);

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const children = carouselRef.current.children;
    const clampedIndex = Math.max(0, Math.min(index, children.length - 1));
    const target = children[clampedIndex] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setActiveMobileSlide(clampedIndex);
    }
  };

  const nextSlide = () => {
    if (!filteredProducts.length) return;
    const nextIdx = (activeMobileSlide + 1) % filteredProducts.length;
    scrollToSlide(nextIdx);
  };

  const prevSlide = () => {
    if (!filteredProducts.length) return;
    const prevIdx = (activeMobileSlide - 1 + filteredProducts.length) % filteredProducts.length;
    scrollToSlide(prevIdx);
  };

  // Add to Cart handler with smooth visual feedback
  const handleAddToCart = (e: React.MouseEvent | undefined, product: Product) => {
    if (e) {
      e.stopPropagation();
      const btnRect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
      const prodImg = (product as any).image || product.colors?.[0]?.image || product.images?.[0] || '/src/assets/images/hibrew_h7a_flagship_machine.png';
      if (triggerFlyToCart && btnRect) {
        triggerFlyToCart(btnRect, prodImg);
      }
    }
    addToCart(product, undefined, undefined, undefined, undefined, true);
    setRecentlyAddedId(String(product.id));
    setTimeout(() => setRecentlyAddedId(null), 2000);
  };

  // Buy Now handler: Add to cart immediately and navigate directly to checkout/buy page
  const handleBuyNow = (e: React.MouseEvent | undefined, product: Product) => {
    if (e) e.stopPropagation();
    addToCart(product, undefined, undefined, undefined, undefined, false);
    navigateTo('product-buy', String(product.id));
  };

  // 6 Value Props / About Us & Product Quality Boxes
  const highlightBoxes = [
    {
      id: 'box-1',
      icon: Flame,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      tag: isAr ? 'هندسة إيطالية' : 'Italian Engineering',
      title: isAr ? 'استخلاص ٢٠ بار ونظام دبل بويلر PID' : '20-Bar Extraction & Dual PID Boilers',
      description: isAr
        ? 'مضخات إيطالية تجارية متطورة مع تحكم حراري رقمي مستقل يضمن استخلاص نكهات البن بدقة وثبات حراري متواصل.'
        : 'Commercial Italian pumps with dual independent PID temperature regulation for balanced and rich crema.'
    },
    {
      id: 'box-2',
      icon: Sparkles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      tag: isAr ? 'طحن ميكروني' : 'Micron Precision',
      title: isAr ? 'مطاحن تيتانيوم CNC مخروطية ٤٠ مم' : '40mm CNC Titanium Conical Burrs',
      description: isAr
        ? 'شفرات تيتانيوم صلبة تقلل التراكم الحراري مع ضبط دقيق مستمر يناسب درجات الإسبريسو الفاخر والتقطير V60.'
        : 'Titanium-coated burrs minimizing thermal friction with stepless micro-adjustments for espresso & filter.'
    },
    {
      id: 'box-3',
      icon: Layers,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      tag: isAr ? 'تفصيل يدوي' : 'Handcrafted Luxury',
      title: isAr ? 'تفصيل أركان ودواليب القهوة الفاخرة' : 'Bespoke Tailor-Made Coffee Stations',
      description: isAr
        ? 'أخشاب بلوط طبيعية مضلعة وأسطح حجرية إيطالية وتمديدات كابلات مخفية مصممة خصيصاً لمساحتك وديكورك.'
        : 'Fluted natural oak wood, sintered stone tops, and concealed cable routing tailored to fit your space.'
    },
    {
      id: 'box-4',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      tag: isAr ? 'ضمان معتمد' : 'Official Coverage',
      title: isAr ? 'ضمان الوكيل الرسمي سنتين بالمملكة' : 'Official 2-Year Agent Warranty in KSA',
      description: isAr
        ? 'ضمان محلي شامل الصيانة وتوفير قطع الغيار الأصلية وفنيين معتمدين داخل المملكة العربية السعودية.'
        : 'Comprehensive nationwide coverage for parts and service through authorized support centers in Saudi Arabia.'
    },
    {
      id: 'box-5',
      icon: Truck,
      color: 'text-amber-700',
      bgColor: 'bg-amber-700/10',
      borderColor: 'border-amber-700/20',
      tag: isAr ? 'توصيل فوري' : 'Express Delivery',
      title: isAr ? 'شحن فوري سريع وتغليف آمن للمملكة' : 'Express 24-48h Delivery & Safe Packaging',
      description: isAr
        ? 'توصيل سريع لجميع مناطق المملكة مع تغليف احترافي ممتص للصدمات وخيارات دفع ميسرة تابي وتمارا والدفع عند الاستلام.'
        : 'Fast dispatch across all Saudi regions with shockproof packaging, COD, and flexible installment options.'
    },
    {
      id: 'box-6',
      icon: Award,
      color: 'text-amber-800',
      bgColor: 'bg-amber-800/10',
      borderColor: 'border-amber-800/20',
      tag: isAr ? 'دعم باريستا' : 'Barista Care',
      title: isAr ? 'استشارات باريستا ومتابعة ما بعد البيع' : 'Certified Barista Guidance & Support',
      description: isAr
        ? 'فريق خبراء باريستا لتقديم النصائح حول معايرة الطحنة، نسب الاستخلاص، وبرمجة المكائن لمذاق متوازن لا يُنسى.'
        : 'Dedicated certified baristas ready to help you calibrate your grind size, extraction ratio, and settings.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 selection:bg-neutral-900 selection:text-white w-full max-w-full overflow-x-hidden font-sans">
      
      {/* 1. Sub-Header Breadcrumb Strip */}
      <div className="bg-white border-b border-neutral-200/80 py-2.5 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between text-[11px] sm:text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
            <span className="text-neutral-400">&gt;</span>
            <span className="text-neutral-900 font-semibold">{isAr ? 'متجر المنتجات' : 'Shop'}</span>
            <span className="text-neutral-400">&gt;</span>
            <span className="text-neutral-500">
              {selectedCat === 'all'
                ? isAr ? 'جميع المنتجات' : 'All Products'
                : dynamicCategories.find(c => c.id === selectedCat)?.[isAr ? 'nameAr' : 'name'] || selectedCat}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-neutral-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>
              {isAr
                ? `${filteredProducts.length} منتج متاح للشحن الفوري`
                : `${filteredProducts.length} Products Available for Express Dispatch`}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Hero Slider (Shop Page Variant with distinct commercial gear slides) */}
      <HeroSlider3D variant="shop" />

      {/* 3. Exclusive Perks Bar: 4 Perks in 2 rows + 5th WhatsApp box (Bronze Theme) */}
      <ExclusivePerksBar />

      {/* 4. Products Campaign Triple Sliders Section (White BG, Black Text, Black Buttons, Product + Slug + BuyNow/Cart/Price) */}
      <ShopTripleSlidersSection />

      {/* 4. Products Catalog Section with Interactive Filters */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
        
        {/* Section Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div className="space-y-1.5 text-start">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span>{isAr ? 'الكتالوج المعتمد' : 'Official Catalog'}</span>
              <span>·</span>
              <span>{storeName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              {isAr ? 'استكشف جميع المنتجات والمعدات' : 'Explore All Coffee Gear & Products'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              {isAr
                ? 'تصفح تشكيلة مكائن الإسبريسو، المطاحن، دواليب القهوة، ومستلزمات الباريستا مع أسعار شاملة للضريبة.'
                : 'Browse our collection of espresso machines, mills, stations, and accessories with VAT-inclusive pricing.'}
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            
            {/* Sort Dropdown */}
            <div className="relative inline-flex items-center">
              <ArrowUpDown className={`w-3.5 h-3.5 text-neutral-500 absolute ${isAr ? 'right-3' : 'left-3'} pointer-events-none`} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className={`bg-white border border-neutral-200 text-neutral-800 text-xs font-medium rounded-full py-2 ${
                  isAr ? 'pr-8 pl-4' : 'pl-8 pr-4'
                } hover:border-neutral-300 focus:outline-hidden focus:ring-1 focus:ring-black cursor-pointer shadow-2xs`}
              >
                <option value="featured">{isAr ? 'الترتيب: المميز أولاً' : 'Sort: Featured'}</option>
                <option value="price-asc">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                <option value="price-desc">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                <option value="rating">{isAr ? 'التقييم: الأعلى تقييماً' : 'Highest Rated'}</option>
              </select>
            </div>

            {/* Desktop View Mode Toggle (Grid vs List) */}
            <div className="hidden sm:inline-flex items-center bg-neutral-100 p-0.5 rounded-full border border-neutral-200/80">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-black shadow-xs' : 'text-neutral-500 hover:text-black'
                }`}
                title={isAr ? 'عرض شبكة' : 'Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-black shadow-xs' : 'text-neutral-500 hover:text-black'
                }`}
                title={isAr ? 'عرض قائمة' : 'List View'}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile View Toggle: Carousel Slider vs Grid */}
            <div className="inline-flex sm:hidden items-center bg-neutral-100 p-1 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setMobileViewMode('grid')}
                className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  mobileViewMode === 'grid' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'شبكة' : 'Grid'}</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('carousel')}
                className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  mobileViewMode === 'carousel' ? 'bg-white text-black shadow-xs' : 'text-neutral-500'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{isAr ? 'سلايدر' : 'Slider'}</span>
              </button>
            </div>

            {/* Active Filters Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'مسح الفلاتر' : 'Reset'}</span>
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              </button>
            )}

          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="overflow-x-auto no-scrollbar whitespace-nowrap py-1 -mx-2 px-2">
          <div className="flex items-center gap-2 sm:gap-2.5 w-max">
            {dynamicCategories.map(cat => {
              const isSelected = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-black text-white font-bold shadow-md shadow-black/10'
                      : 'bg-white text-neutral-600 hover:text-black hover:bg-neutral-100 border border-neutral-200/80 font-medium'
                  }`}
                >
                  <span>{isAr ? cat.nameAr : cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Bar: Price Slider & Quick Search */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-2xs space-y-3.5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Price Range Slider */}
            <div className="w-full md:w-auto flex-1 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span className="flex items-center gap-1 text-neutral-600">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الحد الأقصى للسعر:' : 'Max Price Limit:'}</span>
                </span>
                <span className="text-black font-bold font-sans">
                  {priceRange.toLocaleString()} {storeCurrency}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="3500"
                step="50"
                value={priceRange}
                onChange={e => setPriceRange(Number(e.target.value))}
                className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg appearance-none"
              />
            </div>

            {/* Quick Price Tier Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setPriceRange(500)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceRange === 500
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {isAr ? 'أقل من 500 ر.س' : '< 500 SAR'}
              </button>
              <button
                type="button"
                onClick={() => setPriceRange(1500)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceRange === 1500
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {isAr ? 'حتى 1500 ر.س' : 'Up to 1500 SAR'}
              </button>
              <button
                type="button"
                onClick={() => setPriceRange(3500)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  priceRange === 3500
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {isAr ? 'جميع الأسعار' : 'All Prices'}
              </button>
            </div>

            {/* In-Stock Toggle */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={e => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-black accent-black cursor-pointer"
                />
                <span>{isAr ? 'إظهار المتوفر فقط' : 'In-Stock Only'}</span>
              </label>

              <span className="text-neutral-300">|</span>

              <span className="text-xs text-neutral-500 font-sans">
                {isAr ? `عرض ${filteredProducts.length} من ${masterProducts.length}` : `Showing ${filteredProducts.length} of ${masterProducts.length}`}
              </span>
            </div>

          </div>

          {/* Active Filter Dismiss Chips */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-neutral-500 font-medium">
                {isAr ? 'الفلاتر المطبقة:' : 'Active Filters:'}
              </span>

              {selectedCat !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-[11px]">
                  <span>{isAr ? 'التصنيف:' : 'Category:'}</span>
                  <span className="font-semibold">
                    {dynamicCategories.find(c => c.id === selectedCat)?.[isAr ? 'nameAr' : 'name'] || selectedCat}
                  </span>
                  <button type="button" onClick={() => setSelectedCat('all')} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-[11px]">
                  <span>{isAr ? 'البحث:' : 'Search:'}</span>
                  <span className="font-semibold font-sans">"{searchQuery}"</span>
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange < 3500 && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-[11px]">
                  <span>{isAr ? 'أقصى سعر:' : 'Max Price:'}</span>
                  <span className="font-semibold font-sans">{priceRange} {storeCurrency}</span>
                  <button type="button" onClick={() => setPriceRange(3500)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full text-[11px]">
                  <span>{isAr ? 'المتوفر فقط' : 'In-Stock Only'}</span>
                  <button type="button" onClick={() => setOnlyInStock(false)} className="hover:text-black">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer ms-auto"
              >
                {isAr ? 'مسح الكل' : 'Clear All'}
              </button>
            </div>
          )}
        </div>

        {/* 5. Genuine Empty State (Rule 1 Compliance) */}
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-neutral-200/80 shadow-xs max-w-xl mx-auto my-8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center mx-auto shadow-inner">
              <PackageOpen className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-neutral-900">
                {isAr ? 'لم يتم العثور على أي نتائج مطابقة' : 'No Matching Products Found'}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-md mx-auto">
                {searchQuery.trim() || selectedCat !== 'all' || priceRange < 3500 || onlyInStock
                  ? isAr
                    ? 'لم يتم العثور على أي منتج يطابق معايير التصفية الحالية. جرّب تعديل كلمات البحث، توسيع نطاق السعر، أو اختيار تصنيف آخر.'
                    : 'No products matched your active filters. Try broadening your search query, increasing your price limit, or selecting another category.'
                  : isAr
                  ? 'لا توجد أي منتجات مسجلة في كتالوج هذا المتجر حالياً.'
                  : 'There are currently no products registered in this store catalog.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. Mobile Carousel View (Active on mobile screens when carousel is toggled) */}
        {mobileViewMode === 'carousel' && filteredProducts.length > 0 && (
          <div className="block sm:hidden w-full relative">
            
            {/* Top Indicator & Controls */}
            <div className="flex items-center justify-between px-2 mb-3">
              <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full">
                {isAr
                  ? `المنتج ${activeMobileSlide + 1} من ${filteredProducts.length}`
                  : `Product ${activeMobileSlide + 1} of ${filteredProducts.length}`}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (isAr ? nextSlide() : prevSlide())}
                  aria-label="Previous"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 border border-neutral-200/80 shadow-2xs flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => (isAr ? prevSlide() : nextSlide())}
                  aria-label="Next"
                  className="w-8 h-8 rounded-full bg-white text-neutral-800 border border-neutral-200/80 shadow-2xs flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mobile Carousel Track */}
            <div
              ref={carouselRef}
              className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-2 px-1 -mx-1"
              style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
            >
              {filteredProducts.map((product, pIdx) => {
                const topImg = (product as any).image || product.colors?.[0]?.image || product.images?.[0] || '/src/assets/images/hibrew_h7a_flagship_machine.png';
                const bottomImg = product.colors?.[1]?.image || product.images?.[1] || (product as any).image || product.colors?.[0]?.image || topImg;
                const prodTitle = isAr ? product.nameAr || product.name : product.name;
                const prodSpecs = product.specs && product.specs.length > 0
                  ? product.specs.slice(0, 3).map(s => isAr ? s.valueAr || s.value : s.value)
                  : product.tagline
                  ? (isAr && product.taglineAr ? product.taglineAr : product.tagline).split('·').map(t => t.trim()).filter(Boolean).slice(0, 3)
                  : (isAr ? ['مضخة 20 بار', 'تحكم حراري PID', 'مقبس تجاري 58مم'] : ['20-Bar Pump', 'PID Control', '58mm Group']);
                const isJustAdded = recentlyAddedId === product.id;

                return (
                  <div
                    key={product.id}
                    data-slide-index={pIdx}
                    className="w-[85vw] max-w-[340px] shrink-0 snap-center bg-white rounded-3xl p-4 flex flex-col justify-between items-center text-center border-0 shadow-sm relative overflow-hidden select-none"
                  >
                    {/* 1. TOP IMAGE (Angled / Tilted Top-Left matching Image 2) */}
                    <div
                      onClick={() => navigateTo('product-buy', String(product.id))}
                      className="w-full flex justify-start items-start pt-1 pl-1 rtl:pr-1 rtl:pl-0 cursor-pointer"
                    >
                      <div className="relative w-28 h-28 xs:w-32 xs:h-32 -rotate-12 hover:rotate-0 transition-transform duration-300 drop-shadow-sm">
                        <img
                          src={topImg}
                          alt=""
                          className="w-full h-full object-contain pointer-events-none select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/src/assets/images/hibrew_h7a_flagship_machine.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* 2. CENTER CONTENT (Matches Image 2: Centered Title, Small specs separated by |, Price Pill Button) */}
                    <div className="w-full flex flex-col items-center justify-center text-center px-1 z-10 my-1">
                      {/* Product Title */}
                      <h3
                        onClick={() => navigateTo('product-buy', String(product.id))}
                        className="text-base xs:text-lg font-black text-black tracking-tight cursor-pointer hover:text-neutral-700 transition-colors line-clamp-1"
                      >
                        {prodTitle}
                      </h3>

                      {/* Small specs line separated by | */}
                      <div className="text-[10px] text-neutral-600 font-medium flex items-center justify-center gap-1.5 flex-wrap mt-1 px-1 leading-snug">
                        {prodSpecs.map((spec, sIdx, arr) => (
                          <React.Fragment key={sIdx}>
                            <span>{spec}</span>
                            {sIdx < arr.length - 1 && <span className="text-neutral-300 font-light">|</span>}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Signature Honor-Style Price Pill Button (Matches Image 2) */}
                      <div
                        onClick={(e) => handleBuyNow(e, product)}
                        className="mt-2.5 inline-flex items-center bg-black rounded-full p-1 pl-3.5 rtl:pr-3.5 rtl:pl-1 shadow-sm active:scale-95 cursor-pointer transition-transform"
                      >
                        <span className="text-white text-xs font-bold px-1">
                          {isAr ? 'اشتر الآن' : 'Buy Now'}
                        </span>
                        <span className="bg-white text-black text-[11px] font-black px-2 py-0.5 rounded-full font-sans shadow-2xs">
                          {(Number(product.basePrice) || 0).toLocaleString()} {storeCurrency}
                        </span>
                      </div>
                    </div>

                    {/* 3. BOTTOM IMAGE (Angled / Tilted Bottom-Right matching Image 2) */}
                    <div
                      onClick={() => navigateTo('product-buy', String(product.id))}
                      className="w-full flex justify-end items-end pb-1 pr-1 rtl:pl-1 rtl:pr-0 cursor-pointer"
                    >
                      <div className="relative w-32 h-32 xs:w-36 xs:h-36 rotate-6 hover:rotate-0 transition-transform duration-300 drop-shadow-sm">
                        <img
                          src={bottomImg}
                          alt=""
                          className="w-full h-full object-contain pointer-events-none select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/src/assets/images/hibrew_h7a_flagship_machine.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom Quick Action: Add to Cart */}
                    <div className="w-full pt-2 border-0 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`flex-1 py-1.5 px-3 rounded-full font-bold text-xs border-0 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />
                            <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('product-detail', String(product.id))}
                        className="text-[11px] font-semibold text-neutral-500 hover:text-black transition-colors px-2 shrink-0 flex items-center gap-1"
                      >
                        <span>{isAr ? 'اعرف المزيد' : 'Learn More'}</span>
                        <span className="rtl:rotate-180">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dots */}
            {filteredProducts.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {filteredProducts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeMobileSlide === idx ? 'w-6 bg-black' : 'w-1.5 bg-neutral-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. Grid View (Always on Desktop/Tablet, or when Grid is chosen on Mobile) */}
        {((mobileViewMode === 'grid') || (viewMode === 'grid')) && filteredProducts.length > 0 && (
          <div className={`${mobileViewMode === 'carousel' ? 'hidden sm:grid' : 'grid'} grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6`}>
            {filteredProducts.map(product => (
              <HonorProductCard
                key={product.id}
                product={product}
                onBuyNow={(p) => handleBuyNow(undefined, p)}
                onAddToCart={(p) => handleAddToCart(undefined, p)}
              />
            ))}
          </div>
        )}

        {/* 8. Desktop List View (When list view is toggled) */}
        {viewMode === 'list' && mobileViewMode !== 'carousel' && filteredProducts.length > 0 && (
          <div className="hidden sm:flex flex-col gap-4">
            {filteredProducts.map(product => {
              const prodImg = (product as any).image || product.colors?.[0]?.image || product.images?.[0] || '/src/assets/images/hibrew_h7a_flagship_machine.png';
              const prodTitle = isAr ? product.nameAr || product.name : product.name;
              const prodTagline = isAr ? product.taglineAr || product.tagline : product.tagline;
              const isJustAdded = recentlyAddedId === product.id;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-5 border-0 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-6 group"
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div
                      onClick={() => navigateTo('product-detail', String(product.id))}
                      className="w-28 h-28 shrink-0 bg-[#F8F9FA] rounded-xl p-2 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      <img
                        src={prodImg}
                        alt={prodTitle}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/src/assets/images/hibrew_h7a_flagship_machine.png';
                        }}
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {product.badge && (
                          <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full">
                            {isAr ? product.badgeAr || product.badge : product.badge}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold">{product.rating || 4.9}</span>
                          <span className="text-neutral-400">({product.reviewCount || 15})</span>
                        </div>
                      </div>

                      <h3
                        onClick={() => navigateTo('product-detail', String(product.id))}
                        className="font-bold text-base text-neutral-900 group-hover:text-amber-800 transition-colors truncate cursor-pointer"
                      >
                        {prodTitle}
                      </h3>

                      <p className="text-xs text-neutral-500 line-clamp-1">
                        {prodTagline}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-lg font-black text-neutral-950 font-sans">
                          {(Number(product.basePrice) || 0).toLocaleString()} {storeCurrency}
                        </span>
                        {product.originalPrice && Number(product.originalPrice) > Number(product.basePrice) && (
                          <span className="text-xs text-neutral-400 line-through font-sans">
                            {Number(product.originalPrice).toLocaleString()} {storeCurrency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleBuyNow(e, product)}
                      className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-full transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isAr ? 'شراء فوري' : 'Buy Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`px-5 py-2.5 font-bold text-xs rounded-full border-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          <span>{isAr ? 'تمت الإضافة' : 'Added'}</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />
                          <span>{isAr ? 'أضف للسلة' : 'Add to Cart'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('product-detail', String(product.id))}
                      className="p-2.5 text-neutral-500 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
                      title={isAr ? 'عرض التفاصيل' : 'View Details'}
                    >
                      <ChevronRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* 8.5. Bottom Featured Series Showcase Carousel (Only in Shop Page) */}
      <ShopFeaturedCarouselSection products={masterProducts} storeCurrency={storeCurrency} />

      {/* 9. Trust & Guarantees Bottom Banner */}
      <section className="bg-transparent pt-2 pb-10 sm:pb-14 px-4 sm:px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 text-center">
          
          <div className="space-y-1 bg-white rounded-2xl border-0 shadow-sm px-3 py-5 sm:py-6 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-neutral-900">
              {isAr ? 'شحن سريع لجميع المدن' : 'Express KSA Delivery'}
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-normal">
              {isAr ? 'توصيل لباب منزلك خلال 24-48 ساعة' : 'To your doorstep in 24-48 hours'}
            </p>
          </div>

          <div className="space-y-1 bg-white rounded-2xl border-0 shadow-sm px-3 py-5 sm:py-6 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-neutral-900">
              {isAr ? 'ضمان رسمي سنتين' : 'Official 2-Year Warranty'}
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-normal">
              {isAr ? 'قطع غيار وصيانة معتمدة بالمملكة' : 'Genuine parts & certified KSA centers'}
            </p>
          </div>

          <div className="space-y-1 bg-white rounded-2xl border-0 shadow-sm px-3 py-5 sm:py-6 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-neutral-900">
              {isAr ? 'طرق دفع مرنة وآمنة' : 'Flexible & Secure Payment'}
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-normal">
              {isAr ? 'مدى، فيزا، تابي، تمارا والدفع عند الاستلام' : 'Mada, Apple Pay, Tabby, Tamara & COD'}
            </p>
          </div>

          <div className="space-y-1 bg-white rounded-2xl border-0 shadow-sm px-3 py-5 sm:py-6 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-neutral-900">
              {isAr ? 'دعم فني واستشارات باريستا' : 'Pro Barista Consultation'}
            </p>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-normal">
              {isAr ? 'فريق متخصص لمعايرة واستخلاص القهوة' : 'Dedicated support for grind & extraction'}
            </p>
          </div>

        </div>
      </section>

    </div>
  );
};
