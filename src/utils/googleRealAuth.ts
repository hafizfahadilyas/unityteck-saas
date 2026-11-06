/**
 * Real Google OAuth 2.0 Client & Google Services Integration
 * Site Kit by Google Architecture for Unityteck E-Commerce SaaS
 */

export interface GoogleAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

export interface GoogleConnectedState {
  connected: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  accountEmail: string | null;
  accountName: string | null;
  accountPicture: string | null;
  // Detected Services
  ga4PropertyId: string | null;
  ga4MeasurementId: string | null;
  gscSiteUrl: string | null;
  gtmAccountId: string | null;
  gtmContainerId: string | null;
  indexingEnabled: boolean;
  // Core Web Vitals & PageSpeed Real Insights
  psiScoreMobile: number;
  psiScoreDesktop: number;
  fcp: string;
  lcp: string;
  cls: string;
  fid: string;
  inp: string;
  lastSyncedAt: string | null;
}

// Scopes required for Site-Kit style integration
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'https://www.googleapis.com/auth/indexing',
].join(' ');

// Storage Keys
const GOOGLE_AUTH_STORAGE_PREFIX = 'unityteck_google_oauth_';
const GOOGLE_CLIENT_ID_STORAGE = 'unityteck_google_client_id';

export function getStoredGoogleClientId(): string {
  try {
    const custom = localStorage.getItem(GOOGLE_CLIENT_ID_STORAGE);
    if (custom && custom.trim()) return custom.trim();
  } catch {}
  const fromEnv =
    typeof import.meta !== 'undefined' ? String(import.meta.env?.VITE_GOOGLE_CLIENT_ID || '') : '';
  return fromEnv.trim();
}

export function setStoredGoogleClientId(clientId: string): void {
  try {
    localStorage.setItem(GOOGLE_CLIENT_ID_STORAGE, clientId.trim());
  } catch {}
}

export function getStoreGoogleState(storeId: string): GoogleConnectedState | null {
  try {
    const raw = localStorage.getItem(`${GOOGLE_AUTH_STORAGE_PREFIX}${storeId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoogleConnectedState;
    // Reject legacy fake partner tokens — never treat them as connected
    if (
      !parsed?.accessToken ||
      parsed.accessToken.startsWith('gsc_live_verified') ||
      parsed.accessToken.includes('unityteck_verified')
    ) {
      clearStoreGoogleState(storeId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoreGoogleState(storeId: string, state: GoogleConnectedState): void {
  try {
    localStorage.setItem(`${GOOGLE_AUTH_STORAGE_PREFIX}${storeId}`, JSON.stringify(state));
  } catch {}
}

export function clearStoreGoogleState(storeId: string): void {
  try {
    localStorage.removeItem(`${GOOGLE_AUTH_STORAGE_PREFIX}${storeId}`);
  } catch {}
}

/**
 * Instant Google connect is DISABLED (zero-mock KSA rule).
 * Callers must use real OAuth with a valid Google Client ID.
 */
export function initiateInstantGoogleConnect(options: {
  email?: string;
  name?: string;
  storeSlug: string;
  onSuccess: (token: GoogleAuthTokenResponse, profile: GoogleUserProfile) => void;
  onError?: (error: string) => void;
}) {
  const msg =
    'Fake Instant Google connect is disabled. Configure a real Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID).';
  if (options.onError) {
    options.onError(msg);
  }
}

/** Customer storefront sign-in only. Not Site Kit / analytics scopes. */
const CUSTOMER_GOOGLE_SCOPES = 'openid email profile';

export function hasRealGoogleClientId(clientId: string | null | undefined): boolean {
  const id = (clientId || '').trim();
  return Boolean(id) && !id.includes('unityteck-ecommerce') && id.endsWith('.apps.googleusercontent.com');
}

/** Load Google Identity Services once so the click can open the account picker immediately. */
export function preloadCustomerGoogleScript(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById('google-gsi-client')) return;
  const script = document.createElement('script');
  script.id = 'google-gsi-client';
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  document.head.appendChild(script);
}

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

/**
 * Opens the real Google account picker for a storefront customer.
 * Must be called directly from the button click (no await before the popup).
 * The current origin must be an authorized JavaScript origin on the Google client.
 */
export function startCustomerGoogleSignIn(
  clientId: string,
  handlers: {
    onSuccess: (profile: GoogleUserProfile) => void;
    onError: (message: string) => void;
  },
): void {
  const oauth2 = (window as Window & {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: { message?: string; type?: string }) => void;
          }) => { requestAccessToken: (override?: { prompt?: string }) => void };
        };
      };
    };
  }).google?.accounts?.oauth2;

  if (!oauth2) {
    handlers.onError('GOOGLE_SCRIPT_LOADING');
    return;
  }

  const client = oauth2.initTokenClient({
    client_id: clientId,
    scope: CUSTOMER_GOOGLE_SCOPES,
    callback: (response) => {
      void (async () => {
        if (!response.access_token || response.error) {
          handlers.onError(response.error || 'GOOGLE_CANCELLED');
          return;
        }
        const profile = await fetchGoogleUserProfile(response.access_token);
        if (!profile?.email) {
          handlers.onError('GOOGLE_NO_EMAIL');
          return;
        }
        handlers.onSuccess(profile);
      })();
    },
    error_callback: () => {
      handlers.onError('GOOGLE_FAILED');
    },
  });
  client.requestAccessToken({ prompt: 'select_account' });
}

/**
 * Initiates Real Google OAuth 2.0 Popup Flow using Google Identity Services or standard OAuth2 Endpoint
 */
export async function initiateRealGoogleOAuth(options: {
  clientId?: string;
  storeSlug: string;
  onSuccess: (token: GoogleAuthTokenResponse, profile: GoogleUserProfile) => void;
  onError: (error: string) => void;
}): Promise<void> {
  const clientId = options.clientId || getStoredGoogleClientId();
  const redirectUri = window.location.origin;

  if (!clientId || clientId.includes('unityteck-ecommerce')) {
    options.onError(
      'Configure a real Google OAuth Client ID. Placeholder / Instant connect is not allowed.',
    );
    return;
  }

  // Real OAuth2 parameters for custom client IDs
  const statePayload = btoa(JSON.stringify({ storeSlug: options.storeSlug, ts: Date.now() }));
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', GOOGLE_OAUTH_SCOPES);
  authUrl.searchParams.set('include_granted_scopes', 'true');
  authUrl.searchParams.set('state', statePayload);
  authUrl.searchParams.set('prompt', 'select_account');

  const width = 500;
  const height = 650;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl.toString(),
    'GoogleOAuthPopup',
    `width=${width},height=${height},top=${top},left=${left},status=no,resizable=yes,toolbar=no,menubar=no`,
  );

  if (!popup) {
    options.onError('Google sign-in popup was blocked. Allow popups and try again.');
    return;
  }

  // Poll popup for token callback or closure
  const pollInterval = window.setInterval(async () => {
    try {
      if (popup.closed) {
        window.clearInterval(pollInterval);
        return;
      }

      // Check if popup returned to redirectUri with access_token hash
      if (popup.location.href.includes(redirectUri)) {
        const hash = popup.location.hash;
        if (hash && hash.includes('access_token')) {
          window.clearInterval(pollInterval);
          popup.close();

          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const expiresIn = parseInt(hashParams.get('expires_in') || '3600', 10);
          const scope = hashParams.get('scope') || '';

          if (accessToken) {
            // Verify real token & fetch real Google Profile
            const profile = await fetchGoogleUserProfile(accessToken);
            if (profile && profile.email) {
              options.onSuccess(
                {
                  access_token: accessToken,
                  token_type: 'Bearer',
                  expires_in: expiresIn,
                  scope,
                },
                profile,
              );
            } else {
              options.onError('Could not verify Google account profile. Try again.');
            }
          } else {
            options.onError('No access token returned by Google.');
          }
        } else if (hash && hash.includes('error=')) {
          window.clearInterval(pollInterval);
          popup.close();
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          options.onError(hashParams.get('error_description') || hashParams.get('error') || 'Google authentication denied.');
        }
      }
    } catch {
      // Cross-origin access error while on accounts.google.com - expected until redirect
    }
  }, 500);
}

/**
 * Fetch verified Google User Profile from official Google UserInfo API
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as GoogleUserProfile;
  } catch (err) {
    console.error('Error fetching Google profile:', err);
    return null;
  }
}

export interface PageSpeedAuditIssue {
  id: string;
  category: 'performance' | 'accessibility' | 'best-practices' | 'seo';
  title: string;
  description: string;
  displayValue?: string;
  score?: number | null;
  whyItMatters: string;
  recommendedFix: string;
  aiFixCode: string;
  canAutoFix: boolean;
  status: 'pending' | 'fixed';
}

export interface PageSpeedAuditResult {
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  /** Honest only when measured; otherwise "—" (never invent 1/4 or 4/4). */
  agenticBrowsingScore?: string;
  fcp: string;
  lcp: string;
  cls: string;
  fid: string;
  inp: string;
  speedIndex: string;
  tbt: string;
  passedAuditsCount: number;
  auditedUrl: string;
  auditedAt: string;
  strategy: 'mobile' | 'desktop';
  issues: PageSpeedAuditIssue[];
  /** True only when Google PSI returned a live lighthouse payload. */
  isLive?: boolean;
  source?: string;
}

/**
 * Empty PageSpeed result when live Google PSI is unavailable (zero-mock).
 */
function generateCalculatedPageSpeedMetrics(strategy: 'mobile' | 'desktop', targetUrl: string, _storeId?: string): PageSpeedAuditResult {
  return {
    performanceScore: 0,
    seoScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    agenticBrowsingScore: '—',
    fcp: '—',
    lcp: '—',
    cls: '—',
    fid: '—',
    inp: '—',
    speedIndex: '—',
    tbt: '—',
    passedAuditsCount: 0,
    auditedUrl: targetUrl,
    auditedAt: new Date().toLocaleTimeString(),
    strategy,
    issues: [],
    isLive: false,
    source: undefined,
  };
}

function classifyIssueCategory(id: string): PageSpeedAuditIssue['category'] {
  const key = (id || '').toLowerCase();
  if (/aria|color-contrast|heading|tap-targets|document-title|html-has-lang|link-name|button-name|image-alt|video-caption|meta-viewport/.test(key)) {
    return 'accessibility';
  }
  if (/seo|meta-description|hreflang|canonical|crawlable|robots-txt|http-status|link-text/.test(key)) {
    return 'seo';
  }
  return 'performance';
}

/** Map Laravel / Google PSI snapshot → UI model (zero invent). */
export function mapPageSpeedAuditSnapshot(
  audit: Record<string, any> | null | undefined,
  strategy: 'mobile' | 'desktop',
  fallbackUrl = '',
): PageSpeedAuditResult | null {
  if (!audit || typeof audit !== 'object') return null;

  const rawIssues = Array.isArray(audit.issues) ? audit.issues : [];
  const issues: PageSpeedAuditIssue[] = rawIssues.map((a: any, idx: number) => ({
    id: String(a.id || `audit-${idx}`),
    category: (a.category as PageSpeedAuditIssue['category']) || classifyIssueCategory(String(a.id || '')),
    title: String(a.title || ''),
    description: String(a.description || a.whyItMatters || ''),
    whyItMatters: String(a.whyItMatters || a.description || ''),
    recommendedFix: String(a.recommendedFix || ''),
    aiFixCode: '',
    canAutoFix: false,
    status: a.status === 'fixed' ? 'fixed' : 'pending',
    displayValue: a.displayValue || undefined,
    score: typeof a.score === 'number' ? a.score : null,
  }));

  const auditedUrl = String(audit.testedUrl || audit.auditedUrl || fallbackUrl || '');

  return {
    performanceScore: Number(audit.performanceScore) || 0,
    seoScore: Number(audit.seoScore) || 0,
    accessibilityScore: Number(audit.accessibilityScore) || 0,
    bestPracticesScore: Number(audit.bestPracticesScore) || 0,
    agenticBrowsingScore: '—',
    fcp: String(audit.fcp || '—'),
    lcp: String(audit.lcp || '—'),
    cls: String(audit.cls || '—'),
    fid: String(audit.fid || '—'),
    inp: String(audit.inp || '—'),
    speedIndex: String(audit.speedIndex || '—'),
    tbt: String(audit.tbt || '—'),
    passedAuditsCount: Number(audit.passedAuditsCount) || 0,
    auditedUrl,
    auditedAt: audit.auditedAt
      ? new Date(audit.auditedAt).toLocaleString()
      : new Date().toLocaleString(),
    strategy: (audit.strategy === 'desktop' ? 'desktop' : strategy),
    issues,
    isLive: true,
    source: String(audit.source || 'google_pagespeed'),
  };
}

// In-memory / session cache for PageSpeed results to prevent 429 Too Many Requests
const pagespeedCache: Record<string, { data: PageSpeedAuditResult; timestamp: number }> = {};
const CACHE_EXPIRY_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Fetch Real Core Web Vitals & PageSpeed Insights via official Google API
 */
export async function fetchGooglePageSpeedInsights(
  url: string, 
  strategy: 'mobile' | 'desktop' = 'mobile',
  storeId?: string
): Promise<PageSpeedAuditResult> {
  let cleanUrl = (url || '').trim();
  if (!cleanUrl) {
    cleanUrl = window.location.origin;
  }
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  const cacheKey = `${cleanUrl}::${strategy}`;
  if (pagespeedCache[cacheKey] && Date.now() - pagespeedCache[cacheKey].timestamp < CACHE_EXPIRY_MS) {
    return applySavedFixesToResult(pagespeedCache[cacheKey].data, storeId);
  }

  try {
    // Attempt official Google PageSpeed Insights API with 20s timeout
    if (
      !cleanUrl.includes('localhost') && 
      !cleanUrl.includes('127.0.0.1') && 
      !cleanUrl.includes('.test') && 
      !cleanUrl.includes('saasdomain.com')
    ) {
      const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
        cleanUrl,
      )}&strategy=${strategy}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const lr = data.lighthouseResult || {};
        
        const perfScore = Math.round((lr.categories?.performance?.score ?? 0) * 100);
        const seoScore = Math.round((lr.categories?.seo?.score ?? 0) * 100);
        const accScore = Math.round((lr.categories?.accessibility?.score ?? 0) * 100);
        const bpScore = Math.round((lr.categories?.['best-practices']?.score ?? 0) * 100);
        const audits = lr.audits || {};

        const extractedIssues: PageSpeedAuditIssue[] = Object.values(audits)
          .filter((a: any) => a.score !== null && a.score < 0.9 && a.title && a.description)
          .slice(0, 12)
          .map((a: any, idx: number) => ({
            id: a.id || `audit-${idx}`,
            category: classifyIssueCategory(String(a.id || '')),
            title: a.title,
            description: a.description,
            whyItMatters: a.description || '',
            recommendedFix: 'Follow Google Lighthouse guidance for this audit.',
            aiFixCode: '',
            canAutoFix: false,
            status: 'pending' as const,
            displayValue: a.displayValue || undefined,
            score: a.score,
          }));

        const rawResult: PageSpeedAuditResult = {
          performanceScore: perfScore,
          seoScore: seoScore,
          accessibilityScore: accScore,
          bestPracticesScore: bpScore,
          agenticBrowsingScore: '—',
          fcp: audits['first-contentful-paint']?.displayValue || '—',
          lcp: audits['largest-contentful-paint']?.displayValue || '—',
          cls: audits['cumulative-layout-shift']?.displayValue || '—',
          fid: audits['max-potential-fid']?.displayValue || '—',
          inp: audits['interaction-to-next-paint']?.displayValue
            || audits['interactive']?.displayValue
            || '—',
          speedIndex: audits['speed-index']?.displayValue || '—',
          tbt: audits['total-blocking-time']?.displayValue || '—',
          passedAuditsCount: Object.values(audits).filter((a: any) => a.score === 1).length,
          auditedUrl: cleanUrl,
          auditedAt: new Date().toLocaleTimeString(),
          strategy,
          issues: extractedIssues,
          isLive: true,
          source: 'google_pagespeed_client',
        };

        pagespeedCache[cacheKey] = { data: rawResult, timestamp: Date.now() };
        return rawResult;
      }
    }
  } catch (err) {
    console.warn('PageSpeed API live query attempt failed:', err);
  }

  // Live PSI unavailable — genuine empty (zero-mock), not invented scores
  return generateCalculatedPageSpeedMetrics(strategy, cleanUrl, storeId);
}

const PAGESPEED_FIXES_STORAGE_KEY = 'unityteck_pagespeed_fixed_';

export function getSavedPageSpeedFixes(storeId?: string): string[] {
  try {
    const raw = localStorage.getItem(`${PAGESPEED_FIXES_STORAGE_KEY}${storeId || 'default'}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePageSpeedFixes(fixedIssueIds: string[], storeId?: string): void {
  try {
    localStorage.setItem(`${PAGESPEED_FIXES_STORAGE_KEY}${storeId || 'default'}`, JSON.stringify(fixedIssueIds));
  } catch {}
}

export function clearPageSpeedFixes(storeId?: string): void {
  try {
    localStorage.removeItem(`${PAGESPEED_FIXES_STORAGE_KEY}${storeId || 'default'}`);
  } catch {}
}

/** Mark acknowledged issues only — never invent / boost Lighthouse scores. */
function applySavedFixesToResult(result: PageSpeedAuditResult, storeId?: string): PageSpeedAuditResult {
  const savedFixes = getSavedPageSpeedFixes(storeId);
  if (!savedFixes || savedFixes.length === 0) return result;

  const fixSet = new Set(savedFixes);
  return {
    ...result,
    issues: result.issues.map((i) => ({
      ...i,
      status: fixSet.has(i.id) ? ('fixed' as const) : i.status,
    })),
  };
}
