import { isApiEnabled } from '../api/client';
import { hasLiveApiAuth } from '../auth/session';
import * as tenantApi from '../api/tenantApi';
import type { Order } from '../types';
import { trackStorefrontEvent } from './storefrontAnalytics';

export type StorefrontOrderLine = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variationId?: string | null;
  selectedOptions?: Record<string, string | number | boolean | string[]> | null;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  imageUrl?: string | null;
};

export type StorefrontOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  /** Logged-in storefront customer id (required when guest checkout disabled). */
  customerId?: string;
  customerToken?: string;
  total: number;
  deliveryLocation?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  source?: string;
  sourceDetails?: string;
  medium?: string;
  campaign?: string;
  utmTerm?: string;
  utmContent?: string;
  firstTouchSource?: string;
  firstTouchMedium?: string;
  firstTouchCampaign?: string;
  firstTouchUtmTerm?: string;
  firstTouchUtmContent?: string;
  landingPage?: string;
  referralHost?: string;
  shippingFee?: number;
  shippingMethodId?: string | null;
  courierCode?: string | null;
  shippingStatus?: string | null;
  deliveryMode?: string;
  customerNotes?: string;
  couponCode?: string;
  giftCardCode?: string;
  loyaltyPointsRedeem?: number;
  items?: StorefrontOrderLine[];
};

export function toStorefrontOrderPayload(data: StorefrontOrderInput): Record<string, unknown> {
  return {
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    customer_id: data.customerId || undefined,
    customer_token: data.customerToken || undefined,
    total_amount: data.total,
    delivery_location: data.deliveryLocation,
    status: data.status || 'pending',
    payment_method: data.paymentMethod || 'Mada',
    payment_status: 'pending',
    source: data.source,
    source_details: data.sourceDetails || data.source,
    medium: data.medium || undefined,
    campaign: data.campaign || undefined,
    utm_term: data.utmTerm || undefined,
    utm_content: data.utmContent || undefined,
    first_touch_source: data.firstTouchSource || undefined,
    first_touch_medium: data.firstTouchMedium || undefined,
    first_touch_campaign: data.firstTouchCampaign || undefined,
    first_touch_utm_term: data.firstTouchUtmTerm || undefined,
    first_touch_utm_content: data.firstTouchUtmContent || undefined,
    landing_page: data.landingPage || undefined,
    referral_host: data.referralHost || undefined,
    delivery_mode: data.deliveryMode || undefined,
    customer_notes: data.customerNotes || undefined,
    coupon_code: data.couponCode || undefined,
    gift_card_code: data.giftCardCode || undefined,
    loyalty_points_redeem: data.loyaltyPointsRedeem || undefined,
    shipping_method_id: data.shippingMethodId || undefined,
    courier_code: data.courierCode || undefined,
    shipping_status: data.shippingStatus || 'pending',
    shipping_cost:
      typeof data.shippingFee === 'number' && Number.isFinite(data.shippingFee)
        ? data.shippingFee
        : undefined,
    items: (data.items || []).map((i) => ({
      product_id: i.id,
      variation_id: i.variationId || undefined,
      selected_options: i.selectedOptions || undefined,
      name: i.name,
      sku: i.sku || undefined,
      brand: i.brand || undefined,
      category: i.category || undefined,
      image_url: i.imageUrl || undefined,
      quantity: i.quantity,
      price: i.price,
    })),
  };
}

/** Guest storefront → POST /storefront/orders; authenticated → addOrder; offline → mock addOrder. */
export async function submitPublicStorefrontOrder(
  storeId: string,
  data: StorefrontOrderInput,
  opts: {
    syncOrderFromApi: (order: Order, storeId?: string) => void;
    addOrder: (
      order: Omit<Order, 'id' | 'storeId' | 'orderNumber' | 'date'> & { date?: string },
      targetStoreId?: string,
    ) => Promise<Order>;
    toAddOrderPayload: () => Omit<Order, 'id' | 'storeId' | 'orderNumber' | 'date'> & { date?: string };
  },
): Promise<Order> {
  if (isApiEnabled() && !hasLiveApiAuth()) {
    const firstItem = data.items?.[0];
    trackStorefrontEvent(storeId, 'begin_checkout', {
      path: typeof location !== 'undefined' ? location.pathname : '',
      meta: {
        product_id: firstItem?.id,
        product_name: firstItem?.name,
        product_ids: (data.items || []).map((i) => i.id).filter(Boolean),
        cart_total: data.total,
      },
    });
    const { order } = await tenantApi.createStorefrontOrder(storeId, toStorefrontOrderPayload(data));
    const paid =
      String(data.paymentStatus || '').toLowerCase() === 'paid' ||
      String((order as { paymentStatus?: string }).paymentStatus || '').toLowerCase() === 'paid';
    trackStorefrontEvent(storeId, 'purchase', {
      path: typeof location !== 'undefined' ? location.pathname : '',
      meta: {
        order_id: order.id,
        product_id: firstItem?.id,
        product_name: firstItem?.name,
        product_ids: (data.items || []).map((i) => i.id).filter(Boolean),
        paid,
        payment_method: data.paymentMethod,
      },
    });
    opts.syncOrderFromApi(order, storeId);
    return order;
  }
  return opts.addOrder(opts.toAddOrderPayload(), storeId);
}
