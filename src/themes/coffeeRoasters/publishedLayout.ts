function plain(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function publishedLayoutCopy(layout: unknown, locale: 'ar' | 'en'): string {
  if (!layout || typeof layout !== 'object') return '';
  const blocks = (layout as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks)) return '';
  const keys = locale === 'ar'
    ? ['htmlAr', 'textAr', 'titleAr', 'labelAr']
    : ['htmlEn', 'textEn', 'titleEn', 'labelEn'];
  const lines: string[] = [];
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue;
    const settings = (block as { settings?: Record<string, unknown> }).settings || {};
    for (const key of keys) {
      const value = settings[key];
      if (typeof value === 'string' && value.trim()) lines.push(plain(value));
    }
  }
  return lines.join('\n');
}
