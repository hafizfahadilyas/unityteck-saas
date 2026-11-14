/**
 * SOUQ PLUS Phase 9 — read-only §9 smoke against live Master host (no secrets printed).
 * Usage: node scripts/smoke-master-phase9.mjs
 * Optional: MASTER_BASE=https://mieraf-ksa.com
 */
const base = (process.env.MASTER_BASE || 'https://mieraf-ksa.com').replace(/\/$/, '');

async function probe(path) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* ignore */
    }
    return { path, status: res.status, ok: res.ok, mode: json?.mode || json?.meta?.source || null };
  } catch (e) {
    return { path, status: 0, ok: false, error: String(e?.message || e) };
  }
}

const paths = [
  '/api/health',
  '/api/master/payments/ledger',
  '/api/master/security/mfa-status',
  '/api/master/acceptance/checklist',
  '/api/master/messaging/channels',
  '/api/master/ops/jobs',
];

const results = [];
for (const p of paths) {
  // Unauthenticated probes: expect 401 on master routes, 200 on health.
  results.push(await probe(p));
}

console.log(JSON.stringify({ base, results }, null, 2));

const health = results.find((r) => r.path === '/api/health');
if (!health?.ok) {
  console.error('FAIL: /api/health not OK');
  process.exit(1);
}
console.log('PASS: health reachable. Master routes may return 401 without Bearer (expected).');
