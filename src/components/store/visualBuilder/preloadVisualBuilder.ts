let visualBuilderPromise: Promise<unknown> | null = null;

/**
 * Eagerly preloads the VisualThemeBuilder module chunk so that when the user
 * clicks "Customize Theme", it opens immediately (0ms delay) from memory.
 */
export const preloadVisualThemeBuilder = (): Promise<unknown> => {
  if (!visualBuilderPromise) {
    visualBuilderPromise = import('./VisualThemeBuilder');
  }
  return visualBuilderPromise;
};
