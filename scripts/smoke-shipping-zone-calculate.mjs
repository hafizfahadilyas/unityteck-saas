#!/usr/bin/env node
/**
 * SPC smoke: shipping zones must match city on calculate (lifetime lock).
 * Usage: node scripts/smoke-shipping-zone-calculate.mjs
 */
const stores = [
  { id: 'store-1', host: 'https://giftshop-sa.com', expectMakkahZone: true },
  { id: 'store-coffee', host: 'https://mieraf-ksa.com', expectMakkahZone: true },
  { id: 'store-bleco', host: 'https://mieraf-ksa.com', expectMakkahZone: false },
];

async function get(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j };
}

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, j };
}

let failed = 0;

for (const s of stores) {
  const health = await get(`${s.host}/api/health`);
  if (health.status !== 200) {
    console.error('FAIL health', s.id, health.status);
    failed++;
    continue;
  }
  const zones = await get(`${s.host}/api/shipping?store_id=${s.id}&all=1`);
  const zoneList = Array.isArray(zones.j?.data) ? zones.j.data : [];
  const calc = await post(`${s.host}/api/storefront/shipping/calculate?store_id=${s.id}`, {
    city: 'مكة المكرمة',
    order_total: 150,
    total_weight_kg: 1,
  });
  const matched = calc.j?.matched_zone;
  const fee = Number(calc.j?.calculated_shipping_fee);
  const pay = await get(`${s.host}/api/storefront/payments/methods?store_id=${s.id}`);
  const methods = Array.isArray(pay.j?.methods) ? pay.j.methods : [];

  console.log('---', s.id, '---');
  console.log('zones', zoneList.length, 'calc', calc.status, 'matched', matched?.name || null, 'fee', fee);
  console.log('payments', pay.status, 'count', methods.length);

  if (calc.status !== 200) {
    console.error('FAIL calculate HTTP', s.id);
    failed++;
  }
  if (s.expectMakkahZone && zoneList.some((z) => /makkah|مكة|mecca/i.test(String(z.name || '') + String(z.region || '')))) {
    if (!matched) {
      console.error('FAIL matched_zone null but Makkah zones exist', s.id);
      failed++;
    }
  }
  if (pay.status !== 200) {
    console.error('FAIL payments', s.id);
    failed++;
  }
}

if (failed > 0) {
  console.error(`SMOKE FAIL (${failed})`);
  process.exit(1);
}
console.log('SMOKE OK');
process.exit(0);
