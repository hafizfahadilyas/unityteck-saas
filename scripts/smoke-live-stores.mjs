/**
 * Smoke-test live storefront + API (flowers + coffee domains).
 * Usage: node scripts/smoke-live-stores.mjs
 */
const TARGETS = [
  { label: 'Flowers', site: 'https://giftshop-sa.com', storeId: 'store-1' },
  { label: 'Coffee', site: 'https://mieraf-ksa.com', storeId: 'store-coffee' },
  { label: 'Cars', site: 'https://mieraf-ksa.com', storeId: 'store-bleco' },
];

async function ping(url, init) {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = text.slice(0, 200);
    }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, error: String(e?.message || e) };
  }
}

for (const t of TARGETS) {
  console.log(`\n=== ${t.label} (${t.site}) ===`);
  const health = await ping(`${t.site}/api/health`);
  console.log('health', health.status, health.ok ? 'OK' : health.error || health.json);

  const event = await ping(`${t.site}/api/storefront/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Store-Id': t.storeId },
    body: JSON.stringify({
      event: 'page_view',
      path: '/smoke-test',
      session_key: `smoke_${Date.now()}`,
      source: 'Direct',
    }),
  });
  console.log('storefront/events', event.status, event.json);

  const sitemap = await ping(`${t.site}/sitemap.xml`);
  console.log('sitemap.xml', sitemap.status, typeof sitemap.json === 'string' ? sitemap.json.slice(0, 80) : 'non-xml');

  const robots = await ping(`${t.site}/robots.txt`);
  console.log('robots.txt', robots.status);

  const pay = await ping(
    `${t.site}/api/storefront/payments/methods?store_id=${encodeURIComponent(t.storeId)}`,
    { headers: { 'X-Store-Id': t.storeId } },
  );
  const payMethods = Array.isArray(pay.json?.methods) ? pay.json.methods.map((m) => m.id).join(',') : String(pay.status);
  console.log('payments/methods', pay.status, payMethods || pay.json);

  const ship = await ping(`${t.site}/api/shipping-methods`, {
    headers: { 'X-Store-Id': t.storeId, Accept: 'application/json' },
  });
  console.log(
    'shipping-methods',
    ship.status,
    Array.isArray(ship.json?.data) ? `count=${ship.json.data.length}` : ship.error || ship.json,
  );
}
