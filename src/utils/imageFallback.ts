/**
 * Standard Image Fallback Utilities
 * Provides resilient fallbacks for products, banners, and icons.
 * Guarantees zero broken image icons across all dashboards and storefronts.
 */

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=800&auto=format&fit=crop&q=80';

export const FALLBACK_STORE_LOGO =
  'https://cdn.salla.sa/cdn-cgi/image/fit=scale-down,width=400,height=400,onerror=redirect,format=auto/NKOjvD/2Cnfzx8q23nZJ0tRXo8cUjOa6GP3vTWdrOePAhRl.png';

/**
 * Clean inline SVG data URL for instant zero-network fallback
 */
export const FALLBACK_SVG_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f1f5f9"/><path d="M70 130 L95 100 L115 120 L130 105 L150 130 Z" fill="%23cbd5e1"/><circle cx="85" cy="80" r="12" fill="%23cbd5e1"/></svg>';

/**
 * Image error handler that prevents infinite loop and falls back to a clean placeholder
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_PRODUCT_IMAGE,
) {
  const target = e.currentTarget;
  if (!target.dataset.fallbackApplied) {
    target.dataset.fallbackApplied = 'true';
    target.src = fallback;
  } else if (target.dataset.fallbackApplied === 'true') {
    target.dataset.fallbackApplied = 'final';
    target.src = FALLBACK_SVG_PLACEHOLDER;
  }
}
