<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcquisitionChannel;
use App\Models\Order;
use App\Models\SeoConfig;
use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use App\Services\GoogleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GoogleIntegrationController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        protected GoogleService $googleService
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
        $authUrl = $this->googleService->getAuthUrl($storeId, $redirectUri);
        $clientId = $this->googleService->getClientId();

        return response()->json([
            'auth_url' => $authUrl,
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'scopes' => GoogleService::SCOPES,
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
            $tokenData = $this->googleService->exchangeCode($code, $redirectUri);
            if ($tokenData && isset($tokenData['access_token'])) {
                $accessToken = $tokenData['access_token'];
                $refreshToken = $tokenData['refresh_token'] ?? null;
                $expiresIn = $tokenData['expires_in'] ?? 3600;
            }
        } elseif ($directAccessToken) {
            // Direct token from Google Identity Services
            $accessToken = $directAccessToken;
            $expiresIn = (int) ($request->input('expires_in') ?: 3600);
            $refreshToken = $request->input('refresh_token');
        }

        if (!$accessToken) {
            return response()->json([
                'error' => 'Could not obtain Google access token. Please verify authorization code.',
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

        // Discover available properties
        $ga4Properties = $this->googleService->discoverAnalyticsProperties($accessToken);
        $gscSites = $this->googleService->discoverSearchConsoleProperties($accessToken);
        $gtmContainers = $this->googleService->discoverTagManagerContainers($accessToken);
        $adsAccounts = $this->googleService->discoverGoogleAdsAccounts($accessToken);

        // Auto-select best matches if store has a domain
        $store = Store::find($storeId);
        $storeSlug = $store ? $store->slug : '';

        return response()->json([
            'message' => 'Google account connected successfully',
            'integration' => $integration->fresh(),
            'discovered_properties' => [
                'analytics' => $ga4Properties,
                'search_console' => $gscSites,
                'tag_manager' => $gtmContainers,
                'google_ads' => $adsAccounts,
            ],
            'auto_selection' => [
                'suggested_ga4' => !empty($ga4Properties) ? $ga4Properties[0]['propertyId'] : null,
                'suggested_gsc' => !empty($gscSites) ? $gscSites[0]['siteUrl'] : null,
                'suggested_gtm' => !empty($gtmContainers) ? $gtmContainers[0]['containerId'] : null,
                'suggested_ads' => !empty($adsAccounts) ? $adsAccounts[0]['customerId'] : null,
            ],
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

        $integration = StoreGoogleIntegration::query()->forStore($storeId)->firstOrFail();
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
            $seo->search_console_tag = "google-site-verification={$storeId}-verified";
        }
        $seo->save();

        // Perform initial sync in background / response
        return response()->json([
            'message' => 'Google properties successfully saved',
            'integration' => $integration->fresh(),
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

        $token = $this->googleService->getValidToken($integration);
        $integration->update(['sync_status' => 'syncing']);

        $store = Store::find($storeId);
        $storeUrl = $store && $store->custom_domain
            ? "https://{$store->custom_domain}"
            : "https://" . ($store ? $store->slug : 'demo') . ".saasdomain.com";

        try {
            // 1. Sync GA4 Report if configured
            $analyticsSnapshot = null;
            if ($token && $integration->ga4_property_id) {
                $analyticsSnapshot = $this->googleService->fetchAnalyticsReport(
                    $token,
                    $integration->ga4_property_id
                );
                $realtimeUsers = $this->googleService->fetchAnalyticsRealtime(
                    $token,
                    $integration->ga4_property_id
                );
                $analyticsSnapshot['realtimeUsers'] = $realtimeUsers;
            }

            // 2. Sync Search Console if configured
            $searchConsoleSnapshot = null;
            if ($token && $integration->gsc_site_url) {
                $searchConsoleSnapshot = $this->googleService->fetchSearchConsolePerformance(
                    $token,
                    $integration->gsc_site_url
                );
            }

            // 3. Sync Real PageSpeed Mobile & Desktop
            $psiMobile = $this->googleService->runPageSpeedAudit($storeUrl, 'mobile');
            $psiDesktop = $this->googleService->runPageSpeedAudit($storeUrl, 'desktop');

            // Save snapshots to integration
            $integration->update([
                'sync_status' => 'synced',
                'last_synced_at' => now(),
                'last_error' => null,
                'analytics_snapshot' => $analyticsSnapshot ?: $integration->analytics_snapshot,
                'search_console_snapshot' => $searchConsoleSnapshot ?: $integration->search_console_snapshot,
                'pagespeed_mobile_snapshot' => $psiMobile ?: $integration->pagespeed_mobile_snapshot,
                'pagespeed_desktop_snapshot' => $psiDesktop ?: $integration->pagespeed_desktop_snapshot,
            ]);

            // Sync Search Console metrics into SeoConfig
            if ($searchConsoleSnapshot && !empty($searchConsoleSnapshot['queries'])) {
                $seo = SeoConfig::withoutGlobalScope('store')->firstOrNew(['store_id' => $storeId]);
                $topQueries = array_slice(array_map(function ($q) {
                    return [
                        'query' => $q['keys'][0] ?? 'keyword',
                        'clicks' => (int) ($q['clicks'] ?? 0),
                        'impressions' => (int) ($q['impressions'] ?? 0),
                        'position' => round($q['position'] ?? 0, 1),
                    ];
                }, $searchConsoleSnapshot['queries']), 0, 10);

                $totalClicks = array_sum(array_column($searchConsoleSnapshot['dates'] ?? [], 'clicks'));
                $totalImpressions = array_sum(array_column($searchConsoleSnapshot['dates'] ?? [], 'impressions'));
                $avgCtr = $totalImpressions > 0 ? round(($totalClicks / $totalImpressions) * 100, 1) : 0;

                $extra = $seo->extra ?: [];
                $extra['total_search_clicks'] = $totalClicks;
                $extra['total_search_impressions'] = $totalImpressions;
                $extra['avg_ctr'] = $avgCtr;
                $extra['top_queries'] = $topQueries;
                $extra['last_indexing_ping'] = now()->toDateTimeString();

                $seo->extra = $extra;
                $seo->save();
            }

            return response()->json([
                'message' => 'Real Google data synced successfully',
                'last_synced_at' => now()->toIso8601String(),
                'integration' => $integration->fresh(),
            ]);
        } catch (\Throwable $e) {
            $integration->update([
                'sync_status' => 'error',
                'last_error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
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
     * Get Real PageSpeed & Core Web Vitals
     */
    public function getPageSpeed(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $strategy = $request->query('strategy', 'mobile');
        $integration = StoreGoogleIntegration::query()->forStore($storeId)->first();

        $snapshot = $strategy === 'desktop'
            ? ($integration ? $integration->pagespeed_desktop_snapshot : null)
            : ($integration ? $integration->pagespeed_mobile_snapshot : null);

        // If not tested yet or refresh requested, run audit
        if (!$snapshot || $request->boolean('refresh')) {
            $store = Store::find($storeId);
            $targetUrl = $store && $store->custom_domain
                ? "https://{$store->custom_domain}"
                : "https://" . ($store ? $store->slug : 'demo') . ".saasdomain.com";

            $newAudit = $this->googleService->runPageSpeedAudit($targetUrl, $strategy);
            if ($newAudit && $integration) {
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
                'google_ads_connected' => !empty($int ? $int->google_ads_customer_id : null),
                'ads_customer_id' => $int ? $int->google_ads_customer_id : null,
                'sync_status' => $int ? $int->sync_status : 'not_connected',
                'last_synced_at' => $int ? $int->last_synced_at : null,
            ];
        });

        return response()->json([
            'data' => $rows,
            'total_stores' => $stores->count(),
            'total_connected' => $rows->filter(fn($r) => $r['is_connected'])->count(),
        ]);
    }
}
