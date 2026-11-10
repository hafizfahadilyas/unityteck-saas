/**
 * Local + live real-data smoke (orders/customers/categories/products/analytics + order PATCH).
 * Usage: node scripts/smoke-local-real.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = path.join(root, 'apps', 'api');
const tokenFile = path.join(os.tmpdir(), 'unityteck_smoke_token.txt');

function mint() {
  const r = spawnSync('php', ['scripts/_smoke_mint_token.php'], {
    cwd: apiDir,
    encoding: 'utf8',
    shell: true,
  });
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr);
    process.exit(1);
  }
  console.log(String(r.stdout || '').trim());
  const orderId = String(r.stdout || '')
    .split('\n')
    .find((l) => l.startsWith('ORDER_ID='))
    ?.split('=')[1]
    ?.trim();
  const token = fs.readFileSync(tokenFile, 'utf8').trim();
  return { token, orderId };
}

async function hit(base, name, urlPath, { method = 'GET', token, storeId = 'store-coffee', body } = {}) {
  const url = `${base}${urlPath}`;
  const headers = {
    Accept: 'application/json',
    'X-Store-Id': storeId,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text.slice(0, 160);
    }
    const data = json?.data;
    const count = Array.isArray(data)
      ? data.length
      : typeof json?.meta?.total === 'number'
        ? json.meta.total
        : null;
    const ms = Date.now() - started;
    const ok = res.ok;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${name.padEnd(28)} ${res.status} ${count != null ? `n=${count}` : ''} ${ms}ms`,
    );
    return { ok, status: res.status, json, ms };
  } catch (e) {
    console.log(`FAIL ${name.padEnd(28)} ERR ${String(e?.message || e)}`);
    return { ok: false, error: String(e?.message || e) };
  }
}

const { token, orderId } = mint();
const local = 'http://127.0.0.1:8010/api';
const live = 'https://mieraf-ksa.com/api';

console.log('\n=== LOCAL (Hostinger DB via :8010) ===');
await hit(local, 'health', '/health');
await hit(local, 'orders', '/orders', { token });
await hit(local, 'customers', '/customers', { token });
await hit(local, 'categories', '/categories', { token });
await hit(local, 'products', '/products', { token });
await hit(local, 'dashboard-home', '/analytics/dashboard-home', { token });
await hit(local, 'analytics-overview', '/analytics/overview', { token });
await hit(local, 'sales-revenue', '/analytics/sales-revenue', { token });
await hit(local, 'behavior', '/analytics/behavior', { token });

if (orderId) {
  const patch = await hit(local, 'order-patch-customer', `/orders/${orderId}`, {
    method: 'PATCH',
    token,
    body: {
      customer_email: 'smoke.local@example.sa',
      delivery_location: 'Riyadh - Smoke Test District',
      payment_transaction_id: `SMOKE-${Date.now()}`,
    },
  });
  const show = await hit(local, 'order-show-after-patch', `/orders/${orderId}`, { token });
  const row = show.json?.data || show.json;
  const emailOk = String(row?.customer_email || '') === 'smoke.local@example.sa';
  const locOk = String(row?.delivery_location || '').includes('Smoke Test');
  const txOk = String(row?.payment_transaction_id || '').startsWith('SMOKE-');
  console.log(
    `${emailOk && locOk && txOk ? 'PASS' : 'FAIL'} order-patch-persist         email=${emailOk} loc=${locOk} tx=${txOk}`,
  );
}

console.log('\n=== LIVE mieraf-ksa.com ===');
await hit(live, 'health', '/health');
await hit(live, 'categories', '/categories');
await hit(live, 'storefront-catalog', '/storefront/catalog?store_id=store-coffee');
await hit(live, 'storefront-categories', '/storefront/categories?store_id=store-coffee');
await hit(live, 'payments-methods', '/storefront/payments/methods?store_id=store-coffee');

console.log('\nDone.');
