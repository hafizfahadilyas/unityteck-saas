/**
 * SOUQ PLUS Master Phase 1 — live public smoke (read-only, no auth).
 * Usage: node scripts/smoke-master-phase1.mjs [baseUrl]
 */
import https from 'https';

const base = (process.argv[2] || 'https://mieraf-ksa.com').replace(/\/$/, '');

function getJson(path) {
  return new Promise((resolve, reject) => {
    const url = `${base}${path}`;
    https
      .get(url, { headers: { Accept: 'application/json', 'User-Agent': 'unityteck-master-smoke' } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          let json = null;
          try {
            json = body ? JSON.parse(body) : null;
          } catch {
            json = null;
          }
          resolve({ url, status: res.statusCode, json, raw: body.slice(0, 200) });
        });
      })
      .on('error', reject);
  });
}

const checks = [
  ['/api/health', (r) => r.status === 200 && r.json?.database === 'active_live_mysql'],
  ['/api/plans', (r) => r.status === 200 && Array.isArray(r.json?.data) && r.json.data.length >= 1],
  ['/api/subscriptions', (r) => [401, 403].includes(r.status)],
  ['/api/master/services', (r) => [401, 403].includes(r.status)],
  ['/api/master/support/tickets', (r) => [401, 403].includes(r.status)],
  ['/api/master/platform-overview', (r) => [401, 403].includes(r.status)],
  ['/api/platform/settings', (r) => [401, 403].includes(r.status)],
  ['/master/login', (r) => r.status === 200 && !String(r.raw).includes('Cannot GET /')],
];

let failed = 0;
console.log(`Master Phase 1 smoke @ ${base}\n`);

for (const [path, ok] of checks) {
  const r = await getJson(path);
  const pass = ok(r);
  if (!pass) failed++;
  const detail =
    r.json?.meta?.source ||
    (Array.isArray(r.json?.data) ? `data[${r.json.data.length}]` : r.json?.message || r.raw || '');
  console.log(`${pass ? 'OK' : 'FAIL'} ${r.status} ${path} ${detail}`);
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');