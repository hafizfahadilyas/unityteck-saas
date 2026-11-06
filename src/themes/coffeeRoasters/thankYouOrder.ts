export function thankYouOrderNumber(order: { orderNumber?: string | null } | null | undefined): string | null {
  const id = String(order?.orderNumber || '').trim();
  if (!id) return null;
  if (/sample|demo|test-order/i.test(id)) return null;
  return id;
}
