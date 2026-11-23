import { describe, expect, it } from 'vitest';
import { defaultLlmsTxt, defaultRobotsTxt, publicSeoFileUrl } from './storeSeoFiles';

describe('storeSeoFiles', () => {
  it('builds robots.txt with store sitemap', () => {
    const body = defaultRobotsTxt('https://giftshop-sa.com');
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /admin');
    expect(body).toContain('Sitemap: https://giftshop-sa.com/sitemap.xml');
  });

  it('builds llms.txt with store name and links', () => {
    const body = defaultLlmsTxt('Makkah Gifts', 'https://giftshop-sa.com/');
    expect(body.startsWith('# Makkah Gifts')).toBe(true);
    expect(body).toContain('[Home](https://giftshop-sa.com/)');
    expect(body).toContain('[Sitemap](https://giftshop-sa.com/sitemap.xml)');
  });

  it('builds public file urls', () => {
    expect(publicSeoFileUrl('https://mieraf-ksa.com', 'llms.txt')).toBe(
      'https://mieraf-ksa.com/llms.txt',
    );
  });
});
