import fs from 'fs';

let content = fs.readFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', 'utf8');

const filterBarStart = content.indexOf('{/* Filter Bar */}');
const filterBarEnd = content.indexOf('{/* Full Grid */}', filterBarStart);

if (filterBarStart !== -1 && filterBarEnd !== -1) {
  const newAdvanceFilterSuite = `{/* ========================================================
              ADVANCE AUTOMOTIVE FILTER SUITE (فلتر متقدم للماركات والموديلات والألوان)
              ======================================================== */}
          <div className="space-y-4">
            {/* 1. Quick Brand Pills with Logos (10 Companies) */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#3e0f77]" />
                  <span>{isAr ? 'اختر ماركة سيارتك (10 شركات كبرى):' : 'Select Car Brand (10 Major Companies):'}</span>
                </span>
                {formMake !== 'all' && (
                  <button
                    onClick={() => { setFormMake('all'); setFormModel('all'); }}
                    className="text-[11px] font-bold text-[#3e0f77] hover:underline cursor-pointer"
                  >
                    {isAr ? 'عرض كل الماركات' : 'All Brands'}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  onClick={() => { setFormMake('all'); setFormModel('all'); }}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 \${
                    formMake === 'all'
                      ? 'bg-[#3e0f77] text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }\`}
                >
                  <span>{isAr ? 'جميع الشركات' : 'All Brands'}</span>
                </button>

                {CAR_BRANDS.slice(0, 10).map(b => {
                  const isSel = formMake.toLowerCase() === b.nameEn.toLowerCase();
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        setFormMake(isSel ? 'all' : b.nameEn.toLowerCase());
                        setFormModel('all');
                      }}
                      className={\`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-2 border \${
                        isSel
                          ? 'bg-purple-50 border-[#3e0f77] text-[#3e0f77] ring-2 ring-[#3e0f77]/30 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }\`}
                    >
                      <img src={b.logo} alt={b.nameEn} className="w-4 h-4 object-contain" />
                      <span>{isAr ? b.nameAr : b.nameEn}</span>
                      <span className="text-[10px] opacity-60">({b.productCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Advance Filters Controls Grid */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                {/* Model dropdown */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'موديل السيارة:' : 'Vehicle Model:'}</label>
                  <select 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع الموديلات' : 'All Models'}</option>
                    {availableModels.map((m, idx) => (
                      <option key={idx} value={m.modelEn}>{isAr ? m.modelAr : m.modelEn}</option>
                    ))}
                  </select>
                </div>

                {/* Material Filter */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'نوع الخامة:' : 'Material:'}</label>
                  <select 
                    value={catalogMaterialFilter} 
                    onChange={e => setCatalogMaterialFilter(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع الخامات' : 'All Materials'}</option>
                    <option value="leather">{isAr ? 'جلد فاخر مطابق للوكالة' : 'Luxury OEM Leather'}</option>
                    <option value="fabric">{isAr ? 'قماش أصلي بارد' : 'Cooling Fabric'}</option>
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'سنة الصنع:' : 'Model Year:'}</label>
                  <select 
                    value={formYear} 
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
                  >
                    <option value="all">{isAr ? 'جميع السنوات' : 'All Years'}</option>
                    {availableYears.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'الترتيب حسب:' : 'Sort By:'}</label>
                  <select 
                    value={catalogSort} 
                    onChange={e => setCatalogSort(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 font-bold cursor-pointer text-xs focus:ring-2 focus:ring-[#3e0f77] focus:outline-none"
                  >
                    <option value="featured">{isAr ? 'الأكثر طلباً ومبيعاً' : 'Most Popular & Best Sellers'}</option>
                    <option value="price-asc">{isAr ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                    <option value="price-desc">{isAr ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                  </select>
                </div>

                {/* Search query box */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-700 font-bold mb-1">{isAr ? 'بحث سريع:' : 'Quick Search:'}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={isAr ? 'كامري، يوكن، جلد...' : 'Camry, Yukon...'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3e0f77]"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* 3. Interactive Color Swatches Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#3e0f77]" />
                    <span>{isAr ? 'فلترة حسب اللون:' : 'Filter by Color:'}</span>
                  </span>
                  
                  <button
                    onClick={() => setFormColor('all')}
                    className={\`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all \${
                      formColor === 'all'
                        ? 'bg-[#3e0f77] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }\`}
                  >
                    {isAr ? 'كل الألوان' : 'All'}
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SEAT_COLORS.map(c => {
                      const isColActive = formColor === c.nameAr;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setFormColor(isColActive ? 'all' : c.nameAr)}
                          className={\`px-2 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer transition-all \${
                            isColActive
                              ? 'border-[#3e0f77] bg-purple-50 ring-2 ring-[#3e0f77]/30 scale-105 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }\`}
                          title={isAr ? c.nameAr : c.nameEn}
                        >
                          <span className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs" style={{ backgroundColor: c.hex }} />
                          <span className="text-[10px] font-bold text-slate-700">{isAr ? c.nameAr : c.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset button */}
                <button 
                  onClick={handleResetFilter}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح الفلاتر' : 'Reset All'}</span>
                </button>
              </div>

              {/* Active Filter Chips */}
              {(formMake !== 'all' || formModel !== 'all' || formYear !== 'all' || formColor !== 'all' || catalogMaterialFilter !== 'all' || searchQuery) && (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">{isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
                  {formMake !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formMake.toUpperCase()}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormMake('all')} />
                    </span>
                  )}
                  {formModel !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formModel}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormModel('all')} />
                    </span>
                  )}
                  {formColor !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formColor}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormColor('all')} />
                    </span>
                  )}
                  {catalogMaterialFilter !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{catalogMaterialFilter === 'leather' ? (isAr ? 'جلد فاخر' : 'Leather') : (isAr ? 'قماش أصلي' : 'Fabric')}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setCatalogMaterialFilter('all')} />
                    </span>
                  )}
                  {formYear !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>{formYear}</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFormYear('all')} />
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#3e0f77] text-[10px] font-bold flex items-center gap-1">
                      <span>"{searchQuery}"</span>
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>\n\n          `;

  content = content.substring(0, filterBarStart) + newAdvanceFilterSuite + content.substring(filterBarEnd);
  console.log('Advance filter suite updated successfully!');
  fs.writeFileSync('src/themes/saudiaTransport/SaudiaTransportThemeView.tsx', content, 'utf8');
} else {
  console.log('Error: could not find filter bar start or end');
}
