import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTenant } from '../../../context/TenantContext';
import { Product } from '../types';
import { DISCOUNTED_BOUQUETS } from '../data/mockData';
import { ProductSectionSlider } from './ProductSectionSlider';

interface DiscountedBouquets3DGalleryProps {
  products?: Product[];
}

export const DiscountedBouquets3DGallery: React.FC<DiscountedBouquets3DGalleryProps> = ({
  products: propProducts,
}) => {
  const { products: appProducts } = useApp();
  const { activeStore } = useTenant();
  const isCoffee = activeStore?.id === 'store-coffee' || (activeStore?.category && activeStore.category.includes('قهوة'));
  const isSouq = !isCoffee && activeStore?.id !== 'store-1';

  const products = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    if (appProducts && appProducts.length > 0) {
      const discounted = appProducts.filter(p => Boolean(p.originalPrice || p.badge?.includes('خصم') || p.badgeEn?.includes('Off') || p.badgeEn?.includes('Sale')));
      if (discounted.length >= 3) return discounted;
      return [...discounted, ...appProducts].slice(0, 6);
    }
    return [];
  }, [propProducts, appProducts]);

  const title = isCoffee ? 'عروض وتخفيضات محاصيل القهوة' : isSouq ? 'عروض وتخفيضات مميزة' : 'باقات ورود طبيعية مخفضة';
  const titleEn = isCoffee ? 'Specialty Coffee Offers & Discounts' : isSouq ? 'Special Offers & Discounts' : 'Discounted Natural Flower Bouquets';
  const subtitle = isCoffee
    ? 'عروض حصرية وخصومات استثنائية على محاصيل البن النادرة وحزم التحميص لفترة محدودة'
    : isSouq
    ? 'عروض حصرية وتخفيضات خاصة على منتجات المتجر لفترة محدودة'
    : 'عروض حصرية وخصومات استثنائية على باقات الورد الطبيعي لفترة محدودة';
  const subtitleEn = isCoffee
    ? 'Special promotional discounts on rare single-origin roasts and barista gear'
    : isSouq
    ? 'Special promotional discounts on selected products for a limited time'
    : 'Special promotional discounts on premium natural floral arrangements';

  return (
    <ProductSectionSlider
      title={title}
      titleEn={titleEn}
      subtitle={subtitle}
      subtitleEn={subtitleEn}
      products={products}
      categoryFilter={isCoffee ? 'حبوب القهوة المختصة' : isSouq ? '' : 'باقات ورود طبيعية مخفضة'}
      limit={6}
      layout="slider"
    />
  );
};
