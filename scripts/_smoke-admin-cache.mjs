import https from 'https';

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }, timeout: 20000 },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () =>
            resolve({ status: res.statusCode, headers: res.headers, body }),
          );
        },
      )
      .on('error', reject);
  });
}

const hosts = ['https://mieraf-ksa.com', 'https://giftshop-sa.com'];
const out = [];

for (const host of hosts) {
  const health = await get(`${host}/api/health`);
  let hj = {};
  try {
    hj = JSON.parse(health.body);
  } catch {
    /* ignore */
  }
  const admin = await get(`${host}/admin`);
  const js = (admin.body.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0] || '';
  const css = (admin.body.match(/assets\/index-[A-Za-z0-9_-]+\.css/) || [])[0] || '';
  const chrome = (admin.body.match(/assets\/storeChrome-[A-Za-z0-9_-]+\.js/) || [])[0] || '';
  const build = (admin.body.match(/name="souq-build" content="([^"]+)/) || [])[1] || '';
  const hasV = admin.body.includes('?v=');
  const cc = String(admin.headers['cache-control'] || '');
  const lookSwitchGone = !/Glass Soft|Night Luxe|DashboardLookSwitch/.test(admin.body);
  out.push({
    host,
    health: health.status,
    healthDb: hj.database || hj.mode || hj.status || null,
    admin: admin.status,
    js,
    css,
    chrome,
    build,
    cacheBustQuery: hasV,
    noCacheHeader: /no-cache|no-store/i.test(cc),
    lookSwitchAbsentInShell: lookSwitchGone,
  });

  if (chrome) {
    const chromeJs = await get(`${host}/${chrome}`);
    const glassLock = /ensurePlatformGlassShell/.test(chromeJs.body);
    out[out.length - 1].chromeStatus = chromeJs.status;
    out[out.length - 1].hasGlassLock = glassLock;
  }
}

console.log(JSON.stringify(out, null, 2));
const bad = out.some(
  (r) =>
    r.health !== 200 ||
    r.admin !== 200 ||
    !r.js ||
    !r.build ||
    !r.cacheBustQuery ||
    r.hasGlassLock === false,
);
process.exit(bad ? 1 : 0);
