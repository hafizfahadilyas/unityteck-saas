async function verify() {
  const url = 'https://souq-default.mieraf-ksa.com/?store=souq-default';
  console.log('1. Fetching URL:', url);
  const r1 = await fetch(url);
  console.log('Status:', r1.status);
  const html = await r1.text();
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  console.log('Title:', title);
  const scriptMatch = html.match(/src=["']([^"']*index-[^"']*\.js)/);
  console.log('Bundle in HTML:', scriptMatch?.[1]);

  if (scriptMatch) {
    const bundleUrl = 'https://souq-default.mieraf-ksa.com' + scriptMatch[1];
    const bResp = await fetch(bundleUrl);
    console.log('2. Bundle status:', bResp.status);
    const bText = await bResp.text();
    console.log('Bundle length:', bText.length);
    console.log('Has Starter Featured Product:', bText.includes('Starter Featured Product'));
    console.log('Has theme-souq-common-retail:', bText.includes('theme-souq-common-retail'));
  }

  // Check theme chunk
  const themeUrl = 'https://souq-default.mieraf-ksa.com/assets/MeccaGiftsThemeView-CFj3M5YW.js';
  const tResp = await fetch(themeUrl);
  console.log('3. Theme chunk status:', tResp.status);
  const tText = await tResp.text();
  console.log('Theme chunk has Hero Retail Slider:', tText.includes('Hero Retail Slider'));
  console.log('Theme chunk has Welcome to Your Online Store:', tText.includes('Welcome to Your Online Store'));
  console.log('Theme chunk has GENERAL RETAIL:', tText.includes('GENERAL RETAIL'));

  // Check payment-methods redirect
  const visaUrl = 'https://souq-default.mieraf-ksa.com/payment-methods/visa.png';
  const vResp = await fetch(visaUrl);
  console.log('4. visa.png status:', vResp.status, 'Content-Type:', vResp.headers.get('content-type'));

  // Check api endpoint
  const apiUrl = 'https://souq-default.mieraf-ksa.com/api/settings?id=branding';
  const aResp = await fetch(apiUrl);
  console.log('5. /api/settings status:', aResp.status, 'Content-Type:', aResp.headers.get('content-type'));
}
verify().catch(console.error);
