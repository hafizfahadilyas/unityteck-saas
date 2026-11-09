/**
 * Normalize stored GA4 runReport snapshot → flat metrics for Analytics page.
 * Never invent values — missing rows stay 0 / empty.
 */

export type NormalizedGa4Metrics = {
  realtimeUsers: number;
  sessions: number;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  pageViews: number;
  bounceRate: number | null;
  deviceBreakdown: { mobile: number; desktop: number; tablet: number };
  trafficSources: Array<{ source: string; users: number; sessions: number }>;
  countries: Array<{ name: string; sessions: number }>;
};

function sumMetricColumn(rows: unknown, metricIndex: number): number {
  if (!Array.isArray(rows)) return 0;
  let total = 0;
  for (const row of rows) {
    const metrics = (row as { metricValues?: Array<{ value?: string }> })?.metricValues;
    const raw = metrics?.[metricIndex]?.value;
    const n = Number(raw);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

function readOverviewTotals(overview: any): {
  totalUsers: number;
  sessions: number;
  newUsers: number;
  pageViews: number;
  bounceRate: number | null;
} {
  const rows = overview?.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return { totalUsers: 0, sessions: 0, newUsers: 0, pageViews: 0, bounceRate: null };
  }
  // Metrics order from GoogleService::fetchAnalyticsReport overview:
  // activeUsers, sessions, newUsers, screenPageViews, conversions, purchaseRevenue, bounceRate
  const totalUsers = sumMetricColumn(rows, 0);
  const sessions = sumMetricColumn(rows, 1);
  const newUsers = sumMetricColumn(rows, 2);
  const pageViews = sumMetricColumn(rows, 3);
  // bounceRate is a rate — average across days when present
  let bounceSum = 0;
  let bounceN = 0;
  for (const row of rows) {
    const raw = row?.metricValues?.[6]?.value;
    const n = Number(raw);
    if (Number.isFinite(n)) {
      bounceSum += n;
      bounceN += 1;
    }
  }
  return {
    totalUsers,
    sessions,
    newUsers,
    pageViews,
    bounceRate: bounceN > 0 ? bounceSum / bounceN : null,
  };
}

function readDevices(devices: any): { mobile: number; desktop: number; tablet: number } {
  const out = { mobile: 0, desktop: 0, tablet: 0 };
  const rows = devices?.rows;
  if (!Array.isArray(rows)) return out;
  for (const row of rows) {
    const cat = String(row?.dimensionValues?.[0]?.value || '').toLowerCase();
    const sessions = Number(row?.metricValues?.[0]?.value) || 0;
    if (cat.includes('mobile')) out.mobile += sessions;
    else if (cat.includes('desktop')) out.desktop += sessions;
    else if (cat.includes('tablet')) out.tablet += sessions;
  }
  return out;
}

function readChannels(channels: any): Array<{ source: string; users: number; sessions: number }> {
  const rows = channels?.rows;
  if (!Array.isArray(rows)) return [];
  const map = new Map<string, { source: string; users: number; sessions: number }>();
  for (const row of rows) {
    const channel = String(row?.dimensionValues?.[0]?.value || '').trim();
    const source = String(row?.dimensionValues?.[1]?.value || '').trim();
    const medium = String(row?.dimensionValues?.[2]?.value || '').trim();
    const label =
      channel && channel !== '(not set)'
        ? channel
        : [source, medium].filter(Boolean).join(' / ') || 'Direct';
    const sessions = Number(row?.metricValues?.[0]?.value) || 0;
    const users = Number(row?.metricValues?.[1]?.value) || 0;
    const prev = map.get(label) || { source: label, users: 0, sessions: 0 };
    prev.sessions += sessions;
    prev.users += users;
    map.set(label, prev);
  }
  return Array.from(map.values())
    .filter((r) => r.sessions > 0 || r.users > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
}

function readCountries(countries: any): Array<{ name: string; sessions: number }> {
  const rows = countries?.rows;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row: any) => ({
      name: String(row?.dimensionValues?.[0]?.value || '').trim() || 'Unknown',
      sessions: Number(row?.metricValues?.[0]?.value) || 0,
    }))
    .filter((r: { sessions: number }) => r.sessions > 0)
    .sort((a: { sessions: number }, b: { sessions: number }) => b.sessions - a.sessions)
    .slice(0, 8);
}

/** Accept getAnalytics API body OR raw analytics_snapshot. */
export function normalizeGa4Snapshot(payload: unknown): NormalizedGa4Metrics {
  const empty: NormalizedGa4Metrics = {
    realtimeUsers: 0,
    sessions: 0,
    totalUsers: 0,
    newUsers: 0,
    returningUsers: 0,
    pageViews: 0,
    bounceRate: null,
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    trafficSources: [],
    countries: [],
  };

  if (!payload || typeof payload !== 'object') return empty;
  const root = payload as Record<string, unknown>;

  // Prefer nested snapshot from /google/analytics response
  const snapshot =
    (root.snapshot && typeof root.snapshot === 'object' ? root.snapshot : null) ||
    (root.data && typeof root.data === 'object' && (root.data as any).snapshot
      ? (root.data as any).snapshot
      : null) ||
    // Already a snapshot object
    (root.overview || root.devices || root.channels ? root : null) ||
    // Flat legacy shape already normalized
    (root.sessions != null || root.realtimeUsers != null ? root : null);

  if (!snapshot || typeof snapshot !== 'object') return empty;
  const snap = snapshot as Record<string, any>;

  // Already-flat shape (older clients)
  if (snap.sessions != null && !snap.overview) {
    const sessions = Math.max(0, Number(snap.sessions) || 0);
    const totalUsers = Math.max(0, Number(snap.totalUsers ?? snap.activeUsers) || 0);
    const newUsers = Math.max(0, Number(snap.newUsers) || 0);
    return {
      realtimeUsers: Math.max(0, Number(root.realtime_users ?? snap.realtimeUsers) || 0),
      sessions,
      totalUsers,
      newUsers,
      returningUsers: Math.max(0, totalUsers - newUsers),
      pageViews: Math.max(0, Number(snap.pageViews ?? snap.screenPageViews) || 0),
      bounceRate:
        snap.bounceRate == null || snap.bounceRate === ''
          ? null
          : Number(snap.bounceRate),
      deviceBreakdown: {
        mobile: Number(snap.deviceBreakdown?.mobile) || 0,
        desktop: Number(snap.deviceBreakdown?.desktop) || 0,
        tablet: Number(snap.deviceBreakdown?.tablet) || 0,
      },
      trafficSources: Array.isArray(snap.trafficSources) ? snap.trafficSources : [],
      countries: Array.isArray(snap.countries) ? snap.countries : [],
    };
  }

  const overview = readOverviewTotals(snap.overview);
  const returningUsers = Math.max(0, overview.totalUsers - overview.newUsers);
  const realtimeUsers = Math.max(
    0,
    Number(root.realtime_users ?? snap.realtimeUsers ?? snap.realtime_users) || 0,
  );

  return {
    realtimeUsers,
    sessions: overview.sessions,
    totalUsers: overview.totalUsers,
    newUsers: overview.newUsers,
    returningUsers,
    pageViews: overview.pageViews,
    bounceRate: overview.bounceRate,
    deviceBreakdown: readDevices(snap.devices),
    trafficSources: readChannels(snap.channels),
    countries: readCountries(snap.countries),
  };
}
