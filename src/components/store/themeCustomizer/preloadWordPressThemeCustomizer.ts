let customizerPromise: Promise<unknown> | null = null;

/**
 * Prefetch WordPressThemeCustomizer chunk so deep-link / open feels instant.
 * Also warms storefront + coffee theme chunks for the live preview iframe.
 */
export const preloadWordPressThemeCustomizer = (): Promise<unknown> => {
  if (!customizerPromise) {
    customizerPromise = import('./WordPressThemeCustomizer').catch((err) => {
      customizerPromise = null;
      throw err;
    });
  }
  // Fire-and-forget: warm same-origin chunks the customizer iframe will need
  try {
    void import('../../storefront/DynamicThemeRenderer');
    void import('../../../themes/coffeeRoasters/CoffeeRoastersThemeView');
  } catch {
    /* ignore */
  }
  return customizerPromise;
};
