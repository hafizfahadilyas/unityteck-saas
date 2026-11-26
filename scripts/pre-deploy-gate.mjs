/**
 * Pre-deploy gate: build + live smoke (no deploy).
 * Usage: node scripts/pre-deploy-gate.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

async function shippingProbe(site, storeId, city) {
  const url = `${site}/api/shipping/calculate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Store-Id': storeId },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ city, order_total: 500, total_weight_kg: 1 }),
    });
    const json = await res.json();
    const methods = json.available_methods ?? json.methods ?? json.data ?? [];
    const count = Array.isArray(methods) ? methods.length : 0;
    if (!res.ok) {
      console.error(`FAIL ${url} HTTP ${res.status}`);
      return false;
    }
    console.log(`OK ${url} methods=${count}`);
    return true;
  } catch (e) {
    console.error(`FAIL ${url}`, e?.message || e);
    return false;
  }
}

console.log('=== Pre-deploy gate ===\n');

const probes = [
  shippingProbe('https://giftshop-sa.com', 'store-coffee', 'Riyadh'),
  shippingProbe('https://giftshop-sa.com', 'store-1', 'Riyadh'),
  shippingProbe('https://mieraf-ksa.com', 'store-coffee', 'الرياض'),
];

const ok = (await Promise.all(probes)).every(Boolean);
if (!ok) {
  console.error('\nShipping probe failed — fix before deploy.');
  process.exit(1);
}

console.log('\n--- smoke-live-stores ---');
run('node', ['scripts/smoke-live-stores.mjs']);

console.log('\n--- vite build ---');
run('npm', ['run', 'build']);

console.log('\nGate passed — safe to run:');
console.log('  node scripts/deploy-api-hotfiles.js --target=all');
console.log('  node scripts/deploy-laravel-hotfiles.js --target=all  (when Laravel controllers changed)');
console.log('  node scripts/deploy-delta.js --target=flowers');
console.log('  node scripts/deploy-delta.js --target=central');