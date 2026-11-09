<?php

namespace App\Services;

use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use App\Models\SeoConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleService
{
    /** Site Kit–style scopes: one consent → GSC / GA4 / GTM / Ads / Indexing */
    public const SCOPES = [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters',
        'https://www.googleapis.com/auth/tagmanager.readonly',
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/indexing',
    ];

    public function getClientId(): string
    {
        return config('services.google.client_id')
            ?? env('GOOGLE_CLIENT_ID')
            ?? env('VITE_GOOGLE_CLIENT_ID')
            ?? '';
    }

    public function getClientSecret(): string
    {
        return config('services.google.client_secret')
            ?? env('GOOGLE_CLIENT_SECRET')
            ?? '';
    }

    public function getRedirectUri(): string
    {
        return config('services.google.redirect_uri')
            ?? env('GOOGLE_REDIRECT_URI')
            ?? url('/api/google/callback');
    }

    /**
     * Generate standard Google OAuth 2.0 authorization URL
     */
    public function getAuthUrl(string $storeId, ?string $redirectUri = null): string
    {
        $clientId = $this->getClientId();
        $redirect = $redirectUri ?: $this->getRedirectUri();
        $state = base64_encode(json_encode([
            'store_id' => $storeId,
            'ts' => time(),
            'nonce' => Str::random(16),
        ]));

        $params = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => implode(' ', self::SCOPES),
            'access_type' => 'offline',
            'prompt' => 'consent select_account',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $params;
    }

    /**
     * Exchange auth code for access token and refresh token.
     *
     * @return array{success: bool, token?: array<string, mixed>, message?: string, google_error?: string}
     */
    public function exchangeCode(string $code, ?string $redirectUri = null): array
    {
        $clientId = $this->getClientId();
        $clientSecret = $this->getClientSecret();
        $redirect = $redirectUri ?: $this->getRedirectUri();

        if ($clientId === '' || $clientSecret === '') {
            return [
                'success' => false,
                'message' => 'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
                'google_error' => 'missing_server_credentials',
            ];
        }

        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirect,
                'grant_type' => 'authorization_code',
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'token' => $response->json(),
                ];
            }

            $body = $response->json();
            $gError = is_array($body) ? (string) ($body['error'] ?? '') : '';
            $gDesc = is_array($body) ? (string) ($body['error_description'] ?? '') : '';
            Log::warning('Google OAuth exchange error: ' . $response->body());

            return [
                'success' => false,
                'message' => $this->mapTokenExchangeError($gError, $gDesc, $redirect),
                'google_error' => $gError !== '' ? $gError : 'token_exchange_failed',
            ];
        } catch (\Throwable $e) {
            Log::error('Google OAuth exchange exception: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Could not reach Google to finish sign-in. Check the server network and try again.',
                'google_error' => 'network',
            ];
        }
    }

    /**
     * Merchant-safe mapping for Google token endpoint failures.
     */
    protected function mapTokenExchangeError(string $error, string $description, string $redirectUri): string
    {
        $e = strtolower($error.' '.$description);
        if (str_contains($e, 'redirect_uri')) {
            return 'Google rejected the redirect URL ('.$redirectUri.'). Add this exact origin in Google Cloud → Credentials → Authorized redirect URIs.';
        }
        if (str_contains($e, 'invalid_client') || str_contains($e, 'unauthorized_client')) {
            return 'Google Client ID or Client Secret on the server does not match. Use the same OAuth client in GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.';
        }
        if (str_contains($e, 'invalid_grant') || str_contains($e, 'code')) {
            return 'The Google sign-in code expired or was already used. Click Sign in with Google again.';
        }
        if (str_contains($e, 'not found') || str_contains($e, 'deleted')) {
            return 'This Google OAuth client was not found or was deleted in Google Cloud. Create a new Web client and update server credentials.';
        }

        return 'Could not finish Google sign-in. Confirm OAuth client, secret, and redirect URI, then try again.';
    }

    /**
     * Refresh access token using refresh token
     */
    public function refreshAccessToken(StoreGoogleIntegration $integration): ?string
    {
        if (empty($integration->refresh_token)) {
            return $integration->access_token;
        }

        $clientId = $this->getClientId();
        $clientSecret = $this->getClientSecret();

        try {
            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'refresh_token' => $integration->refresh_token,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'refresh_token',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $newAccessToken = $data['access_token'] ?? null;
                $expiresIn = $data['expires_in'] ?? 3600;

                if ($newAccessToken) {
                    $integration->update([
                        'access_token' => $newAccessToken,
                        'token_expires_at' => now()->addSeconds($expiresIn - 60),
                    ]);
                    return $newAccessToken;
                }
            }
        } catch (\Throwable $e) {
            Log::error('Google token refresh exception: ' . $e->getMessage());
        }

        return $integration->access_token;
    }

    /**
     * Ensure valid token for Google Integration
     */
    public function getValidToken(StoreGoogleIntegration $integration): ?string
    {
        if (!$integration->is_connected) {
            return null;
        }

        if ($integration->token_expires_at && $integration->token_expires_at->isPast()) {
            return $this->refreshAccessToken($integration);
        }

        return $integration->access_token;
    }

    /**
     * Fetch Google user profile
     */
    public function fetchUserProfile(string $accessToken): ?array
    {
        try {
            $res = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');
            if ($res->successful()) {
                return $res->json();
            }
        } catch (\Throwable $e) {
            Log::error('Fetch user profile exception: ' . $e->getMessage());
        }
        return null;
    }

    /**
     * Discover GA4 Properties via Google Analytics Admin API
     */
    public function discoverAnalyticsProperties(string $accessToken): array
    {
        $properties = [];
        try {
            $res = Http::withToken($accessToken)
                ->get('https://analyticsadmin.googleapis.com/v1beta/accountSummaries');

            if ($res->successful()) {
                $summaries = $res->json('accountSummaries') ?? [];
                foreach ($summaries as $account) {
                    $propertySummaries = $account['propertySummaries'] ?? [];
                    foreach ($propertySummaries as $prop) {
                        $properties[] = [
                            'propertyId' => str_replace('properties/', '', $prop['property']),
                            'displayName' => $prop['displayName'] ?? 'GA4 Property',
                            'propertyResource' => $prop['property'],
                            'account' => $account['displayName'] ?? 'Google Analytics Account',
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Analytics discover exception: ' . $e->getMessage());
        }

        return $properties;
    }

    /**
     * Discover Search Console Properties via Webmasters API
     */
    public function discoverSearchConsoleProperties(string $accessToken): array
    {
        $sites = [];
        try {
            $res = Http::withToken($accessToken)
                ->get('https://www.googleapis.com/webmasters/v3/sites');

            if ($res->successful()) {
                $siteEntries = $res->json('siteEntry') ?? [];
                foreach ($siteEntries as $entry) {
                    $sites[] = [
                        'siteUrl' => $entry['siteUrl'],
                        'permissionLevel' => $entry['permissionLevel'] ?? 'siteOwner',
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Search Console discover exception: ' . $e->getMessage());
        }

        return $sites;
    }

    /**
     * Discover GTM Accounts & Containers via Tag Manager API
     */
    public function discoverTagManagerContainers(string $accessToken): array
    {
        $containers = [];
        try {
            $accountsRes = Http::withToken($accessToken)
                ->get('https://www.googleapis.com/tagmanager/v2/accounts');

            if ($accountsRes->successful()) {
                $accounts = $accountsRes->json('account') ?? [];
                foreach ($accounts as $acc) {
                    $accountId = $acc['accountId'];
                    $cRes = Http::withToken($accessToken)
                        ->get("https://www.googleapis.com/tagmanager/v2/accounts/{$accountId}/containers");

                    if ($cRes->successful()) {
                        $containerList = $cRes->json('container') ?? [];
                        foreach ($containerList as $cnt) {
                            $containers[] = [
                                'accountId' => $accountId,
                                'accountName' => $acc['name'] ?? 'GTM Account',
                                'containerId' => $cnt['publicId'] ?? $cnt['containerId'],
                                'name' => $cnt['name'] ?? 'Web Container',
                                'usageContext' => $cnt['usageContext'] ?? ['web'],
                            ];
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('GTM discover exception: ' . $e->getMessage());
        }

        return $containers;
    }

    /**
     * Discover Google Ads Accounts
     */
    public function discoverGoogleAdsAccounts(string $accessToken): array
    {
        $accounts = [];
        try {
            $res = Http::withToken($accessToken)
                ->withHeaders(array_filter([
                    'developer-token' => (string) (config('services.google.ads_developer_token') ?: env('GOOGLE_ADS_DEVELOPER_TOKEN', '')),
                    'login-customer-id' => preg_replace('/\D+/', '', (string) (config('services.google.ads_login_customer_id') ?: env('GOOGLE_ADS_LOGIN_CUSTOMER_ID', ''))) ?: null,
                ]))
                ->get('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers');

            if ($res->successful()) {
                $resourceNames = $res->json('resourceNames') ?? [];
                foreach ($resourceNames as $rn) {
                    $customerId = str_replace('customers/', '', $rn);
                    $accounts[] = [
                        'customerId' => $customerId,
                        'name' => "Google Ads Account ({$customerId})",
                    ];
                }
            }
        } catch (\Throwable $e) {
            // Ads API requires approved developer token; smooth fallback
        }

        return $accounts;
    }

    /**
     * Fetch Real GA4 Data from Google Analytics Data API
     */
    public function fetchAnalyticsReport(string $accessToken, string $propertyId, string $startDate = '30daysAgo', string $endDate = 'today'): array
    {
        $cleanPropertyId = str_replace('properties/', '', $propertyId);
        $url = "https://analyticsdata.googleapis.com/v1beta/properties/{$cleanPropertyId}:runReport";

        try {
            $res = Http::withToken($accessToken)->post($url, [
                'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
                'metrics' => [
                    ['name' => 'activeUsers'],
                    ['name' => 'sessions'],
                    ['name' => 'newUsers'],
                    ['name' => 'screenPageViews'],
                    ['name' => 'conversions'],
                    ['name' => 'purchaseRevenue'],
                    ['name' => 'bounceRate'],
                ],
                'dimensions' => [
                    ['name' => 'date'],
                ],
            ]);

            $byChannelRes = Http::withToken($accessToken)->post($url, [
                'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
                'metrics' => [
                    ['name' => 'sessions'],
                    ['name' => 'activeUsers'],
                    ['name' => 'conversions'],
                    ['name' => 'purchaseRevenue'],
                ],
                'dimensions' => [
                    ['name' => 'sessionDefaultChannelGroup'],
                    ['name' => 'sessionSource'],
                    ['name' => 'sessionMedium'],
                ],
                'limit' => 25,
            ]);

            $byDeviceRes = Http::withToken($accessToken)->post($url, [
                'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
                'metrics' => [['name' => 'sessions']],
                'dimensions' => [['name' => 'deviceCategory']],
            ]);

            $byCountryRes = Http::withToken($accessToken)->post($url, [
                'dateRanges' => [['startDate' => $startDate, 'endDate' => $endDate]],
                'metrics' => [['name' => 'sessions']],
                'dimensions' => [['name' => 'country']],
                'limit' => 10,
            ]);

            if ($res->successful()) {
                return [
                    'overview' => $res->json(),
                    'channels' => $byChannelRes->successful() ? $byChannelRes->json() : null,
                    'devices' => $byDeviceRes->successful() ? $byDeviceRes->json() : null,
                    'countries' => $byCountryRes->successful() ? $byCountryRes->json() : null,
                    'fetchedAt' => now()->toIso8601String(),
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('GA4 report exception: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Fetch Real Realtime Users from GA4
     */
    public function fetchAnalyticsRealtime(string $accessToken, string $propertyId): int
    {
        $cleanPropertyId = str_replace('properties/', '', $propertyId);
        $url = "https://analyticsdata.googleapis.com/v1beta/properties/{$cleanPropertyId}:runRealtimeReport";

        try {
            $res = Http::withToken($accessToken)->post($url, [
                'metrics' => [['name' => 'activeUsers']],
            ]);

            if ($res->successful()) {
                $rows = $res->json('rows') ?? [];
                if (!empty($rows) && isset($rows[0]['metricValues'][0]['value'])) {
                    return (int) $rows[0]['metricValues'][0]['value'];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('GA4 realtime exception: ' . $e->getMessage());
        }

        return 0;
    }

    /**
     * Fetch Real Search Console Performance Data
     */
    public function fetchSearchConsolePerformance(string $accessToken, string $siteUrl, string $startDate = null, string $endDate = null): array
    {
        $start = $startDate ?: now()->subDays(28)->toDateString();
        $end = $endDate ?: now()->toDateString();
        $encodedUrl = urlencode($siteUrl);
        $url = "https://www.googleapis.com/webmasters/v3/sites/{$encodedUrl}/searchAnalytics/query";

        try {
            // Overall Totals
            $totalsRes = Http::withToken($accessToken)->post($url, [
                'startDate' => $start,
                'endDate' => $end,
                'dimensions' => ['date'],
                'rowLimit' => 100,
            ]);

            // Top Queries
            $queriesRes = Http::withToken($accessToken)->post($url, [
                'startDate' => $start,
                'endDate' => $end,
                'dimensions' => ['query'],
                'rowLimit' => 25,
            ]);

            // Top Pages
            $pagesRes = Http::withToken($accessToken)->post($url, [
                'startDate' => $start,
                'endDate' => $end,
                'dimensions' => ['page'],
                'rowLimit' => 25,
            ]);

            if ($totalsRes->successful()) {
                return [
                    'dates' => $totalsRes->json('rows') ?? [],
                    'queries' => $queriesRes->successful() ? ($queriesRes->json('rows') ?? []) : [],
                    'pages' => $pagesRes->successful() ? ($pagesRes->json('rows') ?? []) : [],
                    'fetchedAt' => now()->toIso8601String(),
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Search Console query exception: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Run Real PageSpeed / Lighthouse Audit via Google API
     */
    public function runPageSpeedAudit(string $targetUrl, string $strategy = 'mobile'): ?array
    {
        try {
            $apiKey = env('GOOGLE_PAGESPEED_API_KEY');
            $endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
            $params = [
                'url' => $targetUrl,
                'strategy' => $strategy,
                'category' => ['PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'BEST_PRACTICES'],
            ];
            if ($apiKey) {
                $params['key'] = $apiKey;
            }

            $res = Http::timeout(25)->get($endpoint, $params);
            if ($res->successful()) {
                $data = $res->json();
                $lh = $data['lighthouseResult'] ?? [];
                $cats = $lh['categories'] ?? [];
                $audits = $lh['audits'] ?? [];

                // Zero-mock: missing category score → 0 (never invent 85/95)
                $performanceScore = isset($cats['performance']['score']) ? (int) round($cats['performance']['score'] * 100) : 0;
                $seoScore = isset($cats['seo']['score']) ? (int) round($cats['seo']['score'] * 100) : 0;
                $accessibilityScore = isset($cats['accessibility']['score']) ? (int) round($cats['accessibility']['score'] * 100) : 0;
                $bestPracticesScore = isset($cats['best-practices']['score']) ? (int) round($cats['best-practices']['score'] * 100) : 0;

                // Collect diagnostic issues with "What is wrong → Why it matters → Recommended fix"
                $issues = [];
                $passedAuditsCount = 0;
                foreach ($audits as $key => $audit) {
                    if (isset($audit['score']) && (float) $audit['score'] === 1.0) {
                        $passedAuditsCount++;
                    }
                    if (isset($audit['score']) && $audit['score'] !== null && $audit['score'] < 0.9 && !empty($audit['title'])) {
                        $whatIsWrong = $audit['title'];
                        $whyItMatters = $audit['description'] ?? 'Affects page loading speed and mobile shopper conversion.';
                        $fix = 'Optimize asset delivery, minify scripts, and enable compression.';
                        if (str_contains($key, 'image')) {
                            $fix = 'Serve images in WebP or AVIF format and specify explicit width/height attributes.';
                        } elseif (str_contains($key, 'render-blocking')) {
                            $fix = 'Inline critical CSS and defer non-essential scripts via defer/async attributes.';
                        } elseif (str_contains($key, 'lcp')) {
                            $fix = 'Preload Largest Contentful Paint hero image with <link rel="preload">.';
                        } elseif (str_contains($key, 'font')) {
                            $fix = 'Use font-display: swap to prevent invisible text during font loading.';
                        }

                        $category = 'performance';
                        if (preg_match('/aria|color-contrast|heading|tap-targets|document-title|html-has-lang|link-name|button-name|image-alt|video-caption|meta-viewport/i', (string) $key)) {
                            $category = 'accessibility';
                        } elseif (preg_match('/seo|meta-description|hreflang|canonical|crawlable|is-crawlable|robots-txt|http-status|link-text/i', (string) $key)) {
                            $category = 'seo';
                        } elseif (preg_match('/best-practices|https|vulnerab|csp|charset|doctype|geolocation|notification|paste|errors-in-console/i', (string) $key)) {
                            $category = 'best-practices';
                        }

                        $issues[] = [
                            'id' => $key,
                            'category' => $category,
                            'title' => $whatIsWrong,
                            'description' => $whyItMatters,
                            'whyItMatters' => $whyItMatters,
                            'recommendedFix' => $fix,
                            'displayValue' => $audit['displayValue'] ?? null,
                            'score' => $audit['score'],
                            'status' => 'pending',
                            'canAutoFix' => false,
                        ];

                        if (count($issues) >= 12) {
                            break;
                        }
                    }
                }

                return [
                    'strategy' => $strategy,
                    'testedUrl' => $targetUrl,
                    'auditedUrl' => $targetUrl,
                    'performanceScore' => $performanceScore,
                    'seoScore' => $seoScore,
                    'accessibilityScore' => $accessibilityScore,
                    'bestPracticesScore' => $bestPracticesScore,
                    'fcp' => $audits['first-contentful-paint']['displayValue'] ?? '—',
                    'lcp' => $audits['largest-contentful-paint']['displayValue'] ?? '—',
                    'cls' => $audits['cumulative-layout-shift']['displayValue'] ?? '—',
                    'fid' => $audits['max-potential-fid']['displayValue'] ?? '—',
                    'inp' => $audits['interaction-to-next-paint']['displayValue']
                        ?? ($audits['interactive']['displayValue'] ?? '—'),
                    'tbt' => $audits['total-blocking-time']['displayValue'] ?? '—',
                    'speedIndex' => $audits['speed-index']['displayValue'] ?? '—',
                    'passedAuditsCount' => $passedAuditsCount,
                    'issues' => $issues,
                    'auditedAt' => now()->toIso8601String(),
                    'source' => 'google_pagespeed',
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("PageSpeed audit exception for {$targetUrl}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Public storefront base URL after Hostinger publish (custom domain preferred).
     */
    public function resolveStorePublicBaseUrl(?Store $store): string
    {
        if (!$store) {
            return '';
        }
        if (!empty($store->custom_domain)) {
            $host = preg_replace('#^https?://#', '', rtrim((string) $store->custom_domain, '/'));
            return 'https://' . $host;
        }
        if (!empty($store->slug)) {
            $suffix = env('STORE_PUBLIC_DOMAIN_SUFFIX', 'saasdomain.com');
            return 'https://' . $store->slug . '.' . ltrim($suffix, '.');
        }
        return '';
    }

    /**
     * Pick best GA4 / GSC / GTM / Ads for this store (Site Kit auto-link).
     * Prefer GSC property matching published domain; otherwise first available — never invent IDs.
     */
    public function pickSiteKitDefaults(?Store $store, array $ga4, array $gsc, array $gtm, array $ads): array
    {
        $base = $this->resolveStorePublicBaseUrl($store);
        $host = $base ? strtolower(parse_url($base, PHP_URL_HOST) ?: '') : '';
        $slug = $store ? strtolower((string) ($store->slug ?? '')) : '';

        $matchedGsc = null;
        foreach ($gsc as $site) {
            $siteUrl = strtolower((string) ($site['siteUrl'] ?? ''));
            if ($host && (str_contains($siteUrl, $host) || str_contains($siteUrl, 'sc-domain:' . $host))) {
                $matchedGsc = $site;
                break;
            }
            if ($slug && str_contains($siteUrl, $slug)) {
                $matchedGsc = $site;
                break;
            }
        }
        if (!$matchedGsc && !empty($gsc[0])) {
            $matchedGsc = $gsc[0];
        }

        $ga4First = $ga4[0] ?? null;
        $gtmFirst = $gtm[0] ?? null;
        $adsFirst = $ads[0] ?? null;

        $sitemapUrl = $base !== '' ? rtrim($base, '/') . '/sitemap.xml' : null;

        return [
            'ga4_property_id' => $ga4First['propertyId'] ?? ($ga4First['propertyResource'] ?? null),
            'ga4_property_name' => $ga4First['displayName'] ?? null,
            'ga4_measurement_id' => null, // filled only when merchant/API provides Measurement ID
            'gsc_site_url' => $matchedGsc['siteUrl'] ?? null,
            'gtm_account_id' => isset($gtmFirst['accountId']) ? (string) $gtmFirst['accountId'] : null,
            'gtm_container_id' => $gtmFirst['containerId'] ?? null,
            'google_ads_customer_id' => $adsFirst['customerId'] ?? null,
            'google_ads_account_name' => $adsFirst['name'] ?? null,
            'store_public_url' => $base ?: null,
            'sitemap_url' => $sitemapUrl,
        ];
    }

    /**
     * Submit XML sitemap to Search Console (real API — empty result if site not verified).
     */
    public function submitSitemapToSearchConsole(string $accessToken, string $siteUrl, string $sitemapUrl): bool
    {
        try {
            $encodedSite = rawurlencode($siteUrl);
            $encodedSitemap = rawurlencode($sitemapUrl);
            $url = "https://www.googleapis.com/webmasters/v3/sites/{$encodedSite}/sitemaps/{$encodedSitemap}";
            $res = Http::withToken($accessToken)->put($url);
            if ($res->successful() || $res->status() === 204) {
                return true;
            }
            Log::warning('GSC sitemap submit failed: ' . $res->body());
        } catch (\Throwable $e) {
            Log::warning('GSC sitemap submit exception: ' . $e->getMessage());
        }
        return false;
    }

    /**
     * Request Google Indexing API for a URL (homepage / key pages after publish).
     */
    public function requestUrlIndexing(string $accessToken, string $pageUrl, string $type = 'URL_UPDATED'): bool
    {
        try {
            $res = Http::withToken($accessToken)->post('https://indexing.googleapis.com/v3/urlNotifications:publish', [
                'url' => $pageUrl,
                'type' => $type,
            ]);
            if ($res->successful()) {
                return true;
            }
            Log::warning('Indexing API failed: ' . $res->body());
        } catch (\Throwable $e) {
            Log::warning('Indexing API exception: ' . $e->getMessage());
        }
        return false;
    }
}
