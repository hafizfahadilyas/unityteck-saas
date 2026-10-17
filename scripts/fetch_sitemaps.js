import fs from 'fs';

async function fetchSitemaps() {
  for (const name of ['sitemap-1.xml', 'sitemap-2.xml']) {
    const url = `https://tanjeedmakkah.com/${name}`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      fs.writeFileSync(`scripts/${name}`, text);
      const locs = text.match(/<loc>(.*?)<\/loc>/g)?.map(l => l.replace(/<\/?loc>/g, '')) || [];
      console.log(`Fetched ${name}, count: ${locs.length}`);
      console.log('Sample locs:', locs.slice(0, 15));
    } else {
      console.log(`Failed to fetch ${name}: ${res.status}`);
    }
  }
}

fetchSitemaps();
