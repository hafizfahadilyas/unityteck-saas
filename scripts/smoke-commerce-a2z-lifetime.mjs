/**
 * Lifetime commerce A–Z smoke (read-only + safe public checks).
 * Run after deploy: node scripts/smoke-commerce-a2z-lifetime.mjs
 */
const CENTRAL = 'https://mieraf-ksa.com';
const FLOWERS = 'https://giftshop-sa.com';

const results = [];
function ok(label, pass, detail = '') {
  results.push({ label, pass: !!pass, detail });
  console.log(pass ? 'PASS' : 'FAIL', label, detail);
}

async function api(base, path, { method = 'GET', storeId, body, headers = {} } = {}) {
  const res = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(storeId ? { 'X-Store-Id': storeId } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

async function main() {
  console.log('\n=== Commerce A–Z lifetime smoke ===\n');

  const h1 = await api(FLOWERS, '/health');
  ok('flowers health mysql', h1.status === 200 && h1.json?.database === 'active_live_mysql', h1.json?.database);

  const h2 = await api(CENTRAL, '/health');
  ok('central health mysql', h2.status === 200 && h2.json?.database === 'active_live_mysql', h2.json?.database);

  const blecoPath = await api(CENTRAL, '/storefront/resolve-domain?domain=mieraf-ksa.com&path=/bleco');
  ok('bleco path resolve', blecoPath.json?.store_id === 'store-bleco', blecoPath.json?.store_id);

  const coffeeApex = await api(CENTRAL, '/storefront/resolve-domain?domain=mieraf-ksa.com');
  ok('mieraf apex = coffee', coffeeApex.json?.store_id === 'store-coffee', coffeeApex.json?.store_id);

  const ordersLeak = await api(CENTRAL, '/orders?per_page=1', { storeId: 'store-bleco' });
  ok('orders unauth blocked', ordersLeak.status === 401 || ordersLeak.status === 403, `HTTP ${ordersLeak.status}`);

  const custLeak = await api(CENTRAL, '/customers', { storeId: 'store-coffee' });
  ok('customers unauth blocked', custLeak.status === 401 || custLeak.status === 403, `HTTP ${custLeak.status}`);

  const guestOrder = await api(CENTRAL, '/storefront/orders', {
    method: 'POST',
    storeId: 'store-bleco',
    body: {
      customer_name: 'Smoke Guest Block',
      customer_phone: '966509998877',
      total_amount: 10,
      payment_method: 'COD',
      items: [{ product_id: 'prod-mat-diamond', name: 'test', quantity: 1, price: 10 }],
    },
  });
  ok(
    'guest order blocked (login required)',
    guestOrder.status === 401 && guestOrder.json?.code === 'login_required',
    `HTTP ${guestOrder.status} code=${guestOrder.json?.code}`,
  );

  const coupon = await api(CENTRAL, '/storefront/coupons/validate', {
    method: 'POST',
    storeId: 'store-coffee',
    body: { code: 'BARISTA15', cart_total: 500 },
  });
  ok(
    'coupon valid+discount contract',
    coupon.status === 200 && coupon.json?.valid === true && Number(coupon.json?.discount) > 0,
    `valid=${coupon.json?.valid} discount=${coupon.json?.discount}`,
  );

  const gift = await api(CENTRAL, '/storefront/gift-cards/balance', {
    method: 'POST',
    storeId: 'store-coffee',
    body: { code: 'NOPE-SMOKE-CARD' },
  });
  ok(
    'gift card invalid returns valid:false',
    gift.status === 404 && gift.json?.valid === false,
    `HTTP ${gift.status} valid=${gift.json?.valid}`,
  );

  const robots = await fetch(`${FLOWERS}/robots.txt`, { signal: AbortSignal.timeout(20000) });
  const robotsTxt = await robots.text();
  ok('robots no Allow /src/', !/allow:\s*\/src/i.test(robotsTxt), robotsTxt.slice(0, 120).replace(/\n/g, ' | '));
  ok('robots disallow src or clean', /disallow:\s*\/src/i.test(robotsTxt) || !/allow:\s*\/src/i.test(robotsTxt));

  const blecoHtml = await fetch(`${CENTRAL}/bleco`, { signal: AbortSignal.timeout(20000) });
  ok('bleco page 200', blecoHtml.status === 200, `HTTP ${blecoHtml.status}`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===\n`);
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.label).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
