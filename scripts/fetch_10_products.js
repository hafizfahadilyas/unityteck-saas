import fs from 'fs';

const urls = [
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد-)-متوافق-مع-(جمس-يوكن)-2021-بلون-زيتوني/p612055692',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(قماش)-متوافق-مع-(كامري)-2003-2006-بلون-بيج/p1145227852',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد)-متوافق-مع-(النترا)-2018-2021-بلون-بيج/p185740549',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(قماش)-متوافق-مع-(اكورد)2018-2021-بلون-بيج/p476079357',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد-)-متوافق-مع-(اكسبديشن)-2018-2019-بلون-الوكالة/p75737295',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد)-متوافق-مع-(التيما)-2019-2020-بلون-الوكالة/p2012860552',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد)-متوافق-مع-(سيراتو)-2015-2022-بلون-رمادي/p1008210372',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(قماش)-متوافق-مع-(كورولا-كروس)-2023-2024-بلون-الوكالة/p1710504424',
  'https://tanjeedmakkah.com/تنجيد-مقاعد-السيارة-جاهزة-من-(جلد)-متوافق-مع-(اكسنت)-2024-بلون-رمادي/p186007261',
  'https://tanjeedmakkah.com/تلبيسة-مقاعد-السيارة-جاهزة-من-(جلد-)-متوافق-مع-(مازدا)-2008-2016-اسود/p423281100'
];

async function fetchProductsData() {
  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const rawUrl = urls[i];
    const encoded = encodeURI(rawUrl);
    try {
      const res = await fetch(encoded, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log(`[${i+1}/${urls.length}] ${res.status} for ${rawUrl.substring(25, 60)}...`);
      if (res.ok) {
        const html = await res.text();
        const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
        let prodData = null;
        for (const jm of jsonLdMatches) {
          const raw = jm.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
          try {
            const parsed = JSON.parse(raw);
            if (parsed['@graph']) {
              const p = parsed['@graph'].find(item => item['@type'] === 'Product');
              if (p) prodData = p;
            } else if (parsed['@type'] === 'Product') {
              prodData = parsed;
            }
          } catch (e) {}
        }
        
        // Find product images
        const imgs = [...new Set((html.match(/https:\/\/cdn\.salla\.sa\/wYYVD\/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp)/g) || []))];
        
        // Find og:image
        const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
        
        results.push({
          url: rawUrl,
          jsonLd: prodData,
          ogImage,
          images: imgs
        });
      }
    } catch (err) {
      console.log('Error fetching:', err.message);
    }
  }
  
  fs.writeFileSync('scripts/fetched_10_products.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved 10 products data to scripts/fetched_10_products.json');
}

fetchProductsData();
