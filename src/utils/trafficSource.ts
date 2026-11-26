/** Real visit source from the current URL and referrer. Unknown visits stay Direct. */

const STORAGE_KEY = 'unityteck_traffic_attribution';

export type TrafficAttribution = {
  source: string;
  details: string;
  medium: string;
  campaign: string;
  utmTerm: string;
  utmContent: string;
  landingPage?: string;
  referralHost?: string;
};

const SOURCE_RULES: Array<{ test: (value: string) => boolean; source: string }> = [
  { test: (v) => v.includes('whatsapp') || v === 'wa' || v === 'wa.me', source: 'WhatsApp' },
  { test: (v) => v.includes('instagram') || v === 'ig' || v.includes('insta'), source: 'Instagram' },
  { test: (v) => v.includes('tiktok') || v === 'tt', source: 'TikTok' },
  { test: (v) => v.includes('snap'), source: 'Snapchat' },
  {
    test: (v) =>
      v.includes('facebook') ||
      v === 'fb' ||
      v.includes('meta') ||
      v.includes('messenger') ||
      v.includes('fb.me'),
    source: 'Facebook',
  },
  { test: (v) => v.includes('google') || v === 'gads' || v.includes('adwords'), source: 'Google Ads' },
  { test: (v) => v.includes('telegram'), source: 'Referral' },
  { test: (v) => v.includes('email') || v.includes('newsletter'), source: 'Referral' },
  { test: (v) => v.includes('qr') || v.includes('lobby') || v === 'offline', source: 'Referral' },
];

/** Map raw utm_source / referrer host → canonical order/traffic source label. */
export function matchTrafficSourceLabel(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return null;
  return SOURCE_RULES.find((rule) => rule.test(v))?.source ?? null;
}

function matchSource(value: string): string | null {
  return matchTrafficSourceLabel(value);
}

function emptyAttribution(): TrafficAttribution {
  return {
    source: 'Direct',
    details: 'Direct',
    medium: '',
    campaign: '',
    utmTerm: '',
    utmContent: '',
    landingPage: '',
    referralHost: '',
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

function firstTouchKey(storeId: string): string {
  return `unityteck_first_touch_${storeId}`;
}

function readFirstTouch(storeId: string): TrafficAttribution | null {
  if (!storeId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(firstTouchKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrafficAttribution;
    if (!parsed || typeof parsed.source !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeFirstTouch(storeId: string, value: TrafficAttribution): void {
  if (!storeId || typeof localStorage === 'undefined') return;
  if (readFirstTouch(storeId)) return;
  try {
    localStorage.setItem(firstTouchKey(storeId), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function buildFromUtm(params: URLSearchParams): TrafficAttribution {
  const utmSource = params.get('utm_source') || '';
  const utmMedium = params.get('utm_medium') || '';
  const utmCampaign = params.get('utm_campaign') || '';
  const utmTerm = params.get('utm_term') || '';
  const utmContent = params.get('utm_content') || '';
  const fromUtm = matchSource(utmSource);
  let source = fromUtm || 'Direct';
  if (!fromUtm && params.get('gclid')) source = 'Google Ads';
  if (!fromUtm && params.get('fbclid')) source = 'Facebook';
  if (!fromUtm && params.get('ttclid')) source = 'TikTok';
  if (!fromUtm && utmSource) source = 'Referral';
  const details = [source, utmMedium, utmCampaign].filter(Boolean).join(' / ') || source;
  const landingPage =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '';
  return {
    source,
    details,
    medium: utmMedium,
    campaign: utmCampaign,
    utmTerm,
    utmContent,
    landingPage,
    referralHost: '',
  };
}

function buildFromReferrer(): TrafficAttribution {
  let referrer = '';
  try {
    referrer = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
  } catch {
    referrer = '';
  }
  const landingPage =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '';
  if (referrer && typeof window !== 'undefined' && referrer !== window.location.hostname.replace(/^www\./, '')) {
    const fromRef = matchSource(referrer);
    if (fromRef) {
      return {
        source: fromRef,
        details: referrer,
        medium: 'referral',
        campaign: '',
        utmTerm: '',
        utmContent: '',
        landingPage,
        referralHost: referrer,
      };
    }
    if (referrer.includes('google.')) {
      return {
        source: 'Organic Search',
        details: referrer,
        medium: 'organic',
        campaign: '',
        utmTerm: '',
        utmContent: '',
        landingPage,
        referralHost: referrer,
      };
    }
    return {
      source: 'Referral',
      details: referrer,
      medium: 'referral',
      campaign: '',
      utmTerm: '',
      utmContent: '',
      landingPage,
      referralHost: referrer,
    };
  }
  return { ...emptyAttribution(), landingPage };
}

/**
 * Capture UTM / click ids on landing. Last touch = session; first touch = per-store localStorage (never overwritten).
 */
export function captureTrafficSource(storeId?: string): TrafficAttribution {
  if (typeof window === 'undefined') return emptyAttribution();

  const params = new URLSearchParams(window.location.search);
  const hasUtm = Boolean(
    params.get('utm_source') ||
      params.get('utm_medium') ||
      params.get('utm_campaign') ||
      params.get('gclid') ||
      params.get('fbclid') ||
      params.get('ttclid'),
  );

  if (hasUtm) {
    const next = buildFromUtm(params);
    writeStored(next);
    if (storeId) writeFirstTouch(storeId, next);
    return next;
  }

  const existing = readStored();
  if (existing) return existing;

  const fromRef = buildFromReferrer();
  writeStored(fromRef);
  if (storeId && fromRef.source !== 'Direct') {
    writeFirstTouch(storeId, fromRef);
  }
  return fromRef;
}

export function readTrafficSource(): TrafficAttribution {
  const stored = readStored();
  if (stored) return stored;
  return captureTrafficSource();
}

/** First-touch attribution for order row (unchanged when user returns via another campaign). */
export function readFirstTouchAttribution(storeId: string | undefined | null): TrafficAttribution {
  if (storeId) {
    const first = readFirstTouch(storeId);
    if (first) return first;
  }
  return readTrafficSource();
}

export function readLandingPage(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}