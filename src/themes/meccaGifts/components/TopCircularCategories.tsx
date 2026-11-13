import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { useStorefrontCategories } from '../../../hooks/useStorefrontCategories';
import { ArrowLeft, ArrowRight, Edit3 } from 'lucide-react';
import { handleImageError, FALLBACK_PRODUCT_IMAGE } from '../../../utils/imageFallback';

export interface VisualCategoryItem {
  id: string;
  name: string;
  nameEn?: string;
  image: string;
  badge?: string;
  link?: string;
  count?: number;
}

export interface TopCircularCategoriesProps {
  isBuilderMode?: boolean;
  categories?: VisualCategoryItem[];
  titleAr?: string;
  titleEn?: string;
  columns?: number;
  selectedCategoryIndex?: number | null;
  onSelectCategory?: (index: number) => void;
}

export const TopCircularCategories: React.FC<TopCircularCategoriesProps> = ({
  isBuilderMode = false,
  categories,
  titleAr,
  titleEn,
  columns = 4,
  selectedCategoryIndex = null,
  onSelectCategory,
}) => {
  const { language, navigateToCategory, setCurrentPage, setSelectedCategory } = useApp();
  const { activeStore, currentProducts } = useTenant();
  const isAr = language === 'ar';
  const { circles, findByName, childrenOf } = useStorefrontCategories(
    activeStore?.id,
    currentProducts || [],
    { isAr, includeAll: false },
  );

  const categoryList: VisualCategoryItem[] = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => ({
        ...c,
        name: isAr ? c.name : c.nameEn || c.name,
      }));
    }
    return circles.map((c) => ({
      id: c.id,
      name: isAr ? c.nameAr : c.nameEn,
      nameEn: c.nameEn,
      image: c.image || FALLBACK_PRODUCT_IMAGE,
    }));
  }, [categories, circles, isAr]);

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 5:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5';
      case 6:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6';
      case 4:
      default:
        return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-4';
    }
  };

  const openCategory = (cat: VisualCategoryItem) => {
    const row = findByName(cat.nameEn || cat.name);
    if (row) {
      const kids = childrenOf(row.id);
      if (kids.length > 0) {
        // Parent with subcategories → open catalog filtered to that parent (expands to children)
        navigateToCategory(String(row.name || cat.name));
        return;
      }
      navigateToCategory(String(row.name || cat.name));
      return;
    }
    navigateToCategory(cat.nameEn || cat.name);
  };

  if (!isBuilderMode && categoryList.length === 0) {
    return (
      <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <p className="text-sm text-[#7a7164] text-center">
          {isAr ? 'لا توجد تصنيفات بعد' : 'No categories yet'}
        </p>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none">
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#ece7de]">
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#102a1c] flex items-center gap-2">
          <span>{isAr ? titleAr || 'التصنيفات الرئيسية' : titleEn || 'Featured Categories'}</span>
          {isBuilderMode && (
            <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {categoryList.length} {isAr ? 'تصنيفات (انقر لتعديل أي عنصر)' : 'Categories (Click to edit any)'}
            </span>
          )}
        </h2>

        <button
          type="button"
          onClick={() => {
            if (isBuilderMode) return;
            setSelectedCategory(null);
            setCurrentPage('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102a1c] hover:text-[#b8860b] transition-colors cursor-pointer group"
        >
          <span>{isAr ? 'عرض الكل' : 'View All'}</span>
          {isAr ? (
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          ) : (
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>

      <div className={`grid ${getGridColsClass(columns)} gap-3 sm:gap-4 lg:gap-5`}>
        {categoryList.map((cat, idx) => {
          const isSelected = isBuilderMode && selectedCategoryIndex === idx;

          return (
            <div
              key={cat.id || `cat-${idx}`}
              onClick={(e) => {
                if (isBuilderMode) {
                  e.stopPropagation();
                  onSelectCategory?.(idx);
                  return;
                }
                openCategory(cat);
              }}
              className={`group relative aspect-[4/3.8] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 transform bg-[#1a201c] ${
                isSelected
                  ? 'ring-4 ring-amber-400 ring-offset-2 scale-[1.03] z-20 shadow-2xl'
                  : 'hover:-translate-y-1.5'
              } ${isBuilderMode ? 'hover:ring-2 hover:ring-amber-300' : ''}`}
            >
              {isBuilderMode && (
                <div
                  className={`absolute top-2.5 start-2.5 z-30 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-lg scale-105'
                      : 'bg-slate-900/85 text-white opacity-0 group-hover:opacity-100 backdrop-blur-xs'
                  }`}
                >
                  <Edit3 className="w-3 h-3 text-amber-500" />
                  <span>
                    {isAr
                      ? `تصنيف${idx + 1}(انقر للتعديل)`
                      : `Cat ${idx + 1} (Click to edit)`}
                  </span>
                </div>
              )}

              <img
                src={cat.image}
                alt={isAr ? cat.name : cat.nameEn || cat.name}
                onError={(e) => handleImageError(e, FALLBACK_PRODUCT_IMAGE)}
                className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {cat.badge && (
                <div className="absolute top-2.5 end-2.5 z-10">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-[#0b241a] shadow-xs">
                    {cat.badge}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 flex items-center justify-center pointer-events-none">
                <div className="flex items-center justify-center gap-1.5 text-white group-hover:text-[#f3e5ab] transition-colors">
                  <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {isAr ? cat.name : cat.nameEn || cat.name}
                  </span>
                  <span className="text-xs sm:text-sm md:text-base font-bold text-white/90 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
