import https from 'https';
import http from 'http';

async function checkUrl(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        console.log('----------------------------------------------------');
        console.log('🌐 URL          :', url);
        console.log('📊 Status       :', res.statusCode, res.statusMessage);
        console.log('📍 Location     :', res.headers.location || 'none');
        console.log('📋 Content-Type :', res.headers['content-type']);
        console.log('📦 Cache-Control:', res.headers['cache-control'] || 'none');
        console.log('📏 Body Size    :', data.length, 'bytes');
        if (data.includes('<title>')) {
          const match = data.match(/<title>(.*?)<\/title>/);
          console.log('🏷️  Title        :', match ? match[1] : 'Found');
        }
        const jsMatch = data.match(/src="(\/assets\/[^"]+\.js)"/);
        const cssMatch = data.match(/href="(\/assets\/[^"]+\.css)"/);
        if (jsMatch) console.log('⚡ Entry JS    :', jsMatch[1]);
        if (cssMatch) console.log('🎨 Entry CSS   :', cssMatch[1]);
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, js: jsMatch ? jsMatch[1] : null, css: cssMatch ? cssMatch[1] : null });
      });
    });
    req.on('error', e => {
      console.log('❌ Error checking', url, e.message);
      resolve({ error: e.message });
    });
  });
}

async function run() {
  console.log('🚀 TESTING LIVE HOSTINGER DEPLOYMENT ENDPOINTS & ASSETS:');
  await checkUrl('http://giftshop-sa.com/');
  const httpsHome = await checkUrl('https://giftshop-sa.com/');
  await checkUrl('https://giftshop-sa.com/master');
  await checkUrl('https://giftshop-sa.com/storefront');
  await checkUrl('https://giftshop-sa.com/store');

  if (httpsHome && httpsHome.js) {
    await checkUrl('https://giftshop-sa.com' + httpsHome.js);
  }
  if (httpsHome && httpsHome.css) {
    await checkUrl('https://giftshop-sa.com' + httpsHome.css);
  }
}

run();
