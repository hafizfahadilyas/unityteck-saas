/** Preview id → theme_pages slug/type. Isolation stays on store_id at the API. */
export function builderPageMeta(previewId: string): { slug: string; type: string } {
  const map: Record<string, { slug: string; type: string }> = {
    home: { slug: 'home', type: 'home' },
    catalog: { slug: 'shop', type: 'shop' },
    product: { slug: 'product', type: 'product' },
    cart: { slug: 'cart', type: 'cart' },
    checkout: { slug: 'checkout', type: 'checkout' },
    thankyou: { slug: 'thankyou', type: 'thankyou' },
    about: { slug: 'about', type: 'about' },
    contact: { slug: 'contact', type: 'contact' },
    crm: { slug: 'account', type: 'custom' },
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
    about: { title_en: 'About', title_ar: 'من نحن' },
    contact: { title_en: 'Contact', title_ar: 'اتصل بنا' },
    crm: { title_en: 'Account', title_ar: 'الحساب' },
    location: { title_en: 'Locations', title_ar: 'الفروع' },
    'track-order': { title_en: 'Track order', title_ar: 'تتبع الطلب' },
    privacy: { title_en: 'Privacy', title_ar: 'الخصوصية' },
    return: { title_en: 'Returns', title_ar: 'الإرجاع' },
  };
  return titles[previewId] || { title_en: previewId, title_ar: previewId };
}

export function blocksFromLayout(layout: unknown): unknown[] | null {
  if (!layout || typeof layout !== 'object') return null;
  const blocks = (layout as { blocks?: unknown }).blocks;
  return Array.isArray(blocks) && blocks.length > 0 ? blocks : null;
}
