/** Single # prefix for order refs — avoids ##001 when DB already stores "#001". */
export function formatOrderRef(orderNumber?: string | null, fallbackId?: string): string {
  const raw = String(orderNumber ?? fallbackId ?? '').trim();
  if (!raw) return '—';
  const digits = raw.replace(/^#+/, '').trim();
  if (!digits) return '#—';
  return `#${digits}`;
}
