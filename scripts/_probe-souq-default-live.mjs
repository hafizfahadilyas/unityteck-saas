import fs from 'fs';

async function test() {
  const url = 'https://souq-default.mieraf-ksa.com/?store=souq-default';
  console.log('Fetching', url);
  const html = await fetch(url).then(r => r.text());
  console.log('HTML length:', html.length);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  console.log('Title:', title);

  const scriptTags = Array.from(html.matchAll(/<script\b[^>]*?\bsrc=["']([^"']+)["'][^>]*>/gi)).map(m => m[1]);
  console.log('Script tags found in live HTML:', scriptTags);

  for (const src of scriptTags) {
    const assetUrl = src.startsWith('http') ? src : 'https://souq-default.mieraf-ksa.com' + (src.startsWith('/') ? '' : '/') + src;
    console.log('Fetching:', assetUrl);
    const resp = await fetch(assetUrl);
    console.log('Status:', resp.status);
    if (src.includes('index-')) {
      const text = await resp.text();
      console.log('Bundle length:', text.length);
      console.log('Has Starter Featured Product:', text.includes('Starter Featured Product'));
      console.log('Has Hero Retail Slider:', text.includes('Hero Retail Slider'));
      console.log('Has theme-souq-common-retail:', text.includes('theme-souq-common-retail'));
      console.log('Has أهلاً بكم في متجر سوق الافتراضي:', text.includes('أهلاً بكم في متجر سوق الافتراضي'));
      console.log('Has GENERAL RETAIL:', text.includes('GENERAL RETAIL'));
    }
  }
}
test().catch(console.error);
