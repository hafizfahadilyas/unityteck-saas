<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use App\Services\GoogleAdsService;
use App\Services\GoogleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleAdsController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        protected GoogleService $google,
        protected GoogleAdsService $ads,
    ) {}

    protected function integration(string $storeId): ?StoreGoogleIntegration
    {
        return StoreGoogleIntegration::query()->forStore($storeId)->first();
    }

    protected function requireAdsContext(Request $request): array|JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $integration = $this->integration($storeId);
        if (! $integration || ! $integration->is_connected) {
            return response()->json([
                'message' => 'Google is not connected for this store.',
                'connected' => false,
                'campaigns' => [],
                'kpis' => null,
            ], 422);
        }

        $customerId = (string) ($integration->google_ads_customer_id ?? '');
        if ($customerId === '') {
            return response()->json([
                'message' => 'No Google Ads account linked. Connect Google and select an Ads customer id.',
                'connected' => true,
                'ads_linked' => false,
                'campaigns' => [],
                'kpis' => null,
            ], 422);
        }

        $token = $this->google->getValidToken($integration);
        if (! $token) {
            return response()->json([
                'message' => 'Google token expired. Reconnect Google for this store.',
                'connected' => false,
            ], 401);
        }

        return [$storeId, $integration, $customerId, $token];
    }

    public function overview(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [$storeId, $integration, $customerId, $token] = $ctx;

        $refresh = $request->boolean('refresh', false);
        $snapshot = is_array($integration->google_ads_snapshot) ? $integration->google_ads_snapshot : null;

        if ($refresh || ! $snapshot) {
            $sync = $this->ads->syncIntegrationSnapshot($integration);
            if (! ($sync['ok'] ?? false)) {
                return response()->json([
                    'store_id' => $storeId,
                    'customer_id' => $customerId,
                    'connected' => true,
                    'ads_linked' => true,
                    'snapshot' => $snapshot,
                    'message' => $sync['error'] ?? 'Ads sync failed',
                    'geo_presets' => array_values(GoogleAdsService::GEO_PRESETS),
                ], 200);
            }
            $snapshot = $sync['snapshot'];
        }

        return response()->json([
            'store_id' => $storeId,
            'customer_id' => $customerId,
            'account_name' => $integration->google_ads_account_name,
            'connected' => true,
            'ads_linked' => true,
            'snapshot' => $snapshot,
            'geo_presets' => array_values(GoogleAdsService::GEO_PRESETS),
        ]);
    }

    public function campaigns(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [, , $customerId, $token] = $ctx;

        $res = $this->ads->listCampaigns($token, $customerId);

        return response()->json([
            'data' => $res['campaigns'] ?? [],
            'ok' => (bool) ($res['ok'] ?? false),
            'message' => $res['error'] ?? null,
        ], ($res['ok'] ?? false) ? 200 : 200);
    }

    public function adGroups(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [, , $customerId, $token] = $ctx;

        $res = $this->ads->listAdGroups($token, $customerId, $request->query('campaign_id'));

        return response()->json([
            'data' => $res['groups'] ?? [],
            'ok' => (bool) ($res['ok'] ?? false),
            'message' => $res['error'] ?? null,
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [, , $customerId, $token] = $ctx;

        $range = (string) $request->query('range', 'LAST_30_DAYS');
        $res = $this->ads->campaignPerformance($token, $customerId, $range);

        $cost = 0.0;
        $value = 0.0;
        foreach ($res['rows'] ?? [] as $row) {
            $cost += (float) ($row['cost'] ?? 0);
            $value += (float) ($row['conversions_value'] ?? 0);
        }

        return response()->json([
            'ok' => (bool) ($res['ok'] ?? false),
            'range' => $range,
            'rows' => $res['rows'] ?? [],
            'kpis' => [
                'cost' => round($cost, 2),
                'conversions_value' => round($value, 2),
                'roas' => $cost > 0 ? round($value / $cost, 2) : null,
            ],
            'message' => $res['error'] ?? null,
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [$storeId, $integration] = $ctx;

        $sync = $this->ads->syncIntegrationSnapshot($integration);

        return response()->json([
            'store_id' => $storeId,
            'ok' => (bool) ($sync['ok'] ?? false),
            'snapshot' => $sync['snapshot'] ?? $integration->google_ads_snapshot,
            'message' => $sync['error'] ?? null,
        ], ($sync['ok'] ?? false) ? 200 : 422);
    }

    public function storeCampaign(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [$storeId, $integration, $customerId, $token] = $ctx;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'daily_budget_sar' => ['required', 'numeric', 'min:1'],
            'status' => ['nullable', 'in:ENABLED,PAUSED'],
            'cities' => ['nullable', 'array'],
            'cities.*' => ['string'],
            'channel' => ['nullable', 'in:SEARCH,PERFORMANCE_MAX'],
            'final_url' => ['nullable', 'url', 'max:500'],
        ]);

        $channel = $validated['channel'] ?? 'SEARCH';
        if ($channel === 'PERFORMANCE_MAX') {
            $store = Store::find($storeId);
            $final = $validated['final_url'] ?? $this->google->resolveStorePublicBaseUrl($store);
            $res = $this->ads->createPerformanceMaxDraft($token, $customerId, [
                'name' => $validated['name'],
                'daily_budget_sar' => (float) $validated['daily_budget_sar'],
                'final_url' => $final ?: 'https://example.com',
            ]);
        } else {
            $res = $this->ads->createSearchCampaign($token, $customerId, $validated);
        }

        if ($res['ok'] ?? false) {
            $this->ads->syncIntegrationSnapshot($integration);
        }

        return response()->json($res, ($res['ok'] ?? false) ? 201 : 422);
    }

    public function updateCampaign(Request $request, string $campaignId): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [, $integration, $customerId, $token] = $ctx;

        $validated = $request->validate([
            'status' => ['nullable', 'in:ENABLED,PAUSED'],
            'daily_budget_sar' => ['nullable', 'numeric', 'min:1'],
            'budget_id' => ['nullable', 'string'],
            'cities' => ['nullable', 'array'],
        ]);

        $results = [];
        if (! empty($validated['status'])) {
            $results['status'] = $this->ads->updateCampaignStatus($token, $customerId, $campaignId, $validated['status']);
        }
        if (! empty($validated['daily_budget_sar']) && ! empty($validated['budget_id'])) {
            $results['budget'] = $this->ads->updateCampaignBudget(
                $token,
                $customerId,
                $validated['budget_id'],
                (float) $validated['daily_budget_sar']
            );
        }
        if (! empty($validated['cities'])) {
            $results['geo'] = $this->ads->attachGeoTargets($token, $customerId, $campaignId, $validated['cities']);
        }

        $ok = collect($results)->every(fn ($r) => ($r['ok'] ?? false) === true);
        if ($ok) {
            $this->ads->syncIntegrationSnapshot($integration);
        }

        return response()->json(['ok' => $ok, 'results' => $results], $ok ? 200 : 422);
    }

    public function recommendations(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [, , $customerId, $token] = $ctx;

        $res = $this->ads->listRecommendations($token, $customerId);

        return response()->json([
            'data' => $res['items'] ?? [],
            'ok' => (bool) ($res['ok'] ?? false),
            'message' => $res['error'] ?? null,
        ]);
    }

    public function uploadConversions(Request $request): JsonResponse
    {
        $ctx = $this->requireAdsContext($request);
        if ($ctx instanceof JsonResponse) {
            return $ctx;
        }
        [$storeId, , $customerId, $token] = $ctx;

        $validated = $request->validate([
            'conversion_action' => ['required', 'string', 'max:255'],
        ]);

        $res = $this->ads->uploadOrderConversions(
            $token,
            $customerId,
            $storeId,
            $validated['conversion_action']
        );

        return response()->json($res, ($res['ok'] ?? false) ? 200 : 422);
    }

    public function geoPresets(): JsonResponse
    {
        return response()->json(['data' => array_values(GoogleAdsService::GEO_PRESETS)]);
    }
}
