import fs from 'fs';

async function testFetch() {
  const urls = [
    'https://tanjeedmakkah.com/api/products',
    'https://tanjeedmakkah.com/api/v1/products',
    'https://tanjeedmakkah.com/api/v2/products',
    'https://tanjeedmakkah.com/products.json',
    'https://tanjeedmakkah.com/sitemap.xml',
    'https://tanjeedmakkah.com/sitemap_products_1.xml'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log(url, res.status, res.headers.get('content-type'));
      if (res.ok) {
        const text = await res.text();
        console.log('Sample text for', url, text.substring(0, 300));
        fs.writeFileSync('scripts/last_response.txt', text);
      }
    } catch (e) {
      console.log('Error fetching', url, e.message);
    }
  }
}

testFetch();
