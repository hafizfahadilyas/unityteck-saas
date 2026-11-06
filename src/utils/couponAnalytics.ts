import type { CouponItem, Order } from '../types';

export type CouponAnalytics = {
  customerCount: number;
  totalSales: number | null;
  usageCount: number;
  usageFrequencyPct: number;
};

export function computeCouponAnalytics(
  coupon: CouponItem,
  orders: Order[],
): CouponAnalytics {
  const code = coupon.code.trim().toUpperCase();
  const matched = orders.filter(
    (o) => o.discountCode && o.discountCode.trim().toUpperCase() === code,
  );

  const usageCount = coupon.usageCount ?? matched.length;
  const customerIds = new Set(
    matched
      .map((o) => o.customerEmail || o.customerPhone || o.customerName)
      .filter(Boolean),
  );
  const customerCount = customerIds.size;

  let totalSales: number | null = null;
  if (matched.length > 0) {
    totalSales = matched.reduce((sum, o) => sum + (o.total ?? 0), 0);
  }

  const usageFrequencyPct =
    customerCount > 0 ? Math.round((usageCount / customerCount) * 100) : 0;

  return {
    customerCount,
    totalSales,
    usageCount,
    usageFrequencyPct,
  };
}
