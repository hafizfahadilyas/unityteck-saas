/** Special-offer popup templates — modern, dark/light via CSS vars, EN + AR. */

export type OfferTemplateId = 'emerald' | 'rose' | 'midnight';

export type OfferTemplate = {
  id: OfferTemplateId;
  nameEn: string;
  nameAr: string;
  /** Accent used for header gradient (works on light + dark surfaces) */
  accentFrom: string;
  accentTo: string;
  badgeEn: string;
  badgeAr: string;
  /** Default copy when store picks this template */
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  code: string;
  discountPercent: number;
};

export const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    id: 'emerald',
    nameEn: 'Emerald Gift',
    nameAr: 'هدية الزمرد',
    accentFrom: '#065f46',
    accentTo: '#0f766e',
    badgeEn: 'Today only',
    badgeAr: 'اليوم فقط',
    titleEn: 'Special Offer · 15% OFF',
    titleAr: 'عرض خاص · خصم 15%',
    bodyEn: 'Use code MAKKAH15 on your first fresh-flower order — today only',
    bodyAr: 'استخدم كود MAKKAH15 على أول طلب ورد طبيعي — صالح اليوم فقط',
    code: 'MAKKAH15',
    discountPercent: 15,
  },
  {
    id: 'rose',
    nameEn: 'Rose Romance',
    nameAr: 'رومانسية الورد',
    accentFrom: '#9f1239',
    accentTo: '#be123c',
    badgeEn: 'Limited',
    badgeAr: 'محدود',
    titleEn: 'Rose Weekend · 20% OFF',
    titleAr: 'ويكند الورد · خصم 20%',
    bodyEn: 'Use code ROSE20 for bouquets & gift boxes this weekend',
    bodyAr: 'استخدم كود ROSE20 على الباقات وصناديق الهدايا هذا الأسبوع',
    code: 'ROSE20',
    discountPercent: 20,
  },
  {
    id: 'midnight',
    nameEn: 'Midnight Luxury',
    nameAr: 'فخامة منتصف الليل',
    accentFrom: '#1e1b4b',
    accentTo: '#312e81',
    badgeEn: 'VIP',
    badgeAr: 'كبار الشخصيات',
    titleEn: 'VIP Welcome · 12% OFF',
    titleAr: 'ترحيب VIP · خصم 12%',
    bodyEn: 'Use code VIP12 on your first luxury arrangement',
    bodyAr: 'استخدم كود VIP12 على أول تنسيق فاخر',
    code: 'VIP12',
    discountPercent: 12,
  },
];

export function offerTemplateById(id: OfferTemplateId): OfferTemplate {
  return OFFER_TEMPLATES.find((t) => t.id === id) ?? OFFER_TEMPLATES[0];
}
