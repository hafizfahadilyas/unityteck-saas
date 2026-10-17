import fs from 'fs';

async function fetchMatsPage() {
  const url = 'https://tanjeedmakkah.com/ارضيات-لجميع-السيارات/c1764334283';
  const res = await fetch(encodeURI(url));
  console.log('Status:', res.status);
  const text = await res.text();
  fs.writeFileSync('scripts/mats_page.html', text);
  
  // extract images and text
  const imgs = text.match(/https:\/\/cdn\.salla\.sa\/[^\s"'<>]+/g) || [];
  console.log('Images count:', imgs.length);
  console.log('Sample images:', imgs.slice(0, 10));

  // extract product cards or json-ld
  const jsonLd = text.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  console.log('jsonLd count:', jsonLd.length);
  jsonLd.forEach(j => console.log('JSON-LD snippet:', j.substring(0, 300)));
}

fetchMatsPage();
