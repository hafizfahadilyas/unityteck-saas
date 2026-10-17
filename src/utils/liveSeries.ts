/**
 * Live dashboard series from tenant orders — no synthetic curves.
 */

import type { CSSProperties } from 'react';
import type { Order } from '../types';

export type DateRangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';

export function rangeBounds(key: DateRangeKey): { start: Date; end: Date } | null {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (key === 'today') return { start, end };
  if (key === 'yesterday') {
    start.setDate(start.getDate() - 1);
    const yEnd = new Date(start);
    yEnd.setHours(23, 59, 59, 999);
    return { start, end: yEnd };
  }
  if (key === 'week') {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (key === 'month') {
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  if (key === 'year') {
    start.setFullYear(start.getFullYear() - 1);
    return { start, end };
  }
  return null;
}

export function parseOrderDate(raw: string | number | Date | undefined | null): Date | null {
  if (!raw && raw !== 0) return null;
  if (typeof raw === 'object' && raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === 'number') {
    const d = new Date(raw < 1e11 ? raw * 1000 : raw);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw !== 'string') return null;

  // Convert Arabic-Indic numerals to Latin numerals: ٠-٩ -> 0-9
  let clean = raw
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

  if (!clean) return null;

  // Check if it's a numeric timestamp string
  if (/^\d{10,13}$/.test(clean)) {
    const ts = parseInt(clean, 10);
    const d = new Date(ts < 1e11 ? ts * 1000 : ts);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // Handle standard ISO and Date.parse
  const iso = Date.parse(clean);
  if (!Number.isNaN(iso)) return new Date(iso);

  // Handle "10th Feb 2025" or "Feb 10th, 2025"
  const loose = Date.parse(clean.replace(/(\d+)(st|nd|rd|th)/i, '$1'));
  if (!Number.isNaN(loose)) return new Date(loose);

  // Handle DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
  const slashParts = clean.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})/);
  if (slashParts) {
    const [, p1, p2, p3] = slashParts;
    const n1 = parseInt(p1, 10);
    const n2 = parseInt(p2, 10);
    const n3 = parseInt(p3, 10);
    if (n1 > 1000) {
      // YYYY-MM-DD
      const d = new Date(n1, n2 - 1, n3);
      if (!Number.isNaN(d.getTime())) return d;
    } else if (n3 > 1000) {
      if (n1 > 12) {
        // DD/MM/YYYY
        const d = new Date(n3, n2 - 1, n1);
        if (!Number.isNaN(d.getTime())) return d;
      } else if (n2 > 12) {
        // MM/DD/YYYY
        const d = new Date(n3, n1 - 1, n2);
        if (!Number.isNaN(d.getTime())) return d;
      } else {
        // Default DD/MM/YYYY
        const d = new Date(n3, n2 - 1, n1);
        if (!Number.isNaN(d.getTime())) return d;
      }
    }
  }

  // Handle relative English and Arabic strings
  const lower = clean.toLowerCase();
  if (lower.includes('today') || clean.includes('اليوم')) {
    return new Date();
  }
  if (lower.includes('yesterday') || clean.includes('أمس') || clean.includes('امس')) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y;
  }

  return null;
}

export function getOrderDate(order: Order | undefined | null): Date | null {
  if (!order) return null;
  return (
    parseOrderDate(order.date) ||
    parseOrderDate((order as any).createdAt) ||
    parseOrderDate((order as any).created_at) ||
    parseOrderDate((order as any).order_date) ||
    parseOrderDate(order.paymentDate)
  );
}

export function filterOrdersByRange(
  orders: Order[],
  key: DateRangeKey,
  customStart?: Date | string | null,
  customEnd?: Date | string | null,
): Order[] {
  if (key === 'all') {
    if (customStart && customEnd) {
      const start =
        typeof customStart === 'string'
          ? new Date(customStart + (customStart.includes('T') ? '' : 'T00:00:00'))
          : new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end =
        typeof customEnd === 'string'
          ? new Date(customEnd + (customEnd.includes('T') ? '' : 'T23:59:59'))
          : new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      const [actualStart, actualEnd] =
        start.getTime() <= end.getTime() ? [start, end] : [end, start];
      return orders.filter((o) => {
        const d = getOrderDate(o);
        if (!d) return true;
        return d >= actualStart && d <= actualEnd;
      });
    }
    return orders;
  }
  const bounds = rangeBounds(key);
  if (!bounds) return orders;
  return orders.filter((o) => {
    const d = getOrderDate(o);
    if (!d) return true;
    return d >= bounds.start && d <= bounds.end;
  });
}

export function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function revenueByDate(orders: Order[], maxPoints = 7): { label: string; value: number }[] {
  const map = new Map<string, number>();
  orders.forEach((o) => {
    const d = getOrderDate(o);
    const key = d ? dayKey(d) : o.date || 'Unknown';
    map.set(key, (map.get(key) || 0) + (Number(o.total) || 0));
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-maxPoints)
    .map(([label, value]) => ({ label, value }));
}

export function ordersCountByDate(orders: Order[], maxPoints = 7): { label: string; value: number }[] {
  const map = new Map<string, number>();
  orders.forEach((o) => {
    const d = getOrderDate(o);
    const key = d ? dayKey(d) : o.date || 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-maxPoints)
    .map(([label, value]) => ({ label, value }));
}

export function revenueByWeek(orders: Order[]): { label: string; value: number }[] {
  if (!orders.length) return [];
  const withDates = orders
    .map((o) => ({ o, d: getOrderDate(o) }))
    .filter((x): x is { o: Order; d: Date } => Boolean(x.d))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  if (!withDates.length) {
    const total = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    return [{ label: 'All', value: total }];
  }

  const origin = withDates[0].d.getTime();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const map = new Map<number, number>();
  withDates.forEach(({ o, d }) => {
    const w = Math.floor((d.getTime() - origin) / weekMs);
    map.set(w, (map.get(w) || 0) + (Number(o.total) || 0));
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([w, value]) => ({ label: `W${w + 1}`, value }));
}

export function sparkFromSeries(series: { value: number }[]): number[] {
  if (!series.length) return [0, 0];
  const vals = series.map((s) => s.value);
  if (vals.length === 1) return [vals[0], vals[0]];
  return vals;
}

export type SourceAgg = {
  source: string;
  count: number;
  total: number;
  pct: number;
};

export function aggregateOrderSources(orders: Order[]): SourceAgg[] {
  if (!orders.length) return [];
  const map = new Map<string, { count: number; total: number }>();
  orders.forEach((o) => {
    const src = (o.source && String(o.source).trim()) || 'Unknown';
    const cur = map.get(src) || { count: 0, total: 0 };
    cur.count += 1;
    cur.total += Number(o.total) || 0;
    map.set(src, cur);
  });
  const n = orders.length;
  return Array.from(map.entries())
    .map(([source, v]) => ({
      source,
      count: v.count,
      total: v.total,
      pct: Math.round((v.count / n) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export function sourceTone(source: string): {
  accent: string;
  icon: 'whatsapp' | 'instagram' | 'google' | 'direct' | 'other';
} {
  const s = source.toLowerCase();
  if (s.includes('whatsapp')) return { accent: 'var(--tone-success)', icon: 'whatsapp' };
  if (s.includes('instagram')) return { accent: 'var(--tone-danger)', icon: 'instagram' };
  if (s.includes('google')) return { accent: 'var(--tone-info)', icon: 'google' };
  if (s.includes('direct') || s.includes('unknown')) {
    return { accent: 'var(--muted)', icon: 'direct' };
  }
  return { accent: 'var(--accent)', icon: 'other' };
}

export function statusChipStyle(status: string): CSSProperties {
  const s = status.toLowerCase();
  if (s === 'completed') {
    return {
      background: 'color-mix(in srgb, var(--tone-success) 14%, var(--surface))',
      color: 'var(--tone-success)',
      borderColor: 'color-mix(in srgb, var(--tone-success) 30%, var(--border))',
    };
  }
  if (s === 'pending') {
    return {
      background: 'color-mix(in srgb, var(--tone-warn) 14%, var(--surface))',
      color: 'var(--tone-warn)',
      borderColor: 'color-mix(in srgb, var(--tone-warn) 30%, var(--border))',
    };
  }
  if (s === 'cancelled') {
    return {
      background: 'color-mix(in srgb, var(--tone-danger) 14%, var(--surface))',
      color: 'var(--tone-danger)',
      borderColor: 'color-mix(in srgb, var(--tone-danger) 30%, var(--border))',
    };
  }
  return {
    background: 'color-mix(in srgb, var(--tone-info) 14%, var(--surface))',
    color: 'var(--tone-info)',
    borderColor: 'color-mix(in srgb, var(--tone-info) 30%, var(--border))',
  };
}
