/**
 * OptimizedImage — Ultra-fast, zero-broken image component
 *
 * Features:
 * - Native lazy loading (loading="lazy") with eager support for above-fold
 * - fetchPriority="high" for LCP / hero images
 * - decoding="async" — never blocks main thread
 * - Triple-fallback chain: primary → fallback → inline SVG (no infinite loop)
 * - Smooth opacity fade-in on load
 * - Prevents CLS with optional width/height
 * - WebP auto-upgrade for Unsplash URLs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FALLBACK_PRODUCT_IMAGE, FALLBACK_SVG_PLACEHOLDER } from '../../utils/imageFallback';

export interface OptimizedImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'onLoad'> {
  /** Primary image URL */
  src: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Secondary fallback URL before SVG placeholder */
  fallback?: string;
  /** Set true for above-the-fold / hero images (fetchPriority=high, loading=eager) */
  priority?: boolean;
  /** Called when image loads successfully */
  onLoad?: () => void;
  /** Called when all fallbacks are exhausted */
  onError?: () => void;
  /** Show blur-pulse skeleton while loading */
  showSkeleton?: boolean;
}

/**
 * Upgrades Unsplash URLs to WebP with optimal params
 */
function toOptimizedSrc(url: string, priority: boolean): string {
  if (!url) return FALLBACK_SVG_PLACEHOLDER;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0];
    const width = priority ? 1600 : 800;
    return `${base}?w=${width}&auto=format&fit=crop&q=80&fm=webp`;
  }
  return url;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallback = FALLBACK_PRODUCT_IMAGE,
  priority = false,
  onLoad,
  onError,
  showSkeleton = true,
  className = '',
  style,
  ...rest
}) => {
  const optimizedSrc = toOptimizedSrc(src, priority);

  const [currentSrc, setCurrentSrc] = useState<string>(
    optimizedSrc || FALLBACK_SVG_PLACEHOLDER
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorStep, setErrorStep] = useState(0); // 0=primary, 1=fallback, 2=svg

  // Sync src changes (e.g. when store switches)
  useEffect(() => {
    const newSrc = toOptimizedSrc(src, priority);
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc || FALLBACK_SVG_PLACEHOLDER);
      setIsLoaded(false);
      setErrorStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (errorStep === 0) {
      // Step 1: Try fallback URL
      const fb = toOptimizedSrc(fallback, false);
      setCurrentSrc(fb || FALLBACK_SVG_PLACEHOLDER);
      setErrorStep(1);
    } else if (errorStep === 1) {
      // Step 2: Use inline SVG — never breaks
      setCurrentSrc(FALLBACK_SVG_PLACEHOLDER);
      setErrorStep(2);
      setIsLoaded(true); // SVG always "loads"
      onError?.();
    }
    // Step 2+ is final — no more retries
  }, [errorStep, fallback, onError]);

  const skeletonClass =
    showSkeleton && !isLoaded
      ? 'animate-pulse bg-slate-100 dark:bg-slate-800'
      : '';

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={`${skeletonClass} transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
};

export default OptimizedImage;
