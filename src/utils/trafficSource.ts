/** Real visit source from the current URL and referrer. Unknown visits stay Direct. */

const STORAGE_KEY = 'unityteck_traffic_attribution';

export type TrafficAttribution = {
  source: string;
  details: string;
  medium: string;
  campaign: string;
  utmTerm: string;
  utmContent: string;
};

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

function emptyAttribution(): TrafficAttribution {
  return {
    source: 'Direct',
    details: 'Direct',
    medium: '',
    campaign: '',
    utmTerm: '',
    utmContent: '',
  };
}

function readStored(): TrafficAttribution | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrafficAttribution;
    if (!parsed || typeof parsed.source !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(value: TrafficAttribution): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

/** Capture UTM / click ids on first landing and keep for the session (checkout). */
export function captureTrafficSource(): TrafficAttribution {
  if (typeof window === 'undefined') return emptyAttribution();

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';
  const utmTerm = params.get('utm_term') || '';
  const utmContent = params.get('utm_content') || '';
  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || params.get('gclid') || params.get('fbclid') || params.get('ttclid'));

  if (hasUtm) {
    const fromUtm = matchSource(utmSource);
    let source = fromUtm || 'Direct';
    if (!fromUtm && params.get('gclid')) source = 'Google Ads';
    if (!fromUtm && params.get('fbclid')) source = 'Facebook';
    if (!fromUtm && params.get('ttclid')) source = 'TikTok';
    if (!fromUtm && utmSource) source = 'Referral';
    const details = [source, utmMedium, utmCampaign].filter(Boolean).join(' / ') || source;
    const next: TrafficAttribution = {
      source,
      details,
      medium: utmMedium,
      campaign: utmCampaign,
      utmTerm,
      utmContent,
    };
    writeStored(next);
    return next;
  }

  const existing = readStored();
  if (existing) return existing;

  let referrer = '';
  try {
    referrer = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
  } catch {
    referrer = '';
  }
  if (referrer && referrer !== window.location.hostname.replace(/^www\./, '')) {
    const fromRef = matchSource(referrer);
    const next: TrafficAttribution = fromRef
      ? { source: fromRef, details: referrer, medium: 'referral', campaign: '', utmTerm: '', utmContent: '' }
      : referrer.includes('google.')
        ? { source: 'Organic Search', details: referrer, medium: 'organic', campaign: '', utmTerm: '', utmContent: '' }
        : { source: 'Referral', details: referrer, medium: 'referral', campaign: '', utmTerm: '', utmContent: '' };
    writeStored(next);
    return next;
  }

  const direct = emptyAttribution();
  writeStored(direct);
  return direct;
}

export function readTrafficSource(): TrafficAttribution {
  const stored = readStored();
  if (stored) return stored;
  return captureTrafficSource();
}
