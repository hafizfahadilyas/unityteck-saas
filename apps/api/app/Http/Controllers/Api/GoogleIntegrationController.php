<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcquisitionChannel;
use App\Models\Order;
use App\Models\SeoConfig;
use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use App\Services\GoogleAdsService;
use App\Services\GoogleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleIntegrationController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        protected GoogleService $googleService,
        protected GoogleAdsService $googleAdsService,
    ) {}

    /**
     * Get Google OAuth 2.0 Auth URL
     */
    public function getAuthUrl(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $redirectUri = $request->input('redirect_uri') ?: $this->googleService->getRedirectUri();
        $clientId = $this->googleService->getClientId();
        $hasSecret = $this->googleService->getClientSecret() !== '';
        if ($clientId === '' || !$hasSecret) {
            return response()->json([
                'message' => 'Google OAuth is not configured on the server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
                'error' => 'missing_server_credentials',
                'client_id' => $clientId,
                'configured' => false,
            ], 400);
        }

        $authUrl = $this->googleService->getAuthUrl($storeId, $redirectUri);

        return response()->json([
            'auth_url' => $authUrl,
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scopes' => GoogleService::SCOPES,
            'configured' => true,
        ]);
    }

    /**
     * Handle OAuth Callback or Token Submission
     */
    public function handleCallback(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $code = $request->input('code');
        $directAccessToken = $request->input('access_token');
        $redirectUri = $request->input('redirect_uri');

        $accessToken = null;
        $refreshToken = null;
        $expiresIn = 3600;

        if ($code) {
            $exchange = $this->googleService->exchangeCode($code, $redirectUri);
            $tokenData = ($exchange['success'] ?? false) ? ($exchange['token'] ?? null) : null;
            if (is_array($tokenData) && isset($tokenData['access_token'])) {
                $accessToken = $tokenData['access_token'];
                $refreshToken = $tokenData['refresh_token'] ?? null;
                $expiresIn = $tokenData['expires_in'] ?? 3600;
            } else {
                return response()->json([
                    'message' => $exchange['message']
                        ?? 'Could not obtain Google access token. Please verify authorization code.',
                    'error' => $exchange['google_error'] ?? 'token_exchange_failed',
                ], 400);
            }
        } elseif ($directAccessToken) {
            // Direct token from Google Identity Services
            $accessToken = $directAccessToken;
            $expiresIn = (int) ($request->input('expires_in') ?: 3600);
            $refreshToken = $request->input('refresh_token');
        }

        if (!$accessToken) {
            return response()->json([
                'message' => 'Could not obtain Google access token. Please verify authorization code.',
                'error' => 'missing_access_token',
            ], 400);
        }

        // Fetch verified user profile
        $userProfile = $this->googleService->fetchUserProfile($accessToken);
        $email = $userProfile['email'] ?? $request->input('email');
        $name = $userProfile['name'] ?? $request->input('name') ?? ($email ? explode('@', $email)[0] : 'Google Merchant');
        $picture = $userProfile['picture'] ?? null;

        // Upsert store integration
        $integration = StoreGoogleIntegration::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (!$integration->exists) {
            $integration->id = $this->newId('g_int');
            $integration->store_id = $storeId;
        }

        $integration->is_connected = true;
        $integration->google_account_email = $email;
        $integration->google_account_name = $name;
        $integration->google_account_picture = $picture;
        $integration->access_token = $accessToken;
        if ($refreshToken) {
            $integration->refresh_token = $refreshToken;
        }
        $integration->token_expires_at = now()->addSeconds($expiresIn - 60);
        $integration->sync_status = 'connected';
        $integration->last_error = null;
        $integration->save();

        // Update SeoConfig to reflect Google Account connection
        $seo = SeoConfig::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
        if (!$seo->exists) {
            $seo->id = $this->newId('seo');
            $seo->store_id = $storeId;
        }
        $seo->google_connected = true;
        $seo->google_account_email = $email;
        $seo->google_connected_at = now();
        $seo->save();

        // Discover available properties (Site Kit style)
        $ga4Properties = $this->googleService->discoverAnalyticsProperties($accessToken);
        $gscSites = $this->googleService->discoverSearchConsoleProperties($accessToken);
        $gtmContainers = $this->googleService->discoverTagManagerContainers($accessToken);
        $adsAccounts = $this->googleService->discoverGoogleAdsAccounts($accessToken);

        $store = Store::find($storeId);
        $picks = $this->googleService->pickSiteKitDefaults(
            $store,
            $ga4Properties,
            $gscSites,
            $gtmContainers,
            $adsAccounts
        );

        // Auto-link discovered tools (never invent IDs)
        $integration->ga4_property_id = $picks['ga4_property_id'] ?: $integration->ga4_property_id;
        $integration->ga4_property_name = $picks['ga4_property_name'] ?: $integration->ga4_property_name;
        if (!empty($picks['ga4_measurement_id'])) {
            $integration->ga4_measurement_id = $picks['ga4_measurement_id'];
        }
        $integration->gsc_site_url = $picks['gsc_site_url'] ?: $integration->gsc_site_url;
        $integration->gtm_account_id = $picks['gtm_account_id'] ?: $integration->gtm_account_id;
        $integration->gtm_container_id = $picks['gtm_container_id'] ?: $integration->gtm_container_id;
        $integration->google_ads_customer_id = $picks['google_ads_customer_id'] ?: $integration->google_ads_customer_id;
        $integration->google_ads_account_name = $picks['google_ads_account_name'] ?: $integration->google_ads_account_name;
        $integration->save();

        $seo->google_connected = true;
        $seo->google_account_email = $email;
        $seo->google_connected_at = now();
        if (!empty($integration->ga4_measurement_id)) {
            $seo->ga4_measurement_id = $integration->ga4_measurement_id;
        }
        if (!empty($integration->gtm_container_id)) {
            $seo->gtm_container_id = $integration->gtm_container_id;
        }
        if (!empty($integration->gsc_site_url)) {
            $seo->search_console_connected = true;
            $seo->indexing_api_enabled = true;
        }
        if (!empty($picks['sitemap_url'])) {
            $seo->sitemap_enabled = true;
            $seo->sitemap_url = $picks['sitemap_url'];
        }
        $seo->save();

        // Sitemap + homepage indexing ping (real APIs; fail soft if not verified yet)
        $sitemapSubmitted = false;
        $indexingPinged = false;
        if ($accessToken && !empty($integration->gsc_site_url) && !empty($picks['sitemap_url'])) {
            $sitemapSubmitted = $this->googleService->submitSitemapToSearchConsole(
                $accessToken,
                $integration->gsc_site_url,
                $picks['sitemap_url']
            );
        }
        if ($accessToken && !empty($picks['store_public_url'])) {
            $indexingPinged = $this->googleService->requestUrlIndexing(
                $accessToken,
                rtrim($picks['store_public_url'], '/') . '/'
            );
        }

        // Auto sync console / analytics / ads snapshots / PageSpeed
        $syncResult = $this->runLiveSync($storeId, $integration->fresh());

        return response()->json([
            'message' => 'Google Site Kit connected — tools auto-linked and sync started',
            'integration' => $integration->fresh(),
            'site_kit' => [
                'mode' => 'auto',
                'store_public_url' => $picks['store_public_url'],
                'sitemap_url' => $picks['sitemap_url'],
                'sitemap_submitted' => $sitemapSubmitted,
                'indexing_homepage_pinged' => $indexingPinged,
                'linked' => [
                    'ga4' => !empty($integration->ga4_property_id),
                    'search_console' => !empty($integration->gsc_site_url),
                    'gtm' => !empty($integration->gtm_container_id),
                    'ads' => !empty($integration->google_ads_customer_id),
                ],
            ],
            'discovered_properties' => [
                'analytics' => $ga4Properties,
                'search_console' => $gscSites,
                'tag_manager' => $gtmContainers,
                'google_ads' => $adsAccounts,
            ],
            'auto_selection' => [
                'suggested_ga4' => $picks['ga4_property_id'],
                'suggested_gsc' => $picks['gsc_site_url'],
                'suggested_gtm' => $picks['gtm_container_id'],
                'suggested_ads' => $picks['google_ads_customer_id'],
                'sitemap_url' => $picks['sitemap_url'],
            ],
            'sync' => $syncResult,
        ]);
    }

    /**
     * Get Store Google Integration Status
     */
    public function getStatus(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();

        return response()->json([
            'is_connected' => $integration ? (bool) $integration->is_connected : false,
            'integration' => $integration,
            'store_id' => $storeId,
        ]);
    }

    /**
     * Get Discovered Properties for Connected Account
     */
    public function getProperties(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        if (!$integration || !$integration->is_connected) {
            return response()->json([
                'is_connected' => false,
                'properties' => [
                    'analytics' => [],
                    'search_console' => [],
                    'tag_manager' => [],
                    'google_ads' => [],
                ],
            ]);
        }

        $token = $this->googleService->getValidToken($integration);
        if (!$token) {
            return response()->json([
                'is_connected' => false,
                'error' => 'Authentication expired. Please reconnect Google Account.',
            ], 401);
        }

        $ga4Properties = $this->googleService->discoverAnalyticsProperties($token);
        $gscSites = $this->googleService->discoverSearchConsoleProperties($token);
        $gtmContainers = $this->googleService->discoverTagManagerContainers($token);
        $adsAccounts = $this->googleService->discoverGoogleAdsAccounts($token);

        return response()->json([
            'is_connected' => true,
            'current_selection' => [
                'ga4_property_id' => $integration->ga4_property_id,
                'ga4_measurement_id' => $integration->ga4_measurement_id,
                'gsc_site_url' => $integration->gsc_site_url,
                'gtm_account_id' => $integration->gtm_account_id,
                'gtm_container_id' => $integration->gtm_container_id,
                'google_ads_customer_id' => $integration->google_ads_customer_id,
            ],
            'properties' => [
                'analytics' => $ga4Properties,
                'search_console' => $gscSites,
                'tag_manager' => $gtmContainers,
                'google_ads' => $adsAccounts,
            ],
        ]);
    }

    /**
     * Save Property Mapping (GA4, GSC, GTM, Google Ads)
     */
    public function saveProperties(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'ga4_property_id' => ['nullable', 'string', 'max:128'],
            'ga4_property_name' => ['nullable', 'string', 'max:255'],
            'ga4_measurement_id' => ['nullable', 'string', 'max:64'],
            'gsc_site_url' => ['nullable', 'string', 'max:255'],
            'gtm_account_id' => ['nullable', 'string', 'max:128'],
            'gtm_container_id' => ['nullable', 'string', 'max:64'],
            'google_ads_customer_id' => ['nullable', 'string', 'max:64'],
            'google_ads_account_name' => ['nullable', 'string', 'max:255'],
        ]);

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        if (!$integration || !$integration->is_connected) {
            return response()->json([
                'message' => 'Connect Google for this store first, then save properties.',
                'error' => 'google_not_connected',
            ], 400);
        }
        $integration->fill($data)->save();

        // Sync with SeoConfig table
        $seo = SeoConfig::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
        if (!$seo->exists) {
            $seo->id = $this->newId('seo');
            $seo->store_id = $storeId;
        }
        if (!empty($data['ga4_measurement_id'])) {
            $seo->ga4_measurement_id = $data['ga4_measurement_id'];
        }
        if (!empty($data['gtm_container_id'])) {
            $seo->gtm_container_id = $data['gtm_container_id'];
        }
        if (!empty($data['gsc_site_url'])) {
            $seo->search_console_connected = true;
            $seo->indexing_api_enabled = true;
            // Never invent verification meta — merchant pastes real GSC HTML tag if needed
        }
        $store = Store::find($storeId);
        $base = $this->googleService->resolveStorePublicBaseUrl($store);
        if ($base !== '') {
            $seo->sitemap_enabled = true;
            $seo->sitemap_url = rtrim($base, '/') . '/sitemap.xml';
        }
        $seo->save();

        $sync = $this->runLiveSync($storeId, $integration->fresh());

        return response()->json([
            'message' => 'Google properties successfully saved',
            'integration' => $integration->fresh(),
            'sync' => $sync,
        ]);
    }

    /**
     * Trigger Live Real Data Sync
     */
    public function sync(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        if (!$integration || !$integration->is_connected) {
            return response()->json([
                'error' => 'Store does not have a connected Google Account.',
            ], 400);
        }

        $result = $this->runLiveSync($storeId, $integration);
        if (!empty($result['error'])) {
            return response()->json(['error' => $result['error']], 500);
        }

        return response()->json([
            'message' => 'Real Google data synced successfully',
            'last_synced_at' => $result['last_synced_at'] ?? now()->toIso8601String(),
            'integration' => $integration->fresh(),
            'modules' => $result['modules'] ?? [],
        ]);
    }

    /**
     * Shared Site Kit sync: Analytics + Search Console + PageSpeed (+ soft Ads flag).
     * Empty modules stay null — never invent metrics.
     *
     * @return array{ok?: bool, error?: string, last_synced_at?: string, modules?: array}
     */
    protected function runLiveSync(string $storeId, StoreGoogleIntegration $integration): array
    {
        $token = $this->googleService->getValidToken($integration);
        $integration->update(['sync_status' => 'syncing']);

        $store = Store::find($storeId);
        $storeUrl = $this->googleService->resolveStorePublicBaseUrl($store);

        try {
            $modules = [
                'analytics' => false,
                'search_console' => false,
                'pagespeed' => false,
                'ads' => false,
                'sitemap' => false,
            ];

            $analyticsSnapshot = null;
            if ($token && $integration->ga4_property_id) {
                $analyticsSnapshot = $this->googleService->fetchAnalyticsReport(
                    $token,
                    $integration->ga4_property_id
                );
                if (!empty($analyticsSnapshot)) {
                    $analyticsSnapshot['realtimeUsers'] = $this->googleService->fetchAnalyticsRealtime(
                        $token,
                        $integration->ga4_property_id
                    );
                    $modules['analytics'] = true;
                }
            }

            $searchConsoleSnapshot = null;
            if ($token && $integration->gsc_site_url) {
                $searchConsoleSnapshot = $this->googleService->fetchSearchConsolePerformance(
                    $token,
                    $integration->gsc_site_url
                );
                if (!empty($searchConsoleSnapshot)) {
                    $modules['search_console'] = true;
                }

                $seoRow = SeoConfig::withoutGlobalScope('store')->where('store_id', $storeId)->first();
                $sitemapUrl = $seoRow?->sitemap_url;
                if (!$sitemapUrl && $storeUrl !== '') {
                    $sitemapUrl = rtrim($storeUrl, '/') . '/sitemap.xml';
                }
                if ($sitemapUrl) {
                    $modules['sitemap'] = $this->googleService->submitSitemapToSearchConsole(
                        $token,
                        $integration->gsc_site_url,
                        $sitemapUrl
                    );
                }
            }

            $psiMobile = $storeUrl !== '' ? $this->googleService->runPageSpeedAudit($storeUrl, 'mobile') : null;
            $psiDesktop = $storeUrl !== '' ? $this->googleService->runPageSpeedAudit($storeUrl, 'desktop') : null;
            if ($psiMobile || $psiDesktop) {
                $modules['pagespeed'] = true;
            }

            $adsSnapshot = $integration->google_ads_snapshot;
            if ($token && ! empty($integration->google_ads_customer_id)) {
                $adsSync = $this->googleAdsService->syncIntegrationSnapshot($integration);
                if ($adsSync['ok'] ?? false) {
                    $modules['ads'] = true;
                    $adsSnapshot = $adsSync['snapshot'] ?? $adsSnapshot;
                    $integration->refresh();
                }
            }

            $integration->update([
                'sync_status' => 'synced',
                'last_synced_at' => now(),
                'last_error' => null,
                'analytics_snapshot' => $analyticsSnapshot ?: $integration->analytics_snapshot,
                'search_console_snapshot' => $searchConsoleSnapshot ?: $integration->search_console_snapshot,
                'pagespeed_mobile_snapshot' => $psiMobile ?: $integration->pagespeed_mobile_snapshot,
                'pagespeed_desktop_snapshot' => $psiDesktop ?: $integration->pagespeed_desktop_snapshot,
                'google_ads_snapshot' => $adsSnapshot ?: $integration->google_ads_snapshot,
            ]);

            if ($searchConsoleSnapshot && !empty($searchConsoleSnapshot['dates'])) {
                $seo = SeoConfig::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
                if (!$seo->exists) {
                    $seo->id = $this->newId('seo');
                    $seo->store_id = $storeId;
                }
                $topQueries = array_slice(array_map(function ($q) {
                    return [
                        'query' => $q['keys'][0] ?? 'keyword',
                        'clicks' => (int) ($q['clicks'] ?? 0),
                        'impressions' => (int) ($q['impressions'] ?? 0),
                        'position' => round($q['position'] ?? 0, 1),
                    ];
                }, $searchConsoleSnapshot['queries'] ?? []), 0, 10);

                $totalClicks = (int) array_sum(array_map(fn ($r) => (int) ($r['clicks'] ?? 0), $searchConsoleSnapshot['dates'] ?? []));
                $totalImpressions = (int) array_sum(array_map(fn ($r) => (int) ($r['impressions'] ?? 0), $searchConsoleSnapshot['dates'] ?? []));
                $avgCtr = $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 1) : 0;

                $extra = is_array($seo->extra) ? $seo->extra : [];
                $extra['total_search_clicks'] = $totalClicks;
                $extra['total_search_impressions'] = $totalImpressions;
                $extra['avg_ctr'] = $avgCtr;
                $extra['top_queries'] = $topQueries;
                $extra['last_indexing_ping'] = now()->toDateTimeString();
                $seo->extra = $extra;
                $seo->save();
            }

            return [
                'ok' => true,
                'last_synced_at' => now()->toIso8601String(),
                'modules' => $modules,
            ];
        } catch (\Throwable $e) {
            $integration->update([
                'sync_status' => 'error',
                'last_error' => $e->getMessage(),
            ]);

            return ['error' => 'Sync failed: ' . $e->getMessage()];
        }
    }

    /**
     * Disconnect Google Account
     */
    public function disconnect(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        if ($integration) {
            $integration->update([
                'is_connected' => false,
                'access_token' => null,
                'refresh_token' => null,
                'token_expires_at' => null,
                'sync_status' => 'not_connected',
                'analytics_snapshot' => null,
                'search_console_snapshot' => null,
                'pagespeed_mobile_snapshot' => null,
                'pagespeed_desktop_snapshot' => null,
            ]);
        }

        // Update SeoConfig
        $seo = SeoConfig::query()->forStore($storeId)->first();
        if ($seo) {
            $seo->update([
                'google_connected' => false,
                'google_account_email' => null,
                'google_connected_at' => null,
                'search_console_connected' => false,
            ]);
        }

        return response()->json([
            'message' => 'Google Account disconnected successfully',
            'is_connected' => false,
        ]);
    }

    /**
     * Get Real Analytics (GA4 + Store Ecommerce)
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        $isConnected = $integration && $integration->is_connected;

        // Actual orders data from database for attribution
        $orders = Order::query()->forStore($storeId)->get();
        $totalOrders = $orders->count();
        $totalRevenue = (float) $orders->sum('total_amount');

        // Attribution groups from real orders
        $orderSources = [];
        foreach ($orders as $ord) {
            $src = $ord->source ?: 'Direct';
            if (!isset($orderSources[$src])) {
                $orderSources[$src] = [
                    'source' => $src,
                    'orders' => 0,
                    'revenue' => 0,
                    'medium' => $ord->medium ?: 'organic',
                    'campaign' => $ord->campaign ?: 'default',
                ];
            }
            $orderSources[$src]['orders']++;
            $orderSources[$src]['revenue'] += (float) $ord->total_amount;
        }

        if (!$isConnected) {
            return response()->json([
                'is_connected' => false,
                'message' => 'Google Analytics is not connected for this store.',
                'store_orders_summary' => [
                    'total_orders' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'order_sources' => array_values($orderSources),
                ],
                'snapshot' => null,
            ]);
        }

        return response()->json([
            'is_connected' => true,
            'ga4_property_id' => $integration->ga4_property_id,
            'ga4_measurement_id' => $integration->ga4_measurement_id,
            'last_synced_at' => $integration->last_synced_at,
            'snapshot' => $integration->analytics_snapshot,
            'order_attribution' => array_values($orderSources),
            'realtime_users' => $integration->analytics_snapshot['realtimeUsers'] ?? 0,
        ]);
    }

    /**
     * Get Real Search Console & Indexing Data
     */
    public function getSearchConsole(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        $isConnected = $integration && $integration->is_connected && !empty($integration->gsc_site_url);

        if (!$isConnected) {
            return response()->json([
                'is_connected' => false,
                'site_url' => null,
                'snapshot' => null,
            ]);
        }

        return response()->json([
            'is_connected' => true,
            'site_url' => $integration->gsc_site_url,
            'last_synced_at' => $integration->last_synced_at,
            'snapshot' => $integration->search_console_snapshot,
        ]);
    }

    /**
     * Get Real PageSpeed & Core Web Vitals (Google PSI API — zero mock).
     * Optional query: strategy=mobile|desktop, refresh=1, url=https://…
     */
    public function getPageSpeed(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $strategy = strtolower((string) $request->query('strategy', 'mobile')) === 'desktop'
            ? 'desktop'
            : 'mobile';
        $refresh = $request->boolean('refresh');
        $customUrl = trim((string) $request->query('url', ''));

        $store = Store::find($storeId);
        $defaultUrl = $this->googleService->resolveStorePublicBaseUrl($store);
        $targetUrl = $customUrl !== '' ? $customUrl : $defaultUrl;

        if ($targetUrl !== '' && !preg_match('#^https?://#i', $targetUrl)) {
            $targetUrl = 'https://' . ltrim($targetUrl, '/');
        }

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();
        $snapshot = $strategy === 'desktop'
            ? ($integration?->pagespeed_desktop_snapshot)
            : ($integration?->pagespeed_mobile_snapshot);

        // Custom URL that differs from last audited URL → force fresh audit
        if ($snapshot && $customUrl !== '') {
            $prevUrl = (string) ($snapshot['testedUrl'] ?? $snapshot['auditedUrl'] ?? '');
            if ($prevUrl !== '' && rtrim($prevUrl, '/') !== rtrim($targetUrl, '/')) {
                $refresh = true;
            }
        }

        if ($targetUrl === '') {
            return response()->json([
                'strategy' => $strategy,
                'audit' => null,
                'tested_url' => null,
                'message' => 'No public storefront URL configured for this store.',
            ]);
        }

        if (!$snapshot || $refresh) {
            $newAudit = $this->googleService->runPageSpeedAudit($targetUrl, $strategy);
            if ($newAudit) {
                if (!$integration) {
                    $integration = StoreGoogleIntegration::withoutGlobalScope('store')
                        ->firstOrNew(['store_id' => $storeId]);
                    if (!$integration->exists) {
                        $integration->id = $this->newId('g_int');
                        $integration->store_id = $storeId;
                        $integration->is_connected = false;
                        $integration->sync_status = 'not_connected';
                    }
                    $integration->save();
                }
                if ($strategy === 'desktop') {
                    $integration->update(['pagespeed_desktop_snapshot' => $newAudit]);
                } else {
                    $integration->update(['pagespeed_mobile_snapshot' => $newAudit]);
                }
                $snapshot = $newAudit;
            }
        }

        return response()->json([
            'strategy' => $strategy,
            'audit' => $snapshot,
            'tested_url' => $snapshot['testedUrl'] ?? $targetUrl,
            'source' => $snapshot ? 'google_pagespeed' : null,
            'message' => $snapshot ? null : 'PageSpeed audit unavailable. Check GOOGLE_PAGESPEED_API_KEY / URL reachability.',
        ]);
    }

    /**
     * Master Admin: Cross-store Google Integration Matrix
     * Shows status for every store without mixing data
     */
    public function masterStoreIntegrations(Request $request): JsonResponse
    {
        $stores = Store::all();
        $integrations = StoreGoogleIntegration::all()->keyBy('store_id');
        $seoConfigs = SeoConfig::all()->keyBy('store_id');

        $rows = $stores->map(function ($store) use ($integrations, $seoConfigs) {
            $int = $integrations->get($store->id);
            $seo = $seoConfigs->get($store->id);

            return [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'store_slug' => $store->slug,
                'is_connected' => $int ? (bool) $int->is_connected : (bool) ($seo ? $seo->google_connected : false),
                'account_email' => $int ? $int->google_account_email : ($seo ? $seo->google_account_email : null),
                'ga4_connected' => !empty($int ? $int->ga4_property_id : ($seo ? $seo->ga4_measurement_id : null)),
                'ga4_id' => $int ? $int->ga4_measurement_id : ($seo ? $seo->ga4_measurement_id : null),
                'gtm_connected' => !empty($int ? $int->gtm_container_id : ($seo ? $seo->gtm_container_id : null)),
                'gtm_id' => $int ? $int->gtm_container_id : ($seo ? $seo->gtm_container_id : null),
                'search_console_connected' => !empty($int ? $int->gsc_site_url : ($seo ? $seo->search_console_connected : false)),
                'gsc_site' => $int ? $int->gsc_site_url : null,
                'google_ads_connected' => ! empty($int ? $int->google_ads_customer_id : null),
                'ads_customer_id' => $int ? $int->google_ads_customer_id : null,
                'ads_account_name' => $int ? $int->google_ads_account_name : null,
                'ads_kpis' => is_array($int?->google_ads_snapshot) ? ($int->google_ads_snapshot['kpis'] ?? null) : null,
                'ads_campaigns_count' => is_array($int?->google_ads_snapshot)
                    ? count($int->google_ads_snapshot['campaigns'] ?? [])
                    : 0,
                'ads_last_error' => is_array($int?->google_ads_snapshot)
                    ? (($int->google_ads_snapshot['errors'][0] ?? null))
                    : null,
                'sync_status' => $int ? $int->sync_status : 'not_connected',
                'last_synced_at' => $int ? $int->last_synced_at : null,
            ];
        });

        return response()->json([
            'data' => $rows,
            'total_stores' => $stores->count(),
            'total_connected' => $rows->filter(fn ($r) => $r['is_connected'])->count(),
            'total_ads_linked' => $rows->filter(fn ($r) => $r['google_ads_connected'])->count(),
        ]);
    }
}
