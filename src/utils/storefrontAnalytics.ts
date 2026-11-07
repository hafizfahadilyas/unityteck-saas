import { isApiEnabled } from '../api/client';
import { readTrafficSource } from './trafficSource';

type StorefrontEventName =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'search';

export type CustomerActivityPayload = {
  activity_type: string;
  product_id?: string;
  product_name?: string;
  customer_id?: string;
  customer_name?: string;
  order_id?: string;
  meta?: Record<string, unknown>;
};

const EVENT_TO_ACTIVITY: Partial<Record<StorefrontEventName, string>> = {
  product_view: 'product_viewed',
  add_to_cart: 'add_to_cart',
  begin_checkout: 'checkout_started',
  purchase: 'order_created',
};

function sessionKey(): string {
  if (typeof sessionStorage === 'undefined') return '';
  const key = 'unityteck_sf_session';
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
  return value;
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Fire-and-forget customer activity → Laravel MySQL (per store_id). */
export function trackCustomerActivity(
  storeId: string | undefined | null,
  payload: CustomerActivityPayload,
): void {
  if (!storeId || !isApiEnabled() || typeof fetch === 'undefined') return;
  if (!payload?.activity_type) return;

  const body = {
    store_id: storeId,
    activity_type: payload.activity_type,
    product_id: payload.product_id || undefined,
    product_name: payload.product_name || undefined,
    customer_id: payload.customer_id || undefined,
    customer_name: payload.customer_name || undefined,
    order_id: payload.order_id || undefined,
    meta: payload.meta,
  };

  void fetch('/api/storefront/customer-activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Store-Id': storeId,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

/** Fire-and-forget storefront funnel event → Laravel MySQL (per store_id). */
export function trackStorefrontEvent(
  storeId: string | undefined | null,
  event: StorefrontEventName,
  extra?: { path?: string; customerId?: string; meta?: Record<string, unknown> },
): void {
  if (!storeId || !isApiEnabled() || typeof fetch === 'undefined') return;
  const traffic = readTrafficSource();
  const body = {
    event,
    path: extra?.path || (typeof location !== 'undefined' ? location.pathname : ''),
    source: traffic.source,
    medium: traffic.medium || undefined,
    campaign: traffic.campaign || undefined,
    customer_id: extra?.customerId,
    session_key: sessionKey(),
    meta: extra?.meta,
  };
  void fetch('/api/storefront/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Store-Id': storeId,
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);

  const activityType = EVENT_TO_ACTIVITY[event];
  if (!activityType) return;

  const meta = extra?.meta || {};
  const productId = asString(meta.product_id) || asString(meta.productId);
  const productName = asString(meta.product_name) || asString(meta.productName);
  const orderId = asString(meta.order_id) || asString(meta.orderId);
  const customerName = asString(meta.customer_name) || asString(meta.customerName);

  trackCustomerActivity(storeId, {
    activity_type: activityType,
    product_id: productId,
    product_name: productName,
    customer_id: extra?.customerId || asString(meta.customer_id),
    customer_name: customerName,
    order_id: orderId,
    meta,
  });

  if (event === 'purchase' && (meta.paid === true || meta.payment_completed === true)) {
    trackCustomerActivity(storeId, {
      activity_type: 'payment_completed',
      product_id: productId,
      product_name: productName,
      customer_id: extra?.customerId || asString(meta.customer_id),
      customer_name: customerName,
      order_id: orderId,
      meta,
    });
  }
}
