import https from 'https';

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'unityteck-smoke' } }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });

const checks = [
  ['health-flowers', 'https://giftshop-sa.com/api/health'],
  ['health-central', 'https://mieraf-ksa.com/api/health'],
  ['products-flowers', 'https://giftshop-sa.com/api/products?store_id=store-1'],
  ['products-coffee', 'https://mieraf-ksa.com/api/products?store_id=store-coffee'],
  ['products-bleco', 'https://mieraf-ksa.com/api/products?store_id=store-bleco'],
  ['catalog-bleco', 'https://mieraf-ksa.com/api/storefront/catalog?store_id=store-bleco&page=1&per_page=5'],
  ['bleco-html', 'https://mieraf-ksa.com/?store=bleco'],
  ['bleco-path', 'https://mieraf-ksa.com/bleco'],
  ['coffee-html', 'https://mieraf-ksa.com/?store=coffee'],
];

for (const [name, url] of checks) {
  try {
    const r = await get(url);
    const title = (r.body.match(/<title>([^<]*)<\/title>/i) || [])[1] || '';
    const og =
      (r.body.match(/property="og:title"\s+content="([^"]*)"/i) ||
        r.body.match(/content="([^"]*)"\s+property="og:title"/i) ||
        [])[1] || '';
    let pdata = null;
    try {
      const j = JSON.parse(r.body);
      pdata = Array.isArray(j?.data) ? j.data.length : j?.status || j?.ok || null;
      if (j?.mode) pdata = j.mode;
      if (j?.database) pdata = j.database;
    } catch {
      /* html */
    }
    console.log(
      JSON.stringify({
        name,
        status: r.status,
        title: title.slice(0, 90),
        og: og.slice(0, 90),
        pdata,
      }),
    );
  } catch (e) {
    console.log(JSON.stringify({ name, err: String(e) }));
  }
}
