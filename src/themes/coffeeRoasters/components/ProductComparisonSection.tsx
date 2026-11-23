import React, { useMemo, useState } from 'react';
import { Product } from '../types';

interface ProductComparisonSectionProps {
  currentProduct: Product;
  language: 'EN' | 'AR';
  /** Optional override from parent (same store product field). */
  customSpecImgUrl?: string;
  /**
   * DOM id for sticky-tab scroll. Pass empty string when a sibling
   * (e.g. GroupChildrenComparison) already owns `specs-comparison-section`.
   */
  anchorId?: string;
}

/**
 * Product page comparison = one dynamic banner image only.
 * Upload / replace from Products admin (compressed media). No interactive table chrome.
 */
export const ProductComparisonSection: React.FC<ProductComparisonSectionProps> = ({
  currentProduct,
  language,
  customSpecImgUrl,
  anchorId = 'specs-comparison-section',
}) => {
  const isAr = language === 'AR';
  const [imageError, setImageError] = useState(false);

  const primaryImgUrl = useMemo(() => {
    if (imageError) return '';
    if (isAr && currentProduct.specComparisonImageAr?.trim()) {
      return currentProduct.specComparisonImageAr.trim();
    }
    if (currentProduct.specComparisonImage?.trim()) {
      return currentProduct.specComparisonImage.trim();
    }
    if (customSpecImgUrl?.trim()) {
      return customSpecImgUrl.trim();
    }
    return '';
  }, [
    currentProduct.specComparisonImage,
    currentProduct.specComparisonImageAr,
    customSpecImgUrl,
    isAr,
    imageError,
  ]);

  if (!primaryImgUrl) return null;

  const alt = isAr
    ? `${currentProduct.nameAr || currentProduct.name || ''} — صورة المقارنة`
    : `${currentProduct.name || ''} — comparison image`;

  return (
    <section
      id={anchorId || undefined}
      className="mt-12 sm:mt-16 scroll-mt-28 w-full"
      dir={isAr ? 'rtl' : 'ltr'}
      data-comparison-banner="image-only"
    >
      <img
        src={primaryImgUrl}
        alt={alt}
        className="w-full h-auto max-w-full object-contain block mx-auto"
        loading="lazy"
        decoding="async"
        onError={() => setImageError(true)}
      />
    </section>
  );
};
