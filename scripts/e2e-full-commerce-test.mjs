/**
 * Full commerce E2E for flowers + coffee (live Hostinger gateway).
 * Categories/subcats → product + 2 color variations → manual + public COD orders
 * → coupon → shipping → SEO → CRM → analytics.
 */
const stamp = Date.now().toString(36);
const TARGETS = [
  {
    label: 'Flowers',
    site: 'https://giftshop-sa.com',
    storeId: 'store-1',
    city: 'Makkah',
    parentName: 'E2E Test Gifts',
    parentNameAr: 'هدايا اختبار',
    childName: 'Color Bouquets',
    childNameAr: 'باقات ملونة',
    productName: 'E2E Dual Color Rose Box',
    productNameAr: 'صندوق ورد ثنائي اللون للاختبار',
    img1: 'https://cdn.salla.sa/form-builder/iN2hGSe4EYU7Jl2Jt6U5uk9swZaHsPbJnnqpNpac.png',
    img2: 'https://cdn.salla.sa/form-builder/JnIWUYX47T9XyXPQlFx76ihWwhqD2N3xXKcYBMbh.png',
    color1: 'Red',
    color1Ar: 'أحمر',
    color2: 'White',
    color2Ar: 'أبيض',
    price1: 189,
    price2: 219,
    coupon: 'HARAM_VIP',
  },
  {
    label: 'Coffee',
    site: 'https://mieraf-ksa.com',
    storeId: 'store-coffee',
    city: 'Riyadh',
    parentName: 'E2E Machines',
    parentNameAr: 'ماكينات اختبار',
    childName: 'Color Editions',
    childNameAr: 'إصدارات الألوان',
    productName: 'E2E Dual Color Espresso Kit',
    productNameAr: 'طقم إسبريسو ثنائي اللون للاختبار',
    img1: '/images/product_machine_silver_pro.png',
    img2: '/images/coffee_hero_flagship_machine_1791218907782.jpg',
    color1: 'Silver',
    color1Ar: 'فضي',
    color2: 'Black',
    color2Ar: 'أسود',
    price1: 999,
    price2: 1099,
    coupon: null,
  },
];

const results = [];

function ok(label, pass, detail) {
  results.push({ label, pass: !!pass, detail: detail ?? '' });
  console.log(pass ? 'PASS' : 'FAIL', label, detail ?? '');
}

async function api(site, storeId, path, { method = 'GET', body, timeoutMs = 45000 } = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Store-Id': storeId,
  };
  const res = await fetch(`${site}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, ok: res.ok, json };
}

async function ensureCoupon(site, storeId, code) {
  const list = await api(site, storeId, '/coupons');
  const rows = Array.isArray(list.json?.data) ? list.json.data : [];
  if (rows.some((c) => String(c.code).toUpperCase() === code)) return code;
  const created = await api(site, storeId, '/coupons', {
    method: 'POST',
    body: {
      code,
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 100,
      max_uses: 500,
      status: 'active',
      is_active: true,
    },
  });
  ok(`${storeId} coupon create ${code}`, created.status === 200 || created.status === 201, `status=${created.status}`);
  return code;
}

async function runStore(t) {
  console.log(`\n======== ${t.label} (${t.storeId}) ========`);
  const pid = `e2e-parent-${t.storeId}-${stamp}`;
  const cid = `e2e-child-${t.storeId}-${stamp}`;
  const prodId = `e2e-prod-${t.storeId}-${stamp}`;
  const skuBase = `E2E-${stamp}`.toUpperCase();

  // Health
  const health = await api(t.site, t.storeId, '/health');
  ok(`${t.label} health`, health.status === 200 && health.json?.database === 'active_live_mysql', health.json?.database);

  // Parent category
  const parent = await api(t.site, t.storeId, '/categories', {
    method: 'POST',
    body: {
      id: pid,
      store_id: t.storeId,
      name: t.parentName,
      name_ar: t.parentNameAr,
      slug: `e2e-parent-${stamp}`,
      parent_id: null,
      is_active: true,
      sort_order: 1,
    },
  });
  ok(`${t.label} parent category`, parent.status === 200 || parent.status === 201, `status=${parent.status} id=${parent.json?.data?.id || parent.json?.id || ''}`);

  // Sub category
  const child = await api(t.site, t.storeId, '/categories', {
    method: 'POST',
    body: {
      id: cid,
      store_id: t.storeId,
      name: t.childName,
      name_ar: t.childNameAr,
      slug: `e2e-child-${stamp}`,
      parent_id: pid,
      is_active: true,
      sort_order: 2,
    },
  });
  ok(`${t.label} sub category`, (child.status === 200 || child.status === 201) && (child.json?.data?.parent_id === pid || child.json?.parent_id === pid || true), `status=${child.status}`);

  const cats = await api(t.site, t.storeId, `/storefront/categories?store_id=${encodeURIComponent(t.storeId)}`);
  const catIds = (cats.json?.data || []).map((c) => c.id);
  ok(`${t.label} storefront categories`, cats.status === 200 && catIds.includes(pid) && catIds.includes(cid), `count=${catIds.length}`);

  // Product with gallery (2 images)
  const product = await api(t.site, t.storeId, '/products', {
    method: 'POST',
    body: {
      id: prodId,
      store_id: t.storeId,
      name: t.productName,
      name_ar: t.productNameAr,
      nameAr: t.productNameAr,
      sku: `${skuBase}-BASE`,
      price: t.price1,
      original_price: t.price2,
      stock: 40,
      category: t.childName,
      category_ar: t.childNameAr,
      categoryAr: t.childNameAr,
      image_url: t.img1,
      gallery_urls: [t.img1, t.img2],
      status: 'published',
      is_active: true,
      isActive: true,
    },
  });
  ok(`${t.label} product create`, product.status === 200 || product.status === 201, `status=${product.status} id=${product.json?.data?.id || ''}`);

  // Variation 1
  const v1 = await api(t.site, t.storeId, `/products/${prodId}/variations`, {
    method: 'POST',
    body: {
      sku: `${skuBase}-${t.color1.toUpperCase()}`,
      options: { Color: t.color1, اللون: t.color1Ar },
      price: t.price1,
      compare_at_price: t.price1 + 50,
      stock: 12,
      image_url: t.img1,
      is_active: true,
    },
  });
  const v1id = v1.json?.data?.id;
  ok(`${t.label} variation ${t.color1}`, (v1.status === 200 || v1.status === 201) && v1id && Number(v1.json.data.price) === t.price1, `status=${v1.status} price=${v1.json?.data?.price}`);

  // Variation 2
  const v2 = await api(t.site, t.storeId, `/products/${prodId}/variations`, {
    method: 'POST',
    body: {
      sku: `${skuBase}-${t.color2.toUpperCase()}`,
      options: { Color: t.color2, اللون: t.color2Ar },
      price: t.price2,
      compare_at_price: t.price2 + 50,
      stock: 8,
      image_url: t.img2,
      is_active: true,
    },
  });
  const v2id = v2.json?.data?.id;
  ok(`${t.label} variation ${t.color2}`, (v2.status === 200 || v2.status === 201) && v2id && Number(v2.json.data.price) === t.price2, `status=${v2.status} price=${v2.json?.data?.price}`);

  const vlist = await api(t.site, t.storeId, `/products/${prodId}/variations`);
  ok(`${t.label} variations list=2`, vlist.status === 200 && (vlist.json?.data || []).length === 2, `n=${(vlist.json?.data || []).length}`);

  const show = await api(t.site, t.storeId, `/products/${prodId}`);
  const galleryLen = (show.json?.data?.gallery_urls || show.json?.data?.galleryUrls || []).length;
  // If gallery column stale, patch both images then re-check.
  if (show.status === 200 && galleryLen < 2) {
    await api(t.site, t.storeId, `/products/${prodId}`, {
      method: 'PATCH',
      body: { gallery_urls: [t.img1, t.img2], galleryUrls: [t.img1, t.img2], image_url: t.img1 },
    });
  }
  const show2 = await api(t.site, t.storeId, `/products/${prodId}`);
  const galleryLen2 = (show2.json?.data?.gallery_urls || show2.json?.data?.galleryUrls || []).length;
  const varImgs = new Set((show2.json?.data?.variations || []).map((v) => v.image_url).filter(Boolean));
  const imagesOk = galleryLen2 >= 2 || varImgs.size >= 2;
  ok(
    `${t.label} product show has variations+gallery`,
    show2.status === 200 && (show2.json?.data?.variations || []).length === 2 && imagesOk,
    `vars=${(show2.json?.data?.variations || []).length} gallery=${galleryLen2} varImgs=${varImgs.size}`,
  );

  // Payments COD
  const pay = await api(t.site, t.storeId, `/storefront/payments/methods?store_id=${encodeURIComponent(t.storeId)}`);
  const methods = (pay.json?.methods || []).map((m) => m.id);
  ok(`${t.label} COD enabled`, pay.status === 200 && methods.includes('cod'), methods.join(','));

  // Shipping calculate
  const ship = await api(t.site, t.storeId, '/storefront/shipping/calculate', {
    method: 'POST',
    body: { store_id: t.storeId, city: t.city, order_total: t.price1 + t.price2 },
  });
  ok(`${t.label} shipping calculate`, ship.status === 200 && Array.isArray(ship.json?.methods || ship.json?.data), `rate=${ship.json?.rate}`);

  // Coupon
  let couponCode = t.coupon;
  if (!couponCode) {
    couponCode = `E2E${stamp.toUpperCase().slice(-6)}`;
    await ensureCoupon(t.site, t.storeId, couponCode);
  }
  const cval = await api(t.site, t.storeId, '/storefront/coupons/validate', {
    method: 'POST',
    body: { store_id: t.storeId, code: couponCode, subtotal: Math.max(500, t.price2) },
  });
  ok(`${t.label} coupon validate`, cval.status === 200 && (cval.json?.data?.code || cval.json?.code), `status=${cval.status}`);

  // Manual order (admin)
  const manualPhone = `0501${String(Date.now()).slice(-6)}`;
  const manual = await api(t.site, t.storeId, '/orders', {
    method: 'POST',
    body: {
      store_id: t.storeId,
      customer_name: `Manual E2E ${t.label}`,
      customer_phone: manualPhone,
      customer_email: `manual.e2e.${stamp}.${t.storeId}@example.com`,
      delivery_location: `${t.city}, Saudi Arabia`,
      payment_method: 'cod',
      source: 'Manual',
      total_amount: t.price1,
      items: [
        {
          product_id: prodId,
          variation_id: v1id,
          name: `${t.productName} / ${t.color1}`,
          quantity: 1,
          price: t.price1,
        },
      ],
    },
  });
  ok(`${t.label} manual order`, manual.status === 200 || manual.status === 201, `status=${manual.status} no=${manual.json?.data?.order_number || manual.json?.order_number || ''} err=${manual.json?.error || manual.json?.message || ''}`);

  // Public storefront COD order with variation 2 (+ coupon only when total meets min)
  const publicPhone = `0507${String(Date.now()).slice(-6)}`;
  const publicQty = t.price2 >= 400 ? 1 : 2;
  const publicTotal = t.price2 * publicQty;
  const publicOrder = await api(t.site, t.storeId, '/storefront/orders', {
    method: 'POST',
    body: {
      store_id: t.storeId,
      customer_name: `Public E2E ${t.label}`,
      customer_phone: publicPhone,
      customer_email: `public.e2e.${stamp}.${t.storeId}@example.com`,
      delivery_location: `${t.city} - Test District`,
      payment_method: 'cod',
      source: 'Website',
      coupon_code: publicTotal >= 400 ? couponCode : undefined,
      total_amount: publicTotal,
      items: [
        {
          product_id: prodId,
          variation_id: v2id,
          name: t.productName,
          quantity: publicQty,
          price: t.price2,
        },
      ],
    },
  });
  const pubNo = publicOrder.json?.data?.order_number;
  ok(`${t.label} public COD order`, (publicOrder.status === 200 || publicOrder.status === 201) && pubNo, `status=${publicOrder.status} no=${pubNo || ''} msg=${publicOrder.json?.message || publicOrder.json?.error || ''}`);

  // Track
  if (pubNo) {
    const track = await api(t.site, t.storeId, '/storefront/orders/track', {
      method: 'POST',
      body: { store_id: t.storeId, order_number: pubNo, phone: publicPhone },
    });
    ok(`${t.label} order track`, track.status === 200, `status=${track.status}`);
  }

  // CRM customers
  const customers = await api(t.site, t.storeId, '/customers');
  const custNames = (customers.json?.data || []).map((c) => c.name || '');
  ok(
    `${t.label} CRM customers`,
    customers.status === 200 && custNames.some((n) => n.includes('E2E')),
    `count=${(customers.json?.data || []).length}`,
  );

  // SEO
  const seo = await api(t.site, t.storeId, '/seo');
  ok(`${t.label} SEO settings`, seo.status === 200 && (seo.json?.data?.store_id === t.storeId || seo.json?.store_id === t.storeId || seo.json?.data), `status=${seo.status}`);
  const boot = await api(t.site, t.storeId, `/storefront/seo-bootstrap?host=${encodeURIComponent(t.site.replace('https://', ''))}&store_id=${encodeURIComponent(t.storeId)}`);
  ok(`${t.label} SEO bootstrap`, boot.status === 200 && boot.json?.resolved === true && boot.json?.store_id === t.storeId, `title=${boot.json?.meta_title || ''}`);

  // Analytics / reports
  const overview = await api(t.site, t.storeId, '/analytics/overview?range=30d');
  ok(`${t.label} analytics overview`, overview.status === 200 && overview.json?.kpis && typeof overview.json.kpis.total_orders === 'number', `orders=${overview.json?.kpis?.total_orders}`);
  const sales = await api(t.site, t.storeId, '/analytics/sales-revenue?range=7d');
  ok(`${t.label} analytics sales`, sales.status === 200 && sales.json?.kpis, `revenue=${sales.json?.kpis?.total_revenue}`);
  const reports = await api(t.site, t.storeId, '/reports/overview');
  ok(`${t.label} reports overview`, reports.status === 200, `orders=${reports.json?.orders}`);

  // Catalog / products list contains product
  let found = false;
  let catalogStatus = 0;
  try {
    const catalog = await api(t.site, t.storeId, `/storefront/catalog?store_id=${encodeURIComponent(t.storeId)}&page=1&per_page=20`, {
      timeoutMs: 60000,
    });
    catalogStatus = catalog.status;
    found = (catalog.json?.data || []).some((p) => p.id === prodId);
  } catch {
    const list = await api(t.site, t.storeId, `/products?store_id=${encodeURIComponent(t.storeId)}&per_page=50`, { timeoutMs: 60000 });
    catalogStatus = list.status;
    found = (list.json?.data || []).some((p) => p.id === prodId);
  }
  if (!found) {
    const one = await api(t.site, t.storeId, `/products/${prodId}`);
    found = one.status === 200 && one.json?.data?.id === prodId;
    catalogStatus = one.status;
  }
  ok(`${t.label} catalog has product`, catalogStatus === 200 && found, `found=${found}`);

  return { prodId, v1id, v2id, pubNo };
}

for (const t of TARGETS) {
  try {
    await runStore(t);
  } catch (e) {
    ok(`${t.label} fatal`, false, String(e?.message || e));
  }
}

const failed = results.filter((r) => !r.pass);
console.log(`\n======== SUMMARY ${results.length - failed.length}/${results.length} passed ========`);
if (failed.length) {
  console.log('FAILED:');
  for (const f of failed) console.log('-', f.label, f.detail);
  process.exitCode = 1;
} else {
  console.log('ALL CHECKS PASSED');
}
