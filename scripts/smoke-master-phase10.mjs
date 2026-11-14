/**
 * SOUQ PLUS Phase 10 — full Master API inventory smoke (read-only).
 * Usage:
 *   node scripts/smoke-master-phase10.mjs
 *   MASTER_BASE=https://mieraf-ksa.com MASTER_BEARER=lite|... node scripts/smoke-master-phase10.mjs
 *
 * Without bearer: health must be 200; master routes should be 401 (wired) or 404 (not deployed yet).
 * With bearer: expect 200 on checklist / channels / jobs / mfa-status.
 */
const base = (process.env.MASTER_BASE || 'https://mieraf-ksa.com').replace(/\/$/, '');
const bearer = (process.env.MASTER_BEARER || '').trim();

const MASTER_ROUTES = [
  '/api/master/payments/ledger',
  '/api/master/security/mfa-status',
  '/api/master/acceptance/checklist',
  '/api/master/messaging/channels',
  '/api/master/messaging/templates',
  '/api/master/messaging/deliveries',
  '/api/master/ops/jobs',
  '/api/master/ops/errors',
  '/api/master/ops/maintenance',
  '/api/master/settings/policies',
  '/api/master/privacy/requests',
  '/api/master/attachments',
  '/api/master/stores/status-history',
  '/api/master/security/admins',
  '/api/master/security/roles',
  '/api/master/accounts/verification',
  '/api/master/support/tickets',
  '/api/master/support/complaints',
  '/api/master/notifications',
  '/api/master/services',
];

async function probe(path, withAuth = false) {
  const headers = { Accept: 'application/json', 'X-Portal': 'master' };
  if (withAuth && bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { method: 'GET', headers });
    let json = null;
    try {
      json = JSON.parse(await res.text());
    } catch {
      /* ignore */
    }
    return {
      path,
      status: res.status,
      ok: res.ok,
      available: json?.meta?.available,
      source: json?.meta?.source || json?.mode || null,
      auth: withAuth && Boolean(bearer),
    };
  } catch (e) {
    return { path, status: 0, ok: false, error: String(e?.message || e), auth: withAuth && Boolean(bearer) };
  }
}

const health = await probe('/api/health', false);
const anon = [];
for (const p of MASTER_ROUTES) {
  anon.push(await probe(p, false));
}

let authed = [];
if (bearer) {
  for (const p of MASTER_ROUTES) {
    authed.push(await probe(p, true));
  }
}

const wired = anon.filter((r) => r.status === 401 || r.status === 403 || r.status === 200);
const missing = anon.filter((r) => r.status === 404 || r.status === 0);
const summary = {
  base,
  health,
  bearer: Boolean(bearer),
  anon: {
    total: anon.length,
    wired: wired.length,
    missing: missing.length,
    missing_paths: missing.map((m) => m.path),
  },
  authed_ok: authed.filter((r) => r.ok).length,
  authed_fail: authed.filter((r) => !r.ok).map((r) => ({ path: r.path, status: r.status })),
};

console.log(JSON.stringify(summary, null, 2));

if (!health.ok) {
  console.error('FAIL: /api/health');
  process.exit(1);
}

// Phase 10 local gate: health only. Phase 11 post-deploy expects wired (not 404).
const expectDeployed = process.env.EXPECT_DEPLOYED === '1';
if (expectDeployed && missing.length > 0) {
  console.error(`FAIL: ${missing.length} Master routes still 404 after deploy`);
  process.exit(1);
}

console.log(
  expectDeployed
    ? `PASS: health OK · ${wired.length}/${anon.length} Master routes wired`
    : `PASS: health OK · ${wired.length}/${anon.length} wired · ${missing.length} not deployed yet (OK pre-deploy)`,
);
