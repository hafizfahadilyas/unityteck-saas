export type Language = 'ar' | 'en';
export type Currency = 'SAR' | 'USD' | 'AED';

export interface Product {
  id: string;
  name: string;
  nameEn: string;
  nameAr?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  additionalImages?: string[];
  galleryUrls?: string[];
  colors?: any[];
  category: string;
  categoryEn: string;
  categoryAr?: string;
  categorySlug?: string;
  occasions?: string[];
  tags?: string[];
  badge?: string;
  badgeEn?: string;
  description: string;
  descriptionAr?: string;
  descriptionEn: string;
  flowerTypes: string[];
  dimensions?: string;
  inStock: boolean;
  featured?: boolean;
}

export interface AddonOption {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  image: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  cardMessage?: string;
  senderName?: string;
  recipientName?: string;
  addons: AddonOption[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
  image: string;
  count: number;
}

export interface OccasionCategory {
  id: string;
  name: string;
  nameEn: string;
  image: string;
}

export interface HeroSlide {
  id: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  ctaText: string;
  ctaTextEn: string;
  image: string;
  mobileImage?: string;
  categoryLink: string;
}

export interface OccasionReminder {
  id: string;
  title: string;
  date: string;
  recipient: string;
  relationship: string;
}

export interface SavedAddress {
  id: string;
  title: string;
  city: string;
  district: string;
  street: string;
  recipientName: string;
  recipientPhone: string;
  isDefault: boolean;
}

export interface Order {
  orderId: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'confirmed' | 'preparing' | 'on_delivery' | 'delivered' | 'cancellation_requested' | 'cancelled';
  recipientName: string;
  recipientPhone: string;
  city: string;
  address: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  isAnonymousSender: boolean;
  paymentMethod: string;
  cardMessage?: string;
  cancelReason?: string;
  cancelRequestedAt?: string;
  refundStatus?: 'none' | 'pending' | 'refunded' | 'rejected';
  refundAmount?: number;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  rating: number;
  comment: string;
  commentEn: string;
  verified: boolean;
  date: string;
  avatar: string;
}

export interface Article {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  readTime: string;
  image: string;
  summary: string;
  summaryEn: string;
}
