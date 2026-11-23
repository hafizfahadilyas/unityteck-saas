/** Default / suggested bodies for per-store robots.txt and llms.txt (real store origin only). */

export function defaultRobotsTxt(origin: string): string {
  const base = origin.replace(/\/$/, '') || 'https://example.com';
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /master',
    'Disallow: /cart',
    'Disallow: /checkout',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');
}

export function defaultLlmsTxt(storeName: string, origin: string): string {
  const name = (storeName || '').trim() || 'Store';
  const base = origin.replace(/\/$/, '') || 'https://example.com';
  return [
    `# ${name}`,
    '',
    `> ${name} — online store.`,
    '',
    '## Pages',
    '',
    `- [Home](${base}/): Store home`,
    `- [Products](${base}/products): Product catalog`,
    `- [Sitemap](${base}/sitemap.xml): XML sitemap`,
    '',
    '## Optional',
    '',
    `- [Cart](${base}/cart): Shopping cart (private)`,
    `- [Checkout](${base}/checkout): Checkout (private)`,
    '',
  ].join('\n');
}

export function publicSeoFileUrl(origin: string, file: 'robots.txt' | 'llms.txt' | 'sitemap.xml'): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/${file}`;
}
