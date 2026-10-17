import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRODUCTS } from '../data/mockData';
import { ProductCard } from './ProductCard';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const { language, setCurrentPage, setSelectedCategory, products } = useApp();
  const isAr = language === 'ar';
  const allProds = products && products.length > 0 ? products : PRODUCTS;

  const [activeTab, setActiveTab] = useState<string>('all');

  const tabs = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'bestseller', label: isAr ? 'الأكثر طلباً' : 'Best Sellers' },
    { id: 'red-roses', label: isAr ? 'ورد أحمر' : 'Red Roses' },
    { id: 'bouquets', label: isAr ? 'باقات فاخرة' : 'Luxury Bouquets' },
  ];

  const filteredProducts = allProds.filter((product) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'bestseller') return Boolean(product.badge?.includes('طلب') || product.reviewsCount > 100);
    if (activeTab === 'red-roses') return product.category.includes('أحمر') || product.name.includes('أحمر') || product.nameEn.toLowerCase().includes('red');
    if (activeTab === 'bouquets') return product.category.includes('باقات') || product.name.includes('باقة');
    return true;
  });

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#102a1c] font-serif">
            {isAr ? 'التميز حضور' : 'Presence of Excellence'}
          </h2>
          <p className="text-xs sm:text-sm text-[#7d7568] mt-1">
            {isAr ? 'تشكيلة مختارة من أرقى الزهور والهدايا لتلهم مشاعرك' : 'Handpicked luxury arrangements and bespoke gifts'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#ede8df] rounded-xl overflow-x-auto max-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-[#102a1c] shadow-sm'
                  : 'text-[#6c757d] hover:text-[#102a1c]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: 3 products per row on desktop (lg/xl), 2 on tablet (sm), 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-10">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCurrentPage('catalog');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full border border-[#102a1c] text-[#102a1c] hover:bg-[#102a1c] hover:text-white font-semibold text-xs transition-all duration-300 shadow-sm"
        >
          <span>{isAr ? 'عرض كافة باقات المتجر' : 'View Full Flower Collection'}</span>
          {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
};
