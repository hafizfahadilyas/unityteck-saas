import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { PRODUCTS } from '../data/products';
import { Search, X, ChevronRight } from 'lucide-react';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, navigateTo, language, products } = useCart();
  const [query, setQuery] = useState('');

  if (!isSearchOpen) return null;

  const sourceProducts = products && products.length > 0 ? products : PRODUCTS;
  const results = query.trim() === '' ? [] : sourceProducts.filter(p => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
      p.tagline.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4 selection:bg-neutral-900 selection:text-white">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 text-start text-neutral-900">
        <div className="flex items-center gap-3 pb-3">
          <Search className="w-5 h-5 text-neutral-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={language === 'AR' ? 'ابحث عن ماكينة قهوة، مطحنة، دولاب، أو مستلزمات...' : 'Search coffee machines, mills, cabinets, accessories...'}
            className="flex-1 text-sm bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto space-y-2">
          {results.length > 0 ? (
            results.map(prod => (
              <div
                key={prod.id}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-100 transition-colors"
              >
                <div
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigateTo('product-detail', prod.id);
                  }}
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                >
                  <img
                    src={(prod as any)?.image || prod.images?.[0] || prod.colors?.[0]?.image || '/src/assets/images/hibrew_h7a_flagship_machine.png'}
                    alt={prod.name}
                    className="w-12 h-12 object-contain rounded-xl bg-[#F8F9FA] p-1"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900">
                      {language === 'AR' && prod.nameAr ? prod.nameAr : prod.name}
                    </h4>
                    <span className="text-[11px] text-neutral-500 block font-mono">
                      {language === 'AR' ? `${prod.basePrice.toLocaleString()}.00 ر.س` : `SAR ${prod.basePrice.toLocaleString()}.00`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigateTo('product-buy', prod.id);
                    }}
                    className="px-3 py-1 bg-black text-white hover:bg-neutral-800 rounded-full text-xs font-bold"
                  >
                    {language === 'AR' ? 'شراء' : 'Buy'}
                  </button>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigateTo('product-detail', prod.id);
                    }}
                    className="px-2.5 py-1 bg-neutral-200 text-neutral-800 hover:bg-neutral-300 rounded-full text-xs font-medium cursor-pointer"
                  >
                    {language === 'AR' ? 'المواصفات' : 'Specs'}
                  </button>
                </div>
              </div>
            ))
          ) : query ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              {language === 'AR' ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching coffee gear found'}
            </div>
          ) : (
            <div className="py-4 text-xs text-neutral-400 text-center">
              {language === 'AR' ? 'اكتب اسم المنتج أو القسم للبحث الفوري' : 'Type to search all coffee products'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
