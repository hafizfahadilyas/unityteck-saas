import type { CartItem } from './types';
import type { OrderItemRecord } from './context/CartContext';

export function thankYouOrderNumber(
  order: { orderNumber?: string | null } | null | undefined,
): string | null {
  const id = String(order?.orderNumber || '').trim();
  if (!id) return null;
  if (/sample|demo|test-order/i.test(id)) return null;
  return id;
}

export function coffeeLastOrderKey(storeId: string): string {
  return `unityteck_coffee_last_order_${storeId}`;
}

export function normalizeOrderNumberKey(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .replace(/^#/, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

/** Parse storefront delivery_location → city / district / street (real checkout fields). */
export function parseDeliveryLocation(raw: string | null | undefined): {
  city: string;
  district: string;
  street: string;
} {
  const text = String(raw || '').trim();
  if (!text) return { city: '', district: '', street: '' };
  // Drop trailing geo coordinates (lat,lng) appended at checkout
  const withoutGeo = text
    .replace(/\s*[·•]\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+(\s*[·•]\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+)*\s*$/g, '')
    .trim();
  const dashParts = withoutGeo.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (dashParts.length >= 2) {
    const city = dashParts[0];
    const rest = dashParts.slice(1).join(' - ');
    const commaParts = rest.split(',').map((p) => p.trim()).filter(Boolean);
    return {
      city,
      district: commaParts[0] || '',
      street: commaParts.slice(1).join(', ') || (commaParts.length <= 1 ? rest : ''),
    };
  }
  const commaParts = withoutGeo.split(',').map((p) => p.trim()).filter(Boolean);
  return {
    city: commaParts[0] || withoutGeo,
    district: commaParts[1] || '',
    street: commaParts.slice(2).join(', ') || '',
  };
}

/** Map API / tenant order line → cart-shaped line for invoice + thank-you. */
export function mapApiLineToCartItem(
  it: Record<string, unknown>,
  idx: number,
  isAr = false,
): CartItem {
  const productName = String(
    it.product_name || it.productName || it.name || (isAr ? 'منتج' : 'Product'),
  );
  const image = String(it.image_url || it.imageUrl || it.image || '');
  const unitPrice = Number(it.unit_price ?? it.unitPrice ?? it.price ?? 0) || 0;
  const quantity = Math.max(1, Number(it.quantity ?? 1) || 1);
  const productId = String(it.product_id || it.productId || it.sku || it.id || `line-${idx + 1}`);
  return {
    id: String(it.id || `${productId}-${idx}`),
    productId,
    productName,
    unitPrice,
    quantity,
    image,
    selectedColor: { name: 'Standard', nameAr: 'قياسي', hex: '#333', image },
    selectedStorage: { capacity: 'Standard', ram: '', priceDelta: 0 },
    variationId: it.variation_id != null ? String(it.variation_id) : it.variationId != null ? String(it.variationId) : null,
    selectedOptions:
      it.selected_options && typeof it.selected_options === 'object' && !Array.isArray(it.selected_options)
        ? (it.selected_options as Record<string, string>)
        : it.selectedOptions && typeof it.selectedOptions === 'object' && !Array.isArray(it.selectedOptions)
          ? (it.selectedOptions as Record<string, string>)
          : null,
    optionSummary: typeof it.optionSummary === 'string' ? it.optionSummary : undefined,
    purchaseNotes: Array.isArray(it.purchaseNotes)
      ? (it.purchaseNotes as string[])
      : undefined,
  };
}

export function orderRecordFromApiLike(
  row: Record<string, unknown>,
  isAr = false,
): OrderItemRecord {
  const rawItems = Array.isArray(row.items) ? row.items : [];
  const shippingRaw = row.shipping_cost ?? row.shippingFee ?? row.shipping_fee;
  const shippingFee =
    shippingRaw != null && shippingRaw !== '' && Number.isFinite(Number(shippingRaw))
      ? Math.max(0, Number(shippingRaw))
      : undefined;
  const delivery = String(row.delivery_location || row.deliveryLocation || row.shippingAddress || '');
  const parsed = parseDeliveryLocation(delivery);
  const notes = String(row.customer_notes || row.customerNotes || '').trim();
  const shipMethod = String(
    row.shipping_method_label || row.shippingMethodLabel || row.shipping_company || row.shippingCompany || '',
  ).trim();
  return {
    id: String(row.id || row.order_number || row.orderNumber || ''),
    orderNumber: String(row.order_number || row.orderNumber || ''),
    date: String(row.order_date || row.date || row.created_at || '').slice(0, 16),
    items: rawItems.map((it, idx) => mapApiLineToCartItem((it || {}) as Record<string, unknown>, idx, isAr)),
    total: Number(row.total_amount ?? row.total ?? 0) || 0,
    shippingFee,
    paymentMethod: String(row.payment_method || row.paymentMethod || ''),
    shippingMethodLabel: shipMethod || undefined,
    customerEmail: String(row.customer_email || row.customerEmail || '').trim() || undefined,
    customerNotes: notes || undefined,
    shippingAddress: {
      name: String(row.customer_name || row.customerName || ''),
      phone: String(row.customer_phone || row.customerPhone || ''),
      city: parsed.city,
      district: parsed.district,
      street: parsed.street,
    },
    status: String(row.status || 'pending'),
  };
}

export function readPersistedLastOrder(storeId: string): OrderItemRecord | null {
  if (!storeId || typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(coffeeLastOrderKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderItemRecord;
    if (!parsed?.orderNumber) return null;
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return parsed;
  } catch {
    return null;
  }
}

export function persistLastOrder(storeId: string, order: OrderItemRecord | null): void {
  if (!storeId || typeof sessionStorage === 'undefined') return;
  try {
    const key = coffeeLastOrderKey(storeId);
    if (!order) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, JSON.stringify(order));
  } catch {
    /* ignore quota */
  }
}

export function mergeOrderItemsPreferNonEmpty(
  primary: OrderItemRecord | null,
  fallback: OrderItemRecord | null,
): OrderItemRecord | null {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;
  const primaryItems = Array.isArray(primary.items) ? primary.items : [];
  const fallbackItems = Array.isArray(fallback.items) ? fallback.items : [];
  const mergedAddress = {
    name: primary.shippingAddress?.name || fallback.shippingAddress?.name || '',
    phone: primary.shippingAddress?.phone || fallback.shippingAddress?.phone || '',
    city: primary.shippingAddress?.city || fallback.shippingAddress?.city || '',
    district: primary.shippingAddress?.district || fallback.shippingAddress?.district || '',
    street: primary.shippingAddress?.street || fallback.shippingAddress?.street || '',
  };
  const base: OrderItemRecord = {
    ...primary,
    items: primaryItems.length > 0 ? primaryItems : fallbackItems,
    shippingFee:
      typeof primary.shippingFee === 'number' ? primary.shippingFee : fallback.shippingFee,
    paymentMethod: primary.paymentMethod || fallback.paymentMethod,
    shippingMethodLabel: primary.shippingMethodLabel || fallback.shippingMethodLabel,
    customerEmail: primary.customerEmail || fallback.customerEmail,
    customerNotes: primary.customerNotes || fallback.customerNotes,
    shippingAddress: mergedAddress,
  };
  return base;
}
