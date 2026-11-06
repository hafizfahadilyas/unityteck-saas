/**
 * Every live storefront origin that may finish customer Google sign-in.
 * Coffee: mieraf-ksa.com · Flowers: giftshop-sa.com · Cars: tanjeedmakkah.com
 * Plus the cloud subdomains and local dev ports.
 */
export const STOREFRONT_AUTH_ORIGINS = [
  'https://mieraf-ksa.com',
  'https://www.mieraf-ksa.com',
  'https://giftshop-sa.com',
  'https://www.giftshop-sa.com',
  'https://tanjeedmakkah.com',
  'https://www.tanjeedmakkah.com',
  'https://coffee.unityteck.com',
  'https://car.unityteck.com',
  'https://flowers.unityteck.com',
  'http://localhost:3010',
  'http://localhost:3011',
  'http://localhost:3012',
  'http://127.0.0.1:3010',
  'http://127.0.0.1:3011',
  'http://127.0.0.1:3012',
];

export function clerkAllowedRedirectOrigins(): string[] {
  const here = typeof window !== 'undefined' ? window.location.origin : '';
  return [...new Set([...STOREFRONT_AUTH_ORIGINS, here].filter(Boolean))];
}
