export type SpecialOfferType =
  | 'percentage'
  | 'fixed'
  | 'bogo'
  | 'table'
  | 'fixed_price'
  | 'category';

export interface SpecialOffer {
  id: string;
  storeId: string;
  titleAr: string;
  titleEn: string;
  offerType: SpecialOfferType;
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  startDate: string;
  endDate: string;
  message: string;
  status: 'active' | 'inactive' | 'draft';
  productScope: 'all' | 'specific';
  productIds: string[];
  bannerBgColor: string;
  bannerImage: string;
}

function str(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function mapApiSpecialOfferRow(
  row: Record<string, unknown> | null | undefined,
  storeId: string,
): SpecialOffer {
  const r = row ?? {};
  const productIdsRaw = r.product_ids ?? r.productIds;
  const productIds = Array.isArray(productIdsRaw)
    ? productIdsRaw.map((id) => String(id))
    : [];

  return {
    id: str(r.id),
    storeId: str(r.store_id ?? r.storeId, storeId),
    titleAr: str(r.title_ar ?? r.titleAr),
    titleEn: str(r.title_en ?? r.titleEn),
    offerType: (str(r.offer_type ?? r.offerType, 'percentage') as SpecialOfferType) || 'percentage',
    discountValue: num(r.discount_value ?? r.discountValue),
    minOrderValue:
      r.min_order_value == null && r.minOrderValue == null
        ? null
        : num(r.min_order_value ?? r.minOrderValue),
    maxDiscount:
      r.max_discount == null && r.maxDiscount == null
        ? null
        : num(r.max_discount ?? r.maxDiscount),
    startDate: str(r.start_date ?? r.startDate),
    endDate: str(r.end_date ?? r.endDate),
    message: str(r.message),
    status: (str(r.status, 'draft') as SpecialOffer['status']) || 'draft',
    productScope: (str(r.product_scope ?? r.productScope, 'specific') as 'all' | 'specific') || 'specific',
    productIds,
    bannerBgColor: str(r.banner_bg_color ?? r.bannerBgColor, '#0c5c46') || '#0c5c46',
    bannerImage: str(r.banner_image_url ?? r.bannerImage ?? r.banner_image),
  };
}

/** Resolve product thumbnail from live Product shape (`image` primary, `images[]` fallback). */
export function resolveProductThumb(p: {
  image?: string | null;
  images?: string[] | null;
  galleryUrls?: string[] | null;
}): string {
  const primary = typeof p.image === 'string' ? p.image.trim() : '';
  if (primary) return primary;
  const fromImages = Array.isArray(p.images) ? p.images.find((u) => typeof u === 'string' && u.trim()) : '';
  if (fromImages) return String(fromImages).trim();
  const fromGallery = Array.isArray(p.galleryUrls)
    ? p.galleryUrls.find((u) => typeof u === 'string' && u.trim())
    : '';
  return fromGallery ? String(fromGallery).trim() : '';
}

export type SpecialOfferLineItem = {
  productId: string;
  lineTotal: number;
};

/**
 * Auto-apply special offer discount at checkout (eligible lines only).
 * Returns 0 when offer missing / inactive / below min / no eligible lines.
 */
export function computeSpecialOfferDiscount(
  offer: SpecialOffer | null | undefined,
  lines: SpecialOfferLineItem[],
  now: Date = new Date(),
): number {
  if (!offer || offer.status !== 'active') return 0;
  if (offer.startDate) {
    const start = new Date(offer.startDate);
    if (!Number.isNaN(start.getTime()) && now < start) return 0;
  }
  if (offer.endDate) {
    const end = new Date(offer.endDate);
    if (!Number.isNaN(end.getTime()) && now > end) return 0;
  }

  const eligible = lines.filter((line) => {
    if (offer.productScope === 'all') return true;
    return offer.productIds.includes(line.productId);
  });
  const eligibleSubtotal = eligible.reduce((sum, line) => sum + Math.max(0, line.lineTotal), 0);
  if (eligibleSubtotal <= 0) return 0;

  const minOrder = offer.minOrderValue ?? 0;
  if (minOrder > 0 && eligibleSubtotal < minOrder) return 0;

  let discount = 0;
  if (offer.offerType === 'percentage') {
    discount = Math.round(eligibleSubtotal * (Math.max(0, offer.discountValue) / 100));
    const cap = offer.maxDiscount;
    if (cap != null && Number.isFinite(cap) && cap > 0) {
      discount = Math.min(discount, cap);
    }
  } else if (offer.offerType === 'fixed' || offer.offerType === 'fixed_price') {
    discount = Math.max(0, offer.discountValue);
  } else {
    // bogo / table / category — percentage of eligible until those engines ship
    discount = Math.round(eligibleSubtotal * (Math.max(0, offer.discountValue) / 100));
  }

  return Math.min(eligibleSubtotal, Math.max(0, discount));
}
