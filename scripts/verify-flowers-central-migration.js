/**
 * Flowers → Central Hostinger cutover checker.
 *
 * Usage: node scripts/verify-flowers-central-migration.js
 *
 * Pass when giftshop-sa.com API is served from central MySQL (u393490678_ksa)
 * and resolves to store-1. Fail clearly while DNS still points at old host.
 */

import https from 'https';
import http from 'http';
import { resolve4 } from 'dns/promises';

const GIFT = 'giftshop-sa.com';
const CENTRAL = 'mieraf-ksa.com';
const EXPECT_DB = 'u393490678_ksa';
const EXPECT_STORE = 'store-1';

function getJson(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 20000 }, (res) => {
      let raw = '';
      res.on('data', (c) => {
        raw += c;
      });
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw.slice(0, 240);
        }
        resolve({ ok: true, status: res.statusCode || 0, body });
      });
    });
    req.on('error', (err) => resolve({ ok: false, status: 0, body: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: 'timeout' });
    });
  });
}

function line(ok, label, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  let fails = 0;

  let giftIps = [];
  let centralIps = [];
  try {
    giftIps = await resolve4(GIFT);
  } catch (e) {
    fails += 1;
    line(false, 'DNS giftshop A', e.message);
  }
  try {
    centralIps = await resolve4(CENTRAL);
  } catch (e) {
    fails += 1;
    line(false, 'DNS mieraf A', e.message);
  }

  if (giftIps.length && centralIps.length) {
    const overlap = giftIps.some((ip) => centralIps.includes(ip));
    if (!line(overlap, 'DNS same host as central', `gift=[${giftIps.join(',')}] central=[${centralIps.join(',')}]`)) {
      fails += 1;
      console.log('      → Addon domain + A records still on old flowers Hostinger.');
    }
  }

  const centralHealth = await getJson(`https://${CENTRAL}/api/health`);
  if (
    !line(
      centralHealth.status === 200 && centralHealth.body?.database === 'active_live_mysql',
      'Central /api/health',
      `${centralHealth.status} db=${centralHealth.body?.db_name || centralHealth.body}`,
    )
  ) {
    fails += 1;
  }

  const giftHealth = await getJson(`https://${GIFT}/api/health`);
  const giftDbOk =
    giftHealth.status === 200 &&
    giftHealth.body?.database === 'active_live_mysql' &&
    String(giftHealth.body?.db_name || '') === EXPECT_DB;
  if (
    !line(
      giftDbOk,
      'Giftshop /api/health on central DB',
      `${giftHealth.status} db=${giftHealth.body?.db_name || giftHealth.body}`,
    )
  ) {
    fails += 1;
  }

  const resolve = await getJson(`https://${GIFT}/api/storefront/resolve-domain?domain=${GIFT}`);
  if (
    !line(
      resolve.status === 200 && resolve.body?.store_id === EXPECT_STORE,
      'Resolve giftshop → store-1',
      `${resolve.status} store=${resolve.body?.store_id || resolve.body}`,
    )
  ) {
    fails += 1;
  }

  const products = await getJson(`https://${GIFT}/api/products?store_id=${EXPECT_STORE}&per_page=1`);
  const total = products.body?.meta?.total ?? products.body?.total ?? products.body?.counts?.total;
  if (
    !line(
      products.status === 200 && Array.isArray(products.body?.data),
      'Products store-1',
      `${products.status} total=${total ?? 'n/a'}`,
    )
  ) {
    fails += 1;
  }

  const masterBounce = await new Promise((resolvePromise) => {
    const req = https.get(
      `https://${GIFT}/master/login`,
      { timeout: 20000, headers: { Accept: 'text/html' } },
      (res) => {
        const loc = res.headers.location || '';
        resolvePromise({ status: res.statusCode || 0, location: loc });
        res.resume();
      },
    );
    req.on('error', (err) => resolvePromise({ status: 0, location: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolvePromise({ status: 0, location: 'timeout' });
    });
  });
  const bounced =
    (masterBounce.status === 302 || masterBounce.status === 301) &&
    String(masterBounce.location).includes('mieraf-ksa.com/master');
  if (!line(bounced, 'Master bounce giftshop → central', `${masterBounce.status} → ${masterBounce.location}`)) {
    fails += 1;
  }

  console.log('');
  if (fails === 0) {
    console.log('RESULT: CUTOVER OK — giftshop is on central Hostinger.');
    process.exit(0);
  }
  console.log(`RESULT: NOT READY — ${fails} check(s) failed. See docs/33-flowers-to-central-hostinger-migration.md`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
