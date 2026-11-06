/** Real visit source from the current URL and referrer. Unknown visits stay Direct. */

const SOURCE_RULES: Array<{ test: (value: string) => boolean; source: string }> = [
  { test: (v) => v.includes('whatsapp') || v === 'wa', source: 'WhatsApp' },
  { test: (v) => v.includes('instagram'), source: 'Instagram' },
  { test: (v) => v.includes('tiktok'), source: 'TikTok' },
  { test: (v) => v.includes('snap'), source: 'Snapchat' },
  { test: (v) => v.includes('facebook') || v === 'fb', source: 'Facebook' },
  { test: (v) => v.includes('google'), source: 'Google Ads' },
];

function matchSource(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  return SOURCE_RULES.find((rule) => rule.test(v))?.source ?? null;
}

export function readTrafficSource(): { source: string; details: string } {
  if (typeof window === 'undefined') {
    return { source: 'Direct', details: 'Direct' };
  }
  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source') || '';
  const fromUtm = matchSource(utm);
  if (fromUtm) {
    const medium = params.get('utm_medium') || '';
    const campaign = params.get('utm_campaign') || '';
    const details = [fromUtm, medium, campaign].filter(Boolean).join(' / ');
    return { source: fromUtm, details };
  }
  if (params.get('gclid')) return { source: 'Google Ads', details: 'Google Ads' };
  if (params.get('fbclid')) return { source: 'Facebook', details: 'Facebook' };
  if (params.get('ttclid')) return { source: 'TikTok', details: 'TikTok' };
  let referrer = '';
  try {
    referrer = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
  } catch {
    referrer = '';
  }
  if (referrer && referrer !== window.location.hostname.replace(/^www\./, '')) {
    const fromRef = matchSource(referrer);
    if (fromRef) return { source: fromRef, details: referrer };
    if (referrer.includes('google.')) return { source: 'Organic Search', details: referrer };
    return { source: 'Referral', details: referrer };
  }
  return { source: 'Direct', details: 'Direct' };
}
