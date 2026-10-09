import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS, EIGHT_FEATURED_CATEGORIES } from '../data/mockData';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import {
  Filter,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Grid,
  List,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Gift,
  Crown,
  Heart
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const { language, selectedCategory, setSelectedCategory, setCurrentPage, products } = useApp();
  const isAr = language === 'ar';
  const catalogProducts = products && products.length > 0 ? products : PRODUCTS;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMax, setPriceMax] = useState<number>(800);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination
  const [currentPageNum, setCurrentPageNum] = useState<number>(1);
  const itemsPerPage = 8;

  // Universal Intelligent Matcher: Ensures no category click ever shows an empty page!
  const isCategoryMatch = (product: Product, targetCat: string | null): boolean => {
    if (!targetCat || targetCat === 'all' || targetCat === 'الكل' || targetCat.trim() === '') {
      return true;
    }

    const t = targetCat.toLowerCase().trim();

    // 1. Direct equality
    if (product.category.toLowerCase() === t || product.categoryEn.toLowerCase() === t) return true;
    if (product.categorySlug && product.categorySlug.toLowerCase() === t) return true;

    // 2. Check in product occasions
    if (product.occasions && product.occasions.some(occ => occ.toLowerCase().includes(t) || t.includes(occ.toLowerCase()))) {
      return true;
    }

    // 3. Check in product tags
    if (product.tags && product.tags.some(tag => tag.toLowerCase().includes(t) || t.includes(tag.toLowerCase()))) {
      return true;
    }

    // 4. Semantic grouping & keywords
    if (t.includes('مخفض') || t.includes('عروض') || t.includes('خصم') || t.includes('discount')) {
      return !!product.originalPrice || product.category.includes('مخفض') || Boolean(product.badge && product.badge.includes('خصم'));
    }

    if (t.includes('شوك') || t.includes('باتشي') || t.includes('بستاني') || t.includes('choc') || t.includes('patchi')) {
      return product.category.includes('شوكولاتة') || product.name.includes('شوكولاتة') || product.name.includes('باتشي') || product.nameEn.toLowerCase().includes('patchi');
    }

    if (t.includes('كيك') || t.includes('بنتو') || t.includes('cake') || t.includes('bento')) {
      return product.category.includes('كيك') || product.name.includes('كيك') || product.nameEn.toLowerCase().includes('cake');
    }

    if (t.includes('قهوة') || t.includes('حلا') || t.includes('ضيافة') || t.includes('coffee')) {
      return product.category.includes('قهوة') || product.name.includes('قهوة') || product.name.includes('حلا') || product.nameEn.toLowerCase().includes('coffee');
    }

    if (t.includes('فاز') || t.includes('كريستال') || t.includes('vase')) {
      return product.category.includes('فاز') || product.name.includes('فاز') || product.nameEn.toLowerCase().includes('vase');
    }

    if (t.includes('طبيعي') || t.includes('باقات') || t.includes('ورد') || t.includes('bouquet') || t.includes('rose') || t.includes('boxes')) {
      return product.category.includes('باقات') || product.category.includes('ورد') || product.category.toLowerCase().includes('bouquet');
    }

    if (t.includes('هدايا') || t.includes('ملك') || t.includes('سلة') || t.includes('hamper') || t.includes('gift')) {
      return product.category.includes('هدايا') || product.category.includes('أطقم') || product.category.toLowerCase().includes('gift') || product.category.toLowerCase().includes('hamper');
    }

    if (t.includes('مواليد') || t.includes('مولود') || t.includes('newborn')) {
      return (product.occasions && product.occasions.some(o => o.includes('مواليد'))) || product.name.includes('مولود');
    }

    if (t.includes('تخرج') || t.includes('graduation')) {
      return (product.occasions && product.occasions.some(o => o.includes('تخرج'))) || product.name.includes('تخرج');
    }

    if (t.includes('مواجيب') || t.includes('لوحات') || t.includes('mawajeeb')) {
      return (product.occasions && product.occasions.some(o => o.includes('مواجيب'))) || product.name.includes('مواجيب');
    }

    if (t.includes('زواج') || t.includes('عروس') || t.includes('حب') || t.includes('wedding')) {
      return (product.occasions && product.occasions.some(o => o.includes('زواج'))) || product.category.includes('رومانسية') || product.name.includes('عروس') || product.name.includes('زواج');
    }

    if (t.includes('ميلاد') || t.includes('birthday')) {
      return (product.occasions && product.occasions.some(o => o.includes('ميلاد'))) || product.category.includes('ميلاد') || product.name.includes('ميلاد');
    }

    if (t.includes('شفاء') || t.includes('سلامة')) {
      return (product.occasions && product.occasions.some(o => o.includes('شفاء'))) || product.name.includes('سلامة');
    }

    // 5. Fallback partial match on name or description
    if (product.name.toLowerCase().includes(t) || product.nameEn.toLowerCase().includes(t)) {
      return true;
    }

    return false;
  };

  // Filter products
  const filtered = catalogProducts.filter((product) => {
    // Category match
    if (!isCategoryMatch(product, selectedCategory)) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        product.name.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Price
    if (product.price > priceMax) return false;

    // Rating
    if (minRating > 0 && product.rating < minRating) return false;

    // In Stock
    if (onlyInStock && !product.inStock) return false;

    return true;
  });

  // Fallback products if filtered is empty (guarantee page is never blank)
  const displayProducts = filtered.length > 0 ? filtered : catalogProducts.slice(0, 8);

  // Sort
  const sorted = [...displayProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  // Pagination slice
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPageNum - 1) * itemsPerPage, currentPageNum * itemsPerPage);

  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setPriceMax(600);
    setMinRating(0);
    setOnlyInStock(false);
    setCurrentPageNum(1);
  };

  // Quick filter pills
  const quickPills = [
    { label: isAr ? 'الكل' : 'All', cat: null },
    { label: isAr ? 'باقات الورد الطبيعي' : 'Natural Flowers', cat: 'باقات الورود الطبيعية' },
    { label: isAr ? 'فازات ورد طبيعي' : 'Vases', cat: 'فازات ورود طبيعية' },
    { label: isAr ? 'ورد وشوكولاتة باتشي' : 'Patchi & Roses', cat: 'ورد وشوكولاتة بلجيكية فاخرة' },
    { label: isAr ? 'ورد وقهوة وحلا' : 'Coffee & Sweets', cat: 'ورد و قهوة و حلا' },
    { label: isAr ? 'ورد وكيك' : 'Cakes & Roses', cat: 'ورد و كيك' },
    { label: isAr ? 'باقات مخفضة' : 'Discounted Deals', cat: 'باقات ورود طبيعية مخفضة' },
    { label: isAr ? 'لوحات مواجيب' : 'Mawajeeb', cat: 'لوحات مواجيب' },
    { label: isAr ? 'هدايا المواليد' : 'Newborn', cat: 'هدايا المواليد' },
    { label: isAr ? 'هدايا التخرج' : 'Graduation', cat: 'هدايا التخرج' },
  ];

  return (
    <div className="py-6 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
      
      {/* Breadcrumb */}
      <div className="text-xs text-[#8c8275] mb-5 flex items-center gap-2">
        <button
          onClick={() => setCurrentPage('home')}
          className="hover:text-[#102a1c] transition-colors cursor-pointer"
        >
          {isAr ? 'الرئيسية' : 'Home'}
        </button>
        <span>/</span>
        <button
          onClick={() => setSelectedCategory(null)}
          className="hover:text-[#102a1c] transition-colors cursor-pointer"
        >
          {isAr ? 'المتجر' : 'Catalog'}
        </button>
        {selectedCategory && (
          <>
            <span>/</span>
            <span className="text-[#102a1c] font-semibold">{selectedCategory}</span>
          </>
        )}
      </div>

      {/* Dynamic Category Hero Header Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#102a1c] via-[#163825] to-[#102a1c] text-[#FAF9F5] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#e6ca98]/10 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6ca98]/20 text-[#e6ca98] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'تشكيلات هدايا مكة الفاخرة' : 'Mecca Gifts Luxury Edits'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-serif">
              {selectedCategory || (isAr ? 'كافة باقات وهدايا المتجر' : 'All Collections & Floral Designs')}
            </h1>
            <p className="text-xs sm:text-sm text-[#e8e4dc]/80 mt-1 max-w-2xl font-light">
              {isAr
                ? 'أجود أنواع الزهور الطبيعية الهولندية والإكوادورية والهدايا الملكية مع توصيل مبرد وسريع في مكة'
                : 'Finest imported fresh blooms and royal bespoke gifts with refrigerated express delivery across Mecca'}
            </p>
          </div>

          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer shrink-0"
            >
              {isAr ? 'عرض كافة الأقسام' : 'Show All Collections'}
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Category Quick Filter Pills */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {quickPills.map((pill, idx) => {
          const isActive = (!selectedCategory && pill.cat === null) || (selectedCategory === pill.cat);
          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedCategory(pill.cat);
                setCurrentPageNum(1);
              }}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                isActive
                  ? 'bg-[#102a1c] text-[#e6ca98] shadow-md scale-102'
                  : 'bg-white text-[#495057] border border-[#e8e4dc] hover:border-[#102a1c] hover:bg-[#FAF9F5]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Sidebar Filters + Products Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        
        {/* SIDEBAR FILTERS (3 Cols) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#e8e4dc] rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 sticky top-28">
            
            {/* Sidebar Title & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#102a1c]">
                <Filter className="w-4 h-4" />
                <span>{isAr ? 'تصفية المنتجات' : 'Filter Products'}</span>
              </div>

              <button
                onClick={resetFilters}
                className="text-[11px] text-[#8c8275] hover:text-[#8b263e] flex items-center gap-1 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
              </button>
            </div>

            {/* 1. Search Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#102a1c] block">
                {isAr ? 'بحث بالاسم:' : 'Search keyword:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPageNum(1);
                  }}
                  placeholder={isAr ? 'اسم الباقة، الزهور...' : 'Search bouquet...'}
                  className="w-full bg-[#FAF9F5] border border-[#d6cfc0] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#102a1c]"
                />
                <Search className="w-4 h-4 text-[#8c8275] absolute left-2.5 rtl:left-2.5 rtl:right-auto ltr:right-2.5 ltr:left-auto top-2.5" />
              </div>
            </div>

            {/* 2. Category Filter List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#102a1c] block">
                {isAr ? 'الأقسام الرئيسية:' : 'Categories:'}
              </label>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setCurrentPageNum(1);
                  }}
                  className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    !selectedCategory ? 'bg-[#102a1c] text-[#e6ca98] font-bold' : 'hover:bg-[#f0ece4] text-[#555]'
                  }`}
                >
                  <span>{isAr ? 'كافة الأقسام (الكل)' : 'All Collections'}</span>
                  <span className="font-mono text-[10px]">{catalogProducts.length}</span>
                </button>

                {quickPills.slice(1).map((pill, idx) => {
                  const isSelected = selectedCategory === pill.cat;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(pill.cat);
                        setCurrentPageNum(1);
                      }}
                      className={`w-full text-start px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#102a1c] text-[#e6ca98] font-bold' : 'hover:bg-[#f0ece4] text-[#555]'
                      }`}
                    >
                      <span className="truncate">{pill.label}</span>
                      <span className="font-mono text-[10px] text-[#8c8275]">✓</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Price Filter Range */}
            <div className="space-y-2 pt-2 border-t border-[#f0ede6]">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#102a1c]">{isAr ? 'السعر حتى:' : 'Max Price:'}</span>
                <span className="font-mono font-bold text-[#102a1c]">{priceMax} {isAr ? 'ر.س' : 'SAR'}</span>
              </div>
              <input
                type="range"
                min="180"
                max="600"
                step="20"
                value={priceMax}
                onChange={(e) => {
                  setPriceMax(Number(e.target.value));
                  setCurrentPageNum(1);
                }}
                className="w-full accent-[#102a1c] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8c8275] font-mono">
                <span>180 ر.س</span>
                <span>600 ر.س</span>
              </div>
            </div>

            {/* 4. Customer Rating Filter */}
            <div className="space-y-2 pt-2 border-t border-[#f0ede6]">
              <label className="text-xs font-bold text-[#102a1c] block">
                {isAr ? 'تقييم العملاء:' : 'Customer Rating:'}
              </label>
              <div className="space-y-1">
                {[
                  { stars: 0, label: isAr ? 'جميع التقييمات' : 'All Ratings' },
                  { stars: 5, label: isAr ? '5 نجوم فقط (ممتاز)' : '5 Stars Only' },
                  { stars: 4.8, label: isAr ? '4.8 فأعلى (الأعلى طلباً)' : '4.8 & Above' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setMinRating(item.stars);
                      setCurrentPageNum(1);
                    }}
                    className={`w-full text-start px-2 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                      minRating === item.stars ? 'bg-[#102a1c]/10 text-[#102a1c] font-bold' : 'text-[#6c757d]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.stars > 0 && <span className="text-[#e6a817] font-mono">★ {item.stars}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. In Stock Only Toggle */}
            <div className="pt-2 border-t border-[#f0ede6] flex items-center justify-between">
              <label className="text-xs font-bold text-[#102a1c] cursor-pointer" htmlFor="inStockToggle">
                {isAr ? 'المتوفر في المخزن فقط' : 'In Stock Only'}
              </label>
              <input
                id="inStockToggle"
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => {
                  setOnlyInStock(e.target.checked);
                  setCurrentPageNum(1);
                }}
                className="w-4 h-4 rounded text-[#102a1c] accent-[#102a1c] cursor-pointer"
              />
            </div>

          </div>
        </aside>

        {/* PRODUCTS GRID CANVAS (9 Cols) */}
        <section className="lg:col-span-9 space-y-6">
          
          {/* Top Sort & View Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#e8e4dc]">
            <div className="text-xs text-[#7a7164]">
              {isAr ? 'عرض' : 'Showing'}{' '}
              <span className="font-bold text-[#102a1c]">{sorted.length}</span>{' '}
              {isAr ? 'هدية وتنسيق فاخر متوفر للتوصيل' : 'luxury gifts available'}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#8c8275]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#FAF9F5] border border-[#d6cfc0] rounded-xl px-3 py-1.5 text-xs text-[#102a1c] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="featured">{isAr ? 'الأكثر طلباً ومميز' : 'Featured'}</option>
                  <option value="price-low">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                  <option value="price-high">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  <option value="rating">{isAr ? 'أعلى تقييم' : 'Highest Rated'}</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-[#d6cfc0] rounded-xl overflow-hidden bg-[#FAF9F5]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#102a1c] text-white' : 'text-[#8c8275] hover:text-[#102a1c]'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#102a1c] text-white' : 'text-[#8c8275] hover:text-[#102a1c]'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Empty Fallback Notice if exact filter had 0 results */}
          {filtered.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <span>{isAr ? 'لم يتم العثور على نتائج دقيقة للتصفية، نعرض لك هذه التشكيلات المميزة البديلة.' : 'No exact matches found. Displaying recommended alternatives below.'}</span>
              <button
                onClick={resetFilters}
                className="font-bold underline text-amber-950 hover:text-black cursor-pointer"
              >
                {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
              </button>
            </div>
          )}

          {/* Product Cards Grid / List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-[#e8e4dc] rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full sm:w-36 h-36 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 space-y-1 text-start w-full">
                    <span className="text-[11px] text-[#8c8275] uppercase font-bold">
                      {isAr ? product.category : product.categoryEn}
                    </span>
                    <h3 className="text-base font-bold text-[#102a1c]">
                      {isAr ? product.name : product.nameEn}
                    </h3>
                    <p className="text-xs text-[#666] line-clamp-2">
                      {isAr ? product.description : product.descriptionEn}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-lg font-bold font-mono text-[#102a1c]">
                        {product.price} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-[#999] line-through font-mono">
                          {product.originalPrice} ر.س
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full sm:w-auto shrink-0">
                    <ProductCard product={product} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPageNum((prev) => Math.max(1, prev - 1))}
                disabled={currentPageNum === 1}
                className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white disabled:opacity-40 flex items-center justify-center hover:bg-[#102a1c] hover:text-white transition-colors cursor-pointer"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPageNum(i + 1)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    currentPageNum === i + 1
                      ? 'bg-[#102a1c] text-[#e6ca98] shadow-md'
                      : 'bg-white border border-[#d6cfc0] hover:bg-[#FAF9F5] text-[#333]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPageNum((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageNum === totalPages}
                className="w-9 h-9 rounded-full border border-[#d6cfc0] bg-white disabled:opacity-40 flex items-center justify-center hover:bg-[#102a1c] hover:text-white transition-colors cursor-pointer"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

        </section>

      </div>

    </div>
  );
};
