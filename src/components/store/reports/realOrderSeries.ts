type DatedOrder = { date?: string; createdAt?: string; total?: number; source?: string; tax?: number; shippingFee?: number };

export function ordersByDay(orders: DatedOrder[], locale: string) {
  const map = new Map<string, { revenue: number; orders: number; stamp: number }>();
  for (const order of orders) {
    const raw = order.createdAt || order.date || '';
    const when = new Date(raw);
    if (Number.isNaN(when.getTime())) continue;
    const key = when.toISOString().slice(0, 10);
    const row = map.get(key) || { revenue: 0, orders: 0, stamp: when.getTime() };
    row.revenue += Number(order.total) || 0;
    row.orders += 1;
    map.set(key, row);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].stamp - b[1].stamp)
    .map(([key, row]) => ({
      label: new Date(key).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
      revenue: row.revenue,
      orders: row.orders,
    }));
}

const SOURCE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#94a3b8'];
const SOURCE_AR: Record<string, string> = {
  Direct: 'مباشر',
  Instagram: 'إنستغرام',
  'Google Ads': 'إعلانات جوجل',
  TikTok: 'تيك توك',
  Snapchat: 'سناب شات',
  'Organic Search': 'بحث طبيعي',
  'AI Assistant': 'مساعد ذكي',
  Referral: 'إحالة',
  WhatsApp: 'واتساب',
  Facebook: 'فيسبوك',
  Website: 'الموقع',
};

export function sourceLabel(source: string, isAr: boolean) {
  if (!isAr) return source;
  return SOURCE_AR[source] || source;
}

export function ordersBySource(orders: DatedOrder[]) {
  const map = new Map<string, { orders: number; revenue: number }>();
  for (const order of orders) {
    const source = String(order.source || '').trim();
    if (!source) continue;
    const row = map.get(source) || { orders: 0, revenue: 0 };
    row.orders += 1;
    row.revenue += Number(order.total) || 0;
    map.set(source, row);
  }
  const total = [...map.values()].reduce((sum, row) => sum + row.orders, 0);
  return [...map.entries()].map(([source, row], idx) => ({
    nameAr: sourceLabel(source, true),
    nameEn: source,
    source,
    color: SOURCE_COLORS[idx % SOURCE_COLORS.length],
    darkColor: SOURCE_COLORS[idx % SOURCE_COLORS.length],
    orders: row.orders,
    revenue: row.revenue,
    pct: total > 0 ? Math.round((row.orders / total) * 1000) / 10 : 0,
    percentage: total > 0 ? Math.round((row.revenue / Math.max(1, [...map.values()].reduce((s, r) => s + r.revenue, 0))) * 1000) / 10 : 0,
  }));
}

export function savedTaxTotal(orders: DatedOrder[]) {
  return orders.reduce((sum, order) => sum + (Number(order.tax) || 0), 0);
}
