/**
 * @file notification.types.ts
 * Enterprise notification system types with strict guards and validation contracts.
 */

export type NotificationZone = 'zone1_issues' | 'zone2_marketing' | 'zone3_urgent';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'opportunity';

export type NotificationStatus = 'unread' | 'read' | 'dismissed' | 'snoozed' | 'resolved';

export type NotificationCategory =
  | 'Orders'
  | 'Payments & Finance'
  | 'Products & Inventory'
  | 'Shipping & Delivery'
  | 'Store Settings'
  | 'Customers & Service'
  | 'Marketing & Offers'
  | 'Marketing Analytics & SEO'
  | 'Technical & Security'
  | 'Abandoned Cart'
  | 'Special Offer'
  | 'Coupon'
  | 'Loyalty Points'
  | 'Cashback'
  | 'Social Media'
  | 'Google Ads'
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'Snapchat'
  | 'X'
  | 'Pinterest'
  | 'YouTube'
  | 'Payment'
  | 'Inventory'
  | 'Shipping'
  | 'Critical';

export interface CustomerVerificationData {
  is_identifiable: boolean;
  phone?: string;
  is_phone_validated: boolean;
  marketing_opt_in: boolean;
}

export interface DataSourceVerification {
  is_verified: boolean;
  source_name: string;
  last_synced_at: string; // ISO 8601
  is_stale: boolean;
}

export interface NotificationRegistryEntry {
  id: string;
  code: string;
  zone: NotificationZone;
  category: NotificationCategory;
  severity: NotificationSeverity;
  trigger: string;
  title: string;
  titleAr: string;
  defaultText: string;
  defaultTextAr: string;
  actionLabel: string;
  actionLabelAr: string;
  actionType: 'navigate' | 'whatsapp' | 'modal' | 'external' | 'quick_action';
  destination: string;
  filterParam?: string;
  resolution: string;
  solutionText?: string;
  solutionTextAr?: string;
  whatsappEligible?: boolean;
  whatsappTemplate?: string;
  whatsappTemplateAr?: string;
  urgentTag?: 'Payment' | 'Inventory' | 'Shipping' | 'Critical';
  requiredIntegration?: 'whatsapp' | 'google_ads' | 'meta' | 'tiktok' | 'snapchat' | 'x' | 'pinterest' | 'youtube';
}

export interface NotificationItem {
  id: string;
  dedup_key: string; // type + entity_id
  registryCode: string;
  zone: NotificationZone;
  category: NotificationCategory;
  severity: NotificationSeverity;
  status: NotificationStatus;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  timestamp: string; // ISO 8601 string
  read: boolean;
  dismissed: boolean;
  dismissedAt?: string | null;
  snoozedUntil?: string | null;
  resolvedAt?: string | null;
  isAutoResolved?: boolean;
  actionLabel: string;
  actionLabelAr?: string;
  actionType: 'navigate' | 'whatsapp' | 'modal' | 'external' | 'quick_action';
  destination: string;
  filterParam?: string;
  resolution?: string;
  solutionText?: string;
  solutionTextAr?: string;
  urgentTag?: 'Payment' | 'Inventory' | 'Shipping' | 'Critical';
  
  // Guard 1: WhatsApp eligibility
  customer?: CustomerVerificationData;
  whatsappEligible?: boolean;

  // Guard 2: Verified data source
  dataSource?: DataSourceVerification;

  // Operational aggregation
  aggregatedCount?: number;

  metadata?: {
    orderId?: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    productName?: string;
    sku?: string;
    amount?: number;
    platform?: string;
    couponCode?: string;
    discountCode?: string;
    cartItemsCount?: number;
    cartValue?: number;
    stockCount?: number;
    threshold?: number;
    [key: string]: any;
  };
}

export interface MerchantThresholds {
  lowStockThreshold: number; // default: 5
  abandonedCartWaitMinutes: number; // default: 30
  cartAbandonmentRateAlert: number; // default: 70 (%)
  cancellationRateAlert: number; // default: 15 (%)
  highTrafficLowSalesConversionThreshold: number; // default: 1.0 (%)
  googleAdsTargetCpa: number; // default: 25.0 SAR
  overdueOrdersHours: number; // default: 24
  staleDataThresholdMinutes: number; // default: 60 min

  // Connected integrations flags
  isWhatsappConnected: boolean;
  isMetaConnected: boolean;
  isGoogleAdsConnected: boolean;
  isTiktokConnected: boolean;
  isSnapchatConnected: boolean;
  isXConnected: boolean;
  isPinterestConnected: boolean;
  isYoutubeConnected: boolean;
}

export type DateFilterPreset = 'today' | 'week' | 'month' | 'yearly' | 'custom';

export interface DateFilterRange {
  preset: DateFilterPreset;
  startDate?: Date | null;
  endDate?: Date | null;
}
