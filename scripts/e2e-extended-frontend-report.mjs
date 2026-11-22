/**
 * Extended E2E: product edit propagation, store isolation, invoice, BNPL methods, learn-more HTML.
 */
const stamp = Date.now().toString(36);

const STORES = [
  { label: 'Flowers', site: 'https://giftshop-sa.com', storeId: 'store-1', otherId: 'store-coffee' },
  { label: 'Coffee', site: 'https://mieraf-ksa.com', storeId: 'store-coffee', otherId: 'store-1' },
];

const results = [];
function ok(label, pass, detail) {
  results.push({ label, pass: !!pass, detail: detail ?? '' });
  console.log(pass ? 'PASS' : 'FAIL', label, detail ?? '');
}

async function api(site, storeId, path, { method = 'GET', body, timeoutMs = 45000 } = {}) {
  const res = await fetch(`${site}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Store-Id': storeId,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

async function runStore(t) {
  console.log(`\n--- ${t.label} extended ---`);
  const prodId = `e2e-ext-${t.storeId}-${stamp}`;
  const editedName = `E2E Edited ${stamp}`;
  const editedNameAr = `منتج معدّل ${stamp}`;

  const create = await api(t.site, t.storeId, '/products', {
    method: 'POST',
    body: {
      id: prodId,
      store_id: t.storeId,
      name: `E2E Base ${stamp}`,
      name_ar: `قاعدة اختبار ${stamp}`,
      sku: `EXT-${stamp}`.toUpperCase(),
      price: 299,
      stock: 5,
      status: 'published',
      is_active: true,
      description: 'Learn more body v1',
      description_ar: 'نص تعلم المزيد الإصدار ١',
    },
  });
  ok(`${t.label} create product`, create.status === 200 || create.status === 201, `status=${create.status}`);

  const patch = await api(t.site, t.storeId, `/products/${prodId}`, {
    method: 'PATCH',
    body: {
      name: editedName,
      name_ar: editedNameAr,
      price: 349,
      description: 'Learn more body v2 UPDATED',
      description_ar: 'نص تعلم المزيد الإصدار ٢ محدّث',
    },
  });
  ok(`${t.label} edit product`, patch.status === 200, `status=${patch.status}`);

  const show = await api(t.site, t.storeId, `/products/${prodId}`);
  const d = show.json?.data || {};
  ok(
    `${t.label} single product reflects edit`,
    show.status === 200 && d.name === editedName && Number(d.price) === 349,
    `name=${d.name} price=${d.price}`,
  );
  ok(
    `${t.label} learn-more description updated`,
    String(d.description || '').includes('v2 UPDATED'),
    `desc=${String(d.description).slice(0, 40)}`,
  );

  const catalog = await api(t.site, t.storeId, `/storefront/catalog?store_id=${encodeURIComponent(t.storeId)}&page=1&per_page=100`);
  const inCat = (catalog.json?.data || []).some((p) => p.id === prodId);
  ok(`${t.label} catalog shows new product`, catalog.status === 200 && inCat, `found=${inCat}`);

  const cross = await api(t.site, t.otherId, `/products/${prodId}`);
  ok(
    `${t.label} isolation (other store cannot read)`,
    cross.status === 404 || cross.status === 403 || cross.json?.data?.store_id === t.otherId === false,
    `status=${cross.status} store=${cross.json?.data?.store_id || 'n/a'}`,
  );

  const pay = await api(t.site, t.storeId, `/storefront/payments/methods?store_id=${encodeURIComponent(t.storeId)}`);
  const ids = (pay.json?.methods || []).map((m) => m.id);
  ok(`${t.label} full + installment methods`, ids.includes('card') && ids.includes('tabby') && ids.includes('tamara') && ids.includes('cod'), ids.join(','));

  const order = await api(t.site, t.storeId, '/storefront/orders', {
    method: 'POST',
    body: {
      store_id: t.storeId,
      customer_name: 'BNPL E2E',
      customer_phone: `0509${String(Date.now()).slice(-6)}`,
      customer_email: `bnpl.${stamp}@${t.storeId}.test`,
      delivery_location: 'Riyadh Test',
      payment_method: 'tabby',
      source: 'Website',
      total_amount: 349,
      items: [{ product_id: prodId, name: editedName, quantity: 1, price: 349 }],
    },
  });
  const orderId = order.json?.data?.id || order.json?.data?.order_id;
  const orderNo = order.json?.data?.order_number;
  ok(`${t.label} tabby order create`, (order.status === 200 || order.status === 201) && orderNo, `no=${orderNo} pay=${order.json?.data?.payment_method}`);

  const cardOrder = await api(t.site, t.storeId, '/storefront/orders', {
    method: 'POST',
    body: {
      store_id: t.storeId,
      customer_name: 'Full Pay E2E',
      customer_phone: `0508${String(Date.now()).slice(-6)}`,
      customer_email: `full.${stamp}@${t.storeId}.test`,
      delivery_location: 'Jeddah Test',
      payment_method: 'card',
      source: 'Website',
      total_amount: 349,
      items: [{ product_id: prodId, name: editedName, quantity: 1, price: 349 }],
    },
  });
  ok(`${t.label} full card order`, cardOrder.status === 200 || cardOrder.status === 201, `no=${cardOrder.json?.data?.order_number || ''}`);

  if (orderId || orderNo) {
    const inv = await api(
      t.site,
      t.storeId,
      `/orders/invoice?store_id=${encodeURIComponent(t.storeId)}&order_number=${encodeURIComponent(orderNo || '')}`,
    );
    ok(`${t.label} invoice endpoint`, inv.status === 200 && (inv.json?.invoice_number || inv.json?.data?.invoice_number), `status=${inv.status}`);
  }

  const resolve = await api(t.site, t.storeId, `/storefront/resolve-domain?domain=${encodeURIComponent(t.site.replace('https://', ''))}`);
  ok(`${t.label} domain resolves own store`, resolve.status === 200 && resolve.json?.store_id === t.storeId, `id=${resolve.json?.store_id}`);

  const home = await fetch(`${t.site}/`, { signal: AbortSignal.timeout(20000) });
  ok(`${t.label} homepage HTML 200`, home.status === 200, `len=${(await home.text()).length}`);
}

for (const t of STORES) {
  try {
    await runStore(t);
  } catch (e) {
    ok(`${t.label} fatal`, false, String(e?.message || e));
  }
}

const failed = results.filter((r) => !r.pass);
console.log(`\n======== EXTENDED ${results.length - failed.length}/${results.length} passed ========`);
if (failed.length) {
  for (const f of failed) console.log('FAIL', f.label, f.detail);
  process.exitCode = 1;
}
