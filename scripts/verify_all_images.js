import fs from 'fs';
import path from 'path';

const files = [
  'src/data/hadayaMeccaData.ts',
  'src/data/coffeeStoreData.ts',
  'src/data/blecoStoreData.ts',
  'src/data/mockData.ts',
];

// Also scan src/themes
function getThemeFiles(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getThemeFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      result.push(full);
    }
  }
  return result;
}

const allFiles = [...files, ...getThemeFiles('src/themes')];

const urlRegex = /https?:\/\/[^\s"'`<>]+?\.(?:png|jpg|jpeg|webp|svg|gif)(?:\?[^\s"'`<>]+)?/gi;
const unsplashRegex = /https:\/\/images\.unsplash\.com\/[^\s"'`<>]+/gi;

const allUrlsWithFile = [];

for (const file of allFiles) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = [...(content.match(urlRegex) || []), ...(content.match(unsplashRegex) || [])];
  for (const u of matches) {
    allUrlsWithFile.push({ file, url: u });
  }
}

const uniqueUrls = [...new Set(allUrlsWithFile.map((x) => x.url))];
console.log(`Found ${uniqueUrls.length} unique external image URLs across ${allFiles.length} files.`);

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
    if (res.status === 405 || res.status === 403) {
      // Some CDNs reject HEAD, try GET with range 0-1
      const getRes = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' }, signal: AbortSignal.timeout(6000) });
      return { url, status: getRes.status, ok: getRes.ok || getRes.status === 206 };
    }
    return { url, status: res.status, ok: res.ok };
  } catch (err) {
    return { url, status: 'ERROR: ' + err.message, ok: false };
  }
}

async function run() {
  const failed = [];
  const concurrency = 10;
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(checkUrl));
    for (const r of results) {
      if (!r.ok) {
        const occurrences = allUrlsWithFile.filter((x) => x.url === r.url).map((x) => x.file);
        failed.push({ url: r.url, status: r.status, occurrences });
        console.log(`❌ [${r.status}] ${r.url}`);
        console.log(`   in: ${occurrences.join(', ')}`);
      }
    }
  }

  console.log(`\nVerification finished: ${uniqueUrls.length - failed.length} / ${uniqueUrls.length} OK. Failed: ${failed.length}`);
  fs.writeFileSync('scripts/failed_images.json', JSON.stringify(failed, null, 2));
}

run();
