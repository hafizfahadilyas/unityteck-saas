import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

// 1. Ensure TOP_10_SEAT_COVERS and HOME_PAGE_PRODUCTS are imported
if (!content.includes('TOP_10_SEAT_COVERS')) {
  content = content.replace(
    'FEATURED_HOME_SEATS,',
    'TOP_10_SEAT_COVERS,\n  HOME_PAGE_PRODUCTS,\n  FEATURED_HOME_SEATS,'
  );
}

// 2. Locate and replace the home seat covers section with TOP 10 SHOWCASE + HOME 108 PRODUCTS GRID
const oldHomeSeatsSectionStart = content.indexOf('<section id="featured-seats-section"');
const oldHomeSeatsSectionEnd = content.indexOf('</section>', oldHomeSeatsSectionStart) + 10;

if (oldHomeSeatsSectionStart !== -1 && oldHomeSeatsSectionEnd !== -1) {
  const newSections = `{/* ========================================================
                SECTION 3A: TOP 10 AUTHENTIC SEAT COVERS (أفضل 10 تلبيسات مقاعد أصلية)
                ======================================================== */}
            <section id="top10-seats-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black mb-2 shadow-xs border border-amber-300/50">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{isAr ? 'الأكثر طلباً ومبيعاً لـ 10 ماركات سيارات كبرى' : 'Top 10 Best Sellers for 10 Premier Car Brands'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#d5a027]" />
                    <span>{isAr ? 'أفضل 10 تلبيسات مقاعد سيارات أصلية' : 'Top 10 Authentic Seat Covers'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? 'صور واقعية 100% ومطابقة أبعاد الوكالة ليوكن، كامري، اكورد، اكسبديشن، مازدا، برادو، سيراتو، اكسنت، جيب لكزس' : 'Real photos with 100% OEM fit for Yukon, Camry, Accord, Expedition, Mazda, Prado, Cerato, Accent & Lexus'}
                  </p>
                </div>

                <button
                  onClick={() => setViewMode('catalog')}
                  className="text-xs font-bold text-[#3e0f77] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <span>{isAr ? 'عرض الكل في صفحة المنتجات' : 'View all in catalog'}</span>
                  {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Top 10 Showcase Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {TOP_10_SEAT_COVERS.map(product => {
                  const userColor = cardSelectedColors[product.id];
                  const currentImage = userColor ? userColor.image : product.image;

                  return (
                    <div key={product.id} className="alsaeedi-product-card group relative">
                      {/* Top Rank Badge */}
                      <div className="absolute top-2.5 left-2.5 z-20 bg-gradient-to-r from-[#d5a027] to-[#f6c344] text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-slate-900 text-slate-900" />
                        <span>{isAr ? 'توب 10' : 'TOP 10'}</span>
                      </div>

                      {/* Image Frame */}
                      <div 
                        className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(product);
                          setSelectedProductGalleryImg(product.image);
                          setDetailColor(userColor || SEAT_COLORS[0]);
                          setDetailQuantity(1);
                        }}
                      >
                        <img 
                          src={currentImage} 
                          alt={product.name} 
                          className="w-full h-full object-cover img-zoom"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 right-2.5 bg-[#3e0f77]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          {product.brand}
                        </span>

                        {/* Gallery photos count pill */}
                        {product.galleryUrls && product.galleryUrls.length > 1 && (
                          <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>{product.galleryUrls.length} {isAr ? 'صور' : 'photos'}</span>
                          </span>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span className="font-bold text-slate-800 text-[11px]">{product.rating || 5.0}</span>
                              <span className="text-[10px] text-slate-400">({product.reviewsCount || 95})</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{product.sku}</span>
                          </div>

                          <h4 
                            onClick={() => {
                              setSelectedProduct(product);
                              setSelectedProductGalleryImg(product.image);
                              setDetailColor(userColor || SEAT_COLORS[0]);
                            }}
                            className="font-bold text-slate-900 text-xs hover:text-[#3e0f77] transition-colors line-clamp-2 mt-1 cursor-pointer leading-snug"
                          >
                            {isAr ? (product.nameAr || product.name) : (product.nameEn || product.name)}
                          </h4>

                          {/* Color preview swatches */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-semibold line-clamp-1">
                              {userColor ? (isAr ? userColor.nameAr : userColor.nameEn) : (isAr ? 'اختر اللون' : 'Colors')}
                            </span>
                            <div className="flex items-center gap-1">
                              {SEAT_COLORS.slice(0, 4).map(c => (
                                <button
                                  key={c.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardSelectedColors(prev => ({ ...prev, [product.id]: c }));
                                  }}
                                  className={\`w-3.5 h-3.5 rounded-full border border-black/15 transition-transform hover:scale-125 cursor-pointer \${userColor?.id === c.id ? 'ring-2 ring-[#3e0f77] scale-110' : ''}\`}
                                  style={{ backgroundColor: c.hex }}
                                  title={isAr ? c.nameAr : c.nameEn}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-sm sm:text-base font-black text-slate-900">
                              {product.discountedPrice || product.price}
                            </span>
                            <span className="text-[10px] font-bold text-[#b07e16] mr-1 ml-1">
                              {isAr ? 'ر.س' : 'SAR'}
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="text-[9px] text-slate-400 line-through">
                                {product.originalPrice}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={\`https://wa.me/966597757086?text=\${encodeURIComponent('السلام عليكم، أرغب في الاستفسار عن: ' + product.name + ' بسعر ' + product.price + ' ريال')}\`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title={isAr ? 'طلب عبر واتساب' : 'WhatsApp Order'}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            <button 
                              onClick={() => addToCart(product, 1, userColor || SEAT_COLORS[0])}
                              className="p-1.5 rounded-lg bg-[#3e0f77] hover:bg-[#25074d] text-white transition-colors cursor-pointer"
                              title={isAr ? 'إضافة للسلة' : 'Add to Cart'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ========================================================
                SECTION 3B: HOME 108 CURATED SEAT COVERS CATALOG GRID (108 منتج على الرئيسية)
                ======================================================== */}
            <section id="featured-seats-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-[#3e0f77] text-xs font-black mb-2 shadow-xs border border-purple-200">
                    <Car className="w-3.5 h-3.5 text-[#3e0f77]" />
                    <span>{isAr ? '10 شركات كبرى · موديلات متكاملة' : '10 Major Brands · Full Models'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#d5a027]" />
                    <span>{isAr ? 'تشكيلة تلابيس مقاعد السيارات الشاملة (108 منتج معروض)' : 'Complete Seat Covers Collection (108 Products Displayed)'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr ? \`معروض على الرئيسية: \${Math.min(homeSeatDisplayLimit, HOME_PAGE_PRODUCTS.length)} من أصل 108 منتج · تصفح باقي المنتجات وفلاتر الألوان في صفحة المنتجات\` : \`Showing \${Math.min(homeSeatDisplayLimit, HOME_PAGE_PRODUCTS.length)} of 108 products on home page · Explore full catalog with color filters\`}
                  </p>
                </div>

                <button
                  onClick={() => setViewMode('catalog')}
                  className="px-4 py-2 bg-[#127bfe] hover:bg-[#0048cb] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
                >
                  <span>{isAr ? 'تصفح صفحة المنتجات مع الفلاتر' : 'Open Products Page with Filters'}</span>
                  {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Product Cards Grid (2-columns on mobile, 4 on desktop) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                {HOME_PAGE_PRODUCTS.slice(0, homeSeatDisplayLimit).map(product => {
                  const liveProduct = currentProducts?.find(p => p.id === product.id) || product;
                  const productColors = getProductColors(liveProduct);
                  const userColor = cardSelectedColors[liveProduct.id];
                  const currentImage = userColor ? userColor.image : liveProduct.image;
                  const isBestSeller = liveProduct.tags?.includes('best seller') || liveProduct.id.includes('custom');

                  return (
                    <div key={liveProduct.id} className="alsaeedi-product-card group relative">
                      {/* Best Seller Ribbon Badge */}
                      {isBestSeller && (
                        <div className="absolute top-2.5 left-2.5 z-20 bg-amber-500 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-slate-900 text-slate-900" />
                          <span>best seller</span>
                        </div>
                      )}

                      {/* Image Frame */}
                      <div 
                        className="relative aspect-square overflow-hidden bg-slate-100 cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(liveProduct);
                          setSelectedProductGalleryImg(liveProduct.image);
                          setDetailColor(userColor || productColors[0]);
                          setDetailQuantity(1);
                        }}
                      >
                        <img 
                          src={currentImage} 
                          alt={liveProduct.name} 
                          className="w-full h-full object-cover img-zoom"
                          loading="lazy"
                        />
                        <span className="absolute top-2.5 right-2.5 bg-[#3e0f77]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                          {liveProduct.brand}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-800">{liveProduct.rating || 5.0}</span>
                            <span className="text-[10px] text-slate-400">({liveProduct.reviewsCount || 120})</span>
                          </div>

                          <h4 
                            onClick={() => {
                              setSelectedProduct(liveProduct);
                              setSelectedProductGalleryImg(liveProduct.image);
                              setDetailColor(userColor || productColors[0]);
                            }}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-[#3e0f77] transition-colors line-clamp-2 mt-1 cursor-pointer leading-snug"
                          >
                            {isAr ? (liveProduct.nameAr || liveProduct.name) : (liveProduct.nameEn || liveProduct.name)}
                          </h4>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {liveProduct.subtitle}
                          </p>

                          {/* Interactive Color Dots */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">
                              {userColor ? (isAr ? userColor.nameAr : userColor.nameEn) : (isAr ? 'ألوان أصلية متوفرة' : 'Available Colors')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {productColors.map(c => (
                                <button
                                  key={c.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardSelectedColors(prev => ({ ...prev, [liveProduct.id]: c }));
                                  }}
                                  className={\`color-swatch-dot \${userColor?.id === c.id ? 'active' : ''}\`}
                                  style={{ backgroundColor: c.hex }}
                                  title={isAr ? c.nameAr : c.nameEn}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-base sm:text-lg font-black text-slate-900">
                              {liveProduct.discountedPrice || liveProduct.price}
                            </span>
                            <span className="text-[11px] font-bold text-[#b07e16] mr-1 ml-1">
                              {isAr ? 'ر.س' : 'SAR'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedProduct(liveProduct);
                                setSelectedProductGalleryImg(liveProduct.image);
                                setDetailColor(userColor || productColors[0]);
                              }}
                              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#3e0f77] font-bold text-xs transition-colors cursor-pointer"
                              title={isAr ? 'معاينة سريعة' : 'Quick View'}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              onClick={() => addToCart(liveProduct, 1, userColor || productColors[0])}
                              className="p-2 rounded-xl btn-bashayer-gold text-xs font-black flex items-center gap-1 cursor-pointer"
                              title={isAr ? 'إضافة للسلة' : 'Add to Cart'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more button up to 108 */}
              {homeSeatDisplayLimit < HOME_PAGE_PRODUCTS.length && (
                <div className="text-center pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setHomeSeatDisplayLimit(prev => Math.min(prev + 24, 108))}
                    className="px-6 py-3 bg-white border border-[#3e0f77] text-[#3e0f77] hover:bg-purple-50 font-bold text-xs rounded-full shadow-sm cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? \`عرض المزيد من الـ 108 منتج (\${Math.min(homeSeatDisplayLimit, HOME_PAGE_PRODUCTS.length)}/\${HOME_PAGE_PRODUCTS.length})\` : \`Load More (\${Math.min(homeSeatDisplayLimit, HOME_PAGE_PRODUCTS.length)}/\${HOME_PAGE_PRODUCTS.length})\`}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('catalog')}
                    className="px-6 py-3 bg-[#3e0f77] hover:bg-[#25074d] text-white font-bold text-xs rounded-full shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
                  >
                    <span>{isAr ? 'تصفح كافة المنتجات في صفحة الكتالوج' : 'View All in Catalog'}</span>
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </section>`;

  content = content.substring(0, oldHomeSeatsSectionStart) + newSections + content.substring(oldHomeSeatsSectionEnd);
  console.log('Home sections updated successfully!');
} else {
  console.log('Error locating oldHomeSeatsSection');
}

fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
