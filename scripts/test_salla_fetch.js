import fs from 'fs';

async function testSallaApi() {
  try {
    // Salla store id from HTML: 1777602994
    // Salla public products endpoint often: https://tanjeedmakkah.com/api/v1/products or similar, or categories
    // Or twilight ajax: https://tanjeedmakkah.com/products?page=1 or similar
    const res1 = await fetch('https://tanjeedmakkah.com/-/c1011230746', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Category c1011230746 status:', res1.status);
    const html1 = await res1.text();
    console.log('Category HTML length:', html1.length);

    // Check if there are product links or JSON in category page
    const prodLinks = [...new Set(html1.match(/https:\/\/tanjeedmakkah\.com\/[^"'\s<>]+\/p\d+/g) || [])];
    console.log('Found product links in category:', prodLinks.length);
    if (prodLinks.length > 0) {
      console.log('Sample links:', prodLinks.slice(0, 5));
    }

    // Check salla-products-slider or twilight json
    const matches = html1.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    console.log('LD+JSON scripts count:', matches ? matches.length : 0);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSallaApi();
