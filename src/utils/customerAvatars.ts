/**
 * Arab Region Customer Avatars & Profile Photo Utilities
 * Provides culturally authentic, high-quality, professional portraits for Saudi/Arab customers.
 * Sized 1:1 circular/square with high performance, SEO alt tags, and resilient fallback.
 */

export const ARAB_MALE_AVATARS: string[] = [
  // Professional Saudi / Arab male portraits
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
];

export const ARAB_FEMALE_AVATARS: string[] = [
  // Modest and professional Arab female portraits
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&auto=format&fit=crop&crop=faces&q=80',
];

const KNOWN_FEMALE_NAMES = [
  'سارة',
  'فاطمة',
  'نورة',
  'هند',
  'مريم',
  'عائشة',
  'دانة',
  'ليلى',
  'منى',
  'خلود',
  'sara',
  'fatima',
  'noura',
  'hind',
  'maryam',
  'aisha',
  'dana',
  'layla',
];

/**
 * Deterministically hash a string into a number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get authentic Arab avatar for customer matching name, gender & identity
 */
export function getArabCustomerAvatar(customer: {
  id?: string;
  name?: string;
  gender?: 'Male' | 'Female' | 'Other' | string;
  avatar?: string;
}): string {
  if (customer.avatar && customer.avatar.trim().length > 0) {
    return customer.avatar.trim();
  }

  const name = (customer.name || '').toLowerCase().trim();
  const id = customer.id || name || 'default-customer';
  const hash = hashString(id + name);

  const isFemale =
    customer.gender === 'Female' ||
    KNOWN_FEMALE_NAMES.some((n) => name.includes(n));

  if (isFemale) {
    return ARAB_FEMALE_AVATARS[hash % ARAB_FEMALE_AVATARS.length];
  }

  return ARAB_MALE_AVATARS[hash % ARAB_MALE_AVATARS.length];
}

/**
 * Generate comprehensive SEO Alt text for customer image
 */
export function getCustomerSeoAlt(
  customer: { name?: string; city?: string; country?: string },
  storeName?: string,
  isAr: boolean = false
): string {
  const cName = customer.name?.trim() || (isAr ? 'عميل' : 'Customer');
  const sName = storeName?.trim() || (isAr ? 'المتجر' : 'Store');
  const city = customer.city?.trim() ? ` - ${customer.city.trim()}` : '';

  if (isAr) {
    return `صورة العميل ${cName}${city} - حساب ${sName} المعتمد`;
  }
  return `${cName}${city} customer profile avatar - ${sName} Verified Account`;
}
