import fs from 'fs';

const content = fs.readFileSync('src/data/blecoStoreData.ts', 'utf8');
const urlRegex = /https?:\/\/[^\s"'`<>]+?\.(?:png|jpg|jpeg|webp|svg|gif)/gi;
const rawUrls = [...new Set(content.match(urlRegex) || [])];
console.log(`Found ${rawUrls.length} unique image URLs in blecoStoreData.ts.`);

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 'ERROR: ' + err.message, ok: false };
  }
}

async function run() {
  const failed = [];
  for (const url of rawUrls) {
    const r = await checkUrl(url);
    if (!r.ok) {
      failed.push({ url, status: r.status });
      console.log(`❌ [${r.status}] ${url}`);
    }
  }
  console.log(`\nVerification finished: ${rawUrls.length - failed.length} / ${rawUrls.length} OK. Failed: ${failed.length}`);
}

run();
