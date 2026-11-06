/** Preview id → theme_pages slug/type. Isolation stays on store_id at the API. */
export const BUILDER_PAGE_IDS = [
  'home',
  'catalog',
  'product',
  'cart',
  'checkout',
  'thankyou',
  'faq',
  'reviews',
  'about',
  'contact',
  '404',
  'custom',
] as const;

export function builderPageMeta(previewId: string): { slug: string; type: string } {
  const map: Record<string, { slug: string; type: string }> = {
    home: { slug: 'home', type: 'home' },
    catalog: { slug: 'shop', type: 'shop' },
    product: { slug: 'product', type: 'product' },
    cart: { slug: 'cart', type: 'cart' },
    checkout: { slug: 'checkout', type: 'checkout' },
    thankyou: { slug: 'thankyou', type: 'thankyou' },
    faq: { slug: 'faq', type: 'faq' },
    reviews: { slug: 'reviews', type: 'reviews' },
    about: { slug: 'about', type: 'about' },
    contact: { slug: 'contact', type: 'contact' },
    '404': { slug: '404', type: '404' },
    location: { slug: 'locations', type: 'custom' },
    'track-order': { slug: 'track-order', type: 'custom' },
    privacy: { slug: 'privacy', type: 'custom' },
    return: { slug: 'returns', type: 'custom' },
  };
  return map[previewId] || { slug: previewId, type: 'custom' };
}

export function builderPageTitles(previewId: string): { title_en: string; title_ar: string } {
  const titles: Record<string, { title_en: string; title_ar: string }> = {
    home: { title_en: 'Home', title_ar: 'الرئيسية' },
    catalog: { title_en: 'Shop', title_ar: 'المتجر' },
    product: { title_en: 'Product', title_ar: 'المنتج' },
    cart: { title_en: 'Cart', title_ar: 'السلة' },
    checkout: { title_en: 'Checkout', title_ar: 'إتمام الشراء' },
    thankyou: { title_en: 'Thank you', title_ar: 'تأكيد الطلب' },
    faq: { title_en: 'Questions', title_ar: 'الأسئلة الشائعة' },
    reviews: { title_en: 'Reviews', title_ar: 'التقييمات' },
    about: { title_en: 'About', title_ar: 'من نحن' },
    contact: { title_en: 'Contact', title_ar: 'اتصل بنا' },
    '404': { title_en: 'Missing page', title_ar: 'صفحة غير موجودة' },
    location: { title_en: 'Locations', title_ar: 'الفروع' },
    'track-order': { title_en: 'Track order', title_ar: 'تتبع الطلب' },
    privacy: { title_en: 'Privacy', title_ar: 'الخصوصية' },
    return: { title_en: 'Returns', title_ar: 'الإرجاع' },
  };
  return titles[previewId] || { title_en: previewId, title_ar: previewId };
}

export function builderPageFromQuery(params: URLSearchParams): string | null {
  const raw = (params.get('page') || params.get('builderPage') || '').trim();
  if (raw === '' || raw === 'crm') return null;
  if (raw === 'shop') return 'catalog';
  const known = new Set<string>([...BUILDER_PAGE_IDS, 'location', 'track-order', 'privacy', 'return']);
  return known.has(raw) ? raw : null;
}

export function stashPageDraft<T>(drafts: Record<string, T>, pageId: string, blocks: T): Record<string, T> {
  return { ...drafts, [pageId]: blocks };
}

export function blocksFromLayout(layout: unknown): unknown[] | null {
  if (!layout || typeof layout !== 'object') return null;
  const blocks = (layout as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  const kept = blocks.filter((block) => {
    if (!block || typeof block !== 'object') return false;
    return (block as { type?: string }).type !== 'banners';
  });
  return kept.length > 0 ? kept : null;
}
