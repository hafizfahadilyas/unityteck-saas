import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/parsed_seat_covers.json', 'utf8'));

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 'ERR: ' + err.message, ok: false };
  }
}

async function verifyAll() {
  const urls = [];
  data.forEach(d => {
    if (d.prod.image) urls.push(d.prod.image);
    if (d.imgs) urls.push(...d.imgs);
  });
  const uniqueUrls = [...new Set(urls)].filter(Boolean);
  console.log(`Checking ${uniqueUrls.length} unique images from 10 parsed products...`);

  let okCount = 0;
  for (const u of uniqueUrls) {
    const r = await checkUrl(u);
    if (r.ok) okCount++;
    console.log(`${r.ok ? '✅' : '❌'} [${r.status}] ${u}`);
  }
  console.log(`\nResult: ${okCount} / ${uniqueUrls.length} working!`);
}

verifyAll();
