/**
 * Portal chrome font — same stack as Invoice & Document Management (Holst).
 * EN + AR both resolve through CSS vars set in portal-tokens + applyBrandCss.
 */
export function portalFontFamily(locale?: 'en' | 'ar' | string): string {
  if (locale === 'ar') return 'var(--font-ui-ar, var(--font-ui))';
  if (locale === 'en') return 'var(--font-ui-en, var(--font-ui))';
  return 'var(--font-ui)';
}

/** Printable invoice docs: respect designer pick, else portal chrome face. */
export function invoiceDocFontFamily(
  configFont: string | undefined,
  locale: 'en' | 'ar',
): string {
  const pick = (configFont || '').trim();
  if (pick && pick !== 'System') {
    return `'${pick}', ${portalFontFamily(locale)}`;
  }
  return portalFontFamily(locale);
}
