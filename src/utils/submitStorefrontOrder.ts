import { isApiEnabled } from '../api/client';
import { hasLiveApiAuth } from '../auth/session';
import * as tenantApi from '../api/tenantApi';
import type { Order } from '../types';

export type StorefrontOrderInput = {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  total: number;
  deliveryLocation?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  source?: string;
  sourceDetails?: string;
  items?: Array<{ id: string; name: string; quantity: number; price: number }>;
};

export function toStorefrontOrderPayload(data: StorefrontOrderInput): Record<string, unknown> {
  return {
    customer_name: data.customerName,
    customer_email: data.customerEmail,
    customer_phone: data.customerPhone,
    total_amount: data.total,
    delivery_location: data.deliveryLocation,
    status: data.status || 'pending',
    payment_method: data.paymentMethod || 'Mada',
    payment_status: 'pending',
    source: data.source,
    source_details: data.sourceDetails || data.source,
    items: (data.items || []).map((i) => ({
      product_id: i.id,
      name: i.name,
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
    if (typeof fetch !== 'undefined') {
      void fetch('/api/storefront/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
        body: JSON.stringify({
          event: 'begin_checkout',
          path: typeof location !== 'undefined' ? location.pathname : '',
          source: data.source || 'Direct',
        }),
      }).catch(() => undefined);
    }
    const { order } = await tenantApi.createStorefrontOrder(storeId, toStorefrontOrderPayload(data));
    opts.syncOrderFromApi(order, storeId);
    return order;
  }
  return opts.addOrder(opts.toAddOrderPayload(), storeId);
}
