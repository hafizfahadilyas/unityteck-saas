<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
use App\Models\StoreGoogleIntegration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Real Google Ads API (v17) — store-scoped via StoreGoogleIntegration.google_ads_customer_id.
 * Never invents spend / ROAS. Empty → empty arrays / zeros.
 */
class GoogleAdsService
{
    public const API_VERSION = 'v17';

    /** KSA geo target constants (Google Ads Criterion IDs). */
    public const GEO_PRESETS = [
        'SA' => ['id' => '2524', 'name' => 'Saudi Arabia', 'name_ar' => 'المملكة العربية السعودية'],
        'Riyadh' => ['id' => '1026322', 'name' => 'Riyadh', 'name_ar' => 'الرياض'],
        'Jeddah' => ['id' => '1026324', 'name' => 'Jeddah', 'name_ar' => 'جدة'],
        'Makkah' => ['id' => '1026326', 'name' => 'Makkah', 'name_ar' => 'مكة المكرمة'],
        'Madinah' => ['id' => '1026328', 'name' => 'Madinah', 'name_ar' => 'المدينة المنورة'],
        'Dammam' => ['id' => '9047094', 'name' => 'Dammam', 'name_ar' => 'الدمام'],
        'Khobar' => ['id' => '9075990', 'name' => 'Khobar', 'name_ar' => 'الخبر'],
        'Qassim' => ['id' => '9075330', 'name' => 'Qassim', 'name_ar' => 'القصيم'],
        'Abha' => ['id' => '9075326', 'name' => 'Abha', 'name_ar' => 'أبها'],
    ];

    public function __construct(protected GoogleService $google) {}

    public function developerToken(): string
    {
        return (string) (config('services.google.ads_developer_token') ?: env('GOOGLE_ADS_DEVELOPER_TOKEN', ''));
    }

    public function loginCustomerId(): string
    {
        return preg_replace('/\D+/', '', (string) (config('services.google.ads_login_customer_id') ?: env('GOOGLE_ADS_LOGIN_CUSTOMER_ID', ''))) ?: '';
    }

    public function normalizeCustomerId(string $raw): string
    {
        return preg_replace('/\D+/', '', $raw) ?: '';
    }

    /**
     * @return array<string, string>
     */
    protected function headers(string $accessToken): array
    {
        $headers = [
            'Authorization' => 'Bearer '.$accessToken,
            'developer-token' => $this->developerToken(),
            'Content-Type' => 'application/json',
        ];
        $login = $this->loginCustomerId();
        if ($login !== '') {
            $headers['login-customer-id'] = $login;
        }

        return $headers;
    }

    protected function baseUrl(string $customerId): string
    {
        $id = $this->normalizeCustomerId($customerId);

        return 'https://googleads.googleapis.com/'.self::API_VERSION.'/customers/'.$id;
    }

    /**
     * GAQL searchStream — returns flat rows (results[].results[]).
     *
     * @return array{ok: bool, rows: array<int, array>, error?: string, raw_status?: int}
     */
    public function search(string $accessToken, string $customerId, string $query): array
    {
        $id = $this->normalizeCustomerId($customerId);
        if ($id === '' || $this->developerToken() === '') {
            return ['ok' => false, 'rows' => [], 'error' => 'Missing Ads customer id or developer token.'];
        }

        try {
            $res = Http::withHeaders($this->headers($accessToken))
                ->timeout(60)
                ->post($this->baseUrl($id).'/googleAds:searchStream', [
                    'query' => $query,
                ]);

            if (! $res->successful()) {
                Log::warning('Google Ads search failed: '.$res->body());

                return [
                    'ok' => false,
                    'rows' => [],
                    'error' => $this->friendlyError($res->json() ?? [], $res->body()),
                    'raw_status' => $res->status(),
                ];
            }

            $body = $res->json();
            $rows = [];
            if (is_array($body)) {
                foreach ($body as $batch) {
                    foreach (($batch['results'] ?? []) as $row) {
                        $rows[] = $row;
                    }
                }
            }

            return ['ok' => true, 'rows' => $rows];
        } catch (\Throwable $e) {
            Log::warning('Google Ads search exception: '.$e->getMessage());

            return ['ok' => false, 'rows' => [], 'error' => $e->getMessage()];
        }
    }

    /**
     * @param  array<int, array>  $operations
     * @return array{ok: bool, results?: array, error?: string}
     */
    public function mutate(string $accessToken, string $customerId, string $resource, array $operations): array
    {
        $id = $this->normalizeCustomerId($customerId);
        if ($id === '' || $operations === []) {
            return ['ok' => false, 'error' => 'Missing customer or operations.'];
        }

        try {
            $res = Http::withHeaders($this->headers($accessToken))
                ->timeout(60)
                ->post($this->baseUrl($id).'/'.$resource.':mutate', [
                    'operations' => $operations,
                ]);

            if (! $res->successful()) {
                Log::warning("Google Ads mutate {$resource} failed: ".$res->body());

                return ['ok' => false, 'error' => $this->friendlyError($res->json() ?? [], $res->body())];
            }

            return ['ok' => true, 'results' => $res->json('results') ?? []];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Full store Ads snapshot for DB + UI (campaigns, budgets, KPIs, recommendations).
     *
     * @return array<string, mixed>
     */
    public function buildSnapshot(string $accessToken, string $customerId, string $storeId): array
    {
        $campaigns = $this->listCampaigns($accessToken, $customerId);
        $report = $this->campaignPerformance($accessToken, $customerId, 'LAST_30_DAYS');
        $recommendations = $this->listRecommendations($accessToken, $customerId);

        $cost = 0.0;
        $impressions = 0;
        $clicks = 0;
        $conversions = 0.0;
        $convValue = 0.0;
        foreach ($report['rows'] as $r) {
            $cost += (float) ($r['cost'] ?? 0);
            $impressions += (int) ($r['impressions'] ?? 0);
            $clicks += (int) ($r['clicks'] ?? 0);
            $conversions += (float) ($r['conversions'] ?? 0);
            $convValue += (float) ($r['conversions_value'] ?? 0);
        }

        $roas = $cost > 0 ? round($convValue / $cost, 2) : null;

        return [
            'store_id' => $storeId,
            'customer_id' => $this->normalizeCustomerId($customerId),
            'synced_at' => now()->toIso8601String(),
            'source' => 'google_ads_api',
            'kpis' => [
                'cost' => round($cost, 2),
                'impressions' => $impressions,
                'clicks' => $clicks,
                'conversions' => round($conversions, 2),
                'conversions_value' => round($convValue, 2),
                'roas' => $roas,
                'currency' => 'SAR',
            ],
            'campaigns' => $campaigns['ok'] ? $campaigns['campaigns'] : [],
            'performance' => $report['ok'] ? $report['rows'] : [],
            'recommendations' => $recommendations['ok'] ? $recommendations['items'] : [],
            'geo_presets' => array_values(self::GEO_PRESETS),
            'errors' => array_values(array_filter([
                $campaigns['ok'] ? null : ($campaigns['error'] ?? 'campaigns'),
                $report['ok'] ? null : ($report['error'] ?? 'report'),
            ])),
        ];
    }

    /**
     * @return array{ok: bool, campaigns: array<int, array>, error?: string}
     */
    public function listCampaigns(string $accessToken, string $customerId): array
    {
        $q = <<<'GAQL'
SELECT
  campaign.id,
  campaign.name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign_budget.id,
  campaign_budget.amount_micros,
  campaign_budget.period,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value
FROM campaign
WHERE campaign.status != 'REMOVED'
ORDER BY campaign.id
GAQL;

        $res = $this->search($accessToken, $customerId, $q);
        if (! $res['ok']) {
            return ['ok' => false, 'campaigns' => [], 'error' => $res['error'] ?? 'search failed'];
        }

        $campaigns = [];
        foreach ($res['rows'] as $row) {
            $c = $row['campaign'] ?? [];
            $b = $row['campaignBudget'] ?? [];
            $m = $row['metrics'] ?? [];
            $cost = isset($m['costMicros']) ? ((float) $m['costMicros']) / 1_000_000 : 0.0;
            $budget = isset($b['amountMicros']) ? ((float) $b['amountMicros']) / 1_000_000 : null;
            $campaigns[] = [
                'id' => (string) ($c['id'] ?? ''),
                'name' => (string) ($c['name'] ?? ''),
                'status' => (string) ($c['status'] ?? ''),
                'channel' => (string) ($c['advertisingChannelType'] ?? ''),
                'budget_id' => isset($b['id']) ? (string) $b['id'] : null,
                'daily_budget' => $budget,
                'impressions' => (int) ($m['impressions'] ?? 0),
                'clicks' => (int) ($m['clicks'] ?? 0),
                'cost' => round($cost, 2),
                'conversions' => (float) ($m['conversions'] ?? 0),
                'conversions_value' => (float) ($m['conversionsValue'] ?? 0),
                'roas' => $cost > 0 ? round(((float) ($m['conversionsValue'] ?? 0)) / $cost, 2) : null,
            ];
        }

        return ['ok' => true, 'campaigns' => $campaigns];
    }

    /**
     * @return array{ok: bool, groups: array<int, array>, error?: string}
     */
    public function listAdGroups(string $accessToken, string $customerId, ?string $campaignId = null): array
    {
        $where = "ad_group.status != 'REMOVED'";
        if ($campaignId) {
            $cid = preg_replace('/\D+/', '', $campaignId);
            $where .= " AND campaign.id = {$cid}";
        }
        $q = "SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.campaign, campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ad_group WHERE {$where}";

        $res = $this->search($accessToken, $customerId, $q);
        if (! $res['ok']) {
            return ['ok' => false, 'groups' => [], 'error' => $res['error'] ?? 'search failed'];
        }

        $groups = [];
        foreach ($res['rows'] as $row) {
            $g = $row['adGroup'] ?? [];
            $c = $row['campaign'] ?? [];
            $m = $row['metrics'] ?? [];
            $groups[] = [
                'id' => (string) ($g['id'] ?? ''),
                'name' => (string) ($g['name'] ?? ''),
                'status' => (string) ($g['status'] ?? ''),
                'campaign_id' => (string) ($c['id'] ?? ''),
                'campaign_name' => (string) ($c['name'] ?? ''),
                'impressions' => (int) ($m['impressions'] ?? 0),
                'clicks' => (int) ($m['clicks'] ?? 0),
                'cost' => isset($m['costMicros']) ? round(((float) $m['costMicros']) / 1_000_000, 2) : 0,
            ];
        }

        return ['ok' => true, 'groups' => $groups];
    }

    /**
     * @return array{ok: bool, rows: array<int, array>, error?: string}
     */
    public function campaignPerformance(string $accessToken, string $customerId, string $dateRange = 'LAST_30_DAYS'): array
    {
        $allowed = ['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH'];
        if (! in_array($dateRange, $allowed, true)) {
            $dateRange = 'LAST_30_DAYS';
        }

        $q = <<<GAQL
SELECT
  campaign.id,
  campaign.name,
  metrics.impressions,
  metrics.clicks,
  metrics.cost_micros,
  metrics.conversions,
  metrics.conversions_value,
  metrics.ctr,
  metrics.average_cpc
FROM campaign
WHERE campaign.status != 'REMOVED'
  AND segments.date DURING {$dateRange}
GAQL;

        $res = $this->search($accessToken, $customerId, $q);
        if (! $res['ok']) {
            return ['ok' => false, 'rows' => [], 'error' => $res['error'] ?? 'search failed'];
        }

        $byCampaign = [];
        foreach ($res['rows'] as $row) {
            $c = $row['campaign'] ?? [];
            $m = $row['metrics'] ?? [];
            $id = (string) ($c['id'] ?? '');
            if ($id === '') {
                continue;
            }
            if (! isset($byCampaign[$id])) {
                $byCampaign[$id] = [
                    'campaign_id' => $id,
                    'name' => (string) ($c['name'] ?? ''),
                    'impressions' => 0,
                    'clicks' => 0,
                    'cost' => 0.0,
                    'conversions' => 0.0,
                    'conversions_value' => 0.0,
                ];
            }
            $byCampaign[$id]['impressions'] += (int) ($m['impressions'] ?? 0);
            $byCampaign[$id]['clicks'] += (int) ($m['clicks'] ?? 0);
            $byCampaign[$id]['cost'] += isset($m['costMicros']) ? ((float) $m['costMicros']) / 1_000_000 : 0;
            $byCampaign[$id]['conversions'] += (float) ($m['conversions'] ?? 0);
            $byCampaign[$id]['conversions_value'] += (float) ($m['conversionsValue'] ?? 0);
        }

        $rows = array_values(array_map(function ($r) {
            $r['cost'] = round($r['cost'], 2);
            $r['roas'] = $r['cost'] > 0 ? round($r['conversions_value'] / $r['cost'], 2) : null;

            return $r;
        }, $byCampaign));

        return ['ok' => true, 'rows' => $rows];
    }

    /**
     * Create Search campaign + budget (+ optional geo). Real Ads mutate only.
     *
     * @param  array{name: string, daily_budget_sar: float, status?: string, cities?: array<int, string>, final_url?: string}  $payload
     * @return array{ok: bool, campaign_id?: string, budget_id?: string, error?: string}
     */
    public function createSearchCampaign(string $accessToken, string $customerId, array $payload): array
    {
        $id = $this->normalizeCustomerId($customerId);
        $name = trim((string) ($payload['name'] ?? ''));
        $budgetSar = (float) ($payload['daily_budget_sar'] ?? 0);
        $status = strtoupper((string) ($payload['status'] ?? 'PAUSED'));
        if (! in_array($status, ['ENABLED', 'PAUSED'], true)) {
            $status = 'PAUSED';
        }
        if ($name === '' || $budgetSar < 1) {
            return ['ok' => false, 'error' => 'Campaign name and daily budget (min 1 SAR) required.'];
        }

        $budgetResource = "customers/{$id}/campaignBudgets/-1";
        $campaignResource = "customers/{$id}/campaigns/-2";

        $budgetOp = [
            'create' => [
                'resourceName' => $budgetResource,
                'name' => $name.' Budget '.now()->format('YmdHis'),
                'amountMicros' => (string) (int) round($budgetSar * 1_000_000),
                'deliveryMethod' => 'STANDARD',
                'explicitlyShared' => false,
            ],
        ];

        $budgetRes = $this->mutate($accessToken, $customerId, 'campaignBudgets', [$budgetOp]);
        if (! $budgetRes['ok']) {
            return ['ok' => false, 'error' => $budgetRes['error'] ?? 'Budget create failed'];
        }
        $budgetRn = (string) ($budgetRes['results'][0]['resourceName'] ?? '');
        if ($budgetRn === '') {
            return ['ok' => false, 'error' => 'Budget resource missing'];
        }

        $campaignOp = [
            'create' => [
                'name' => $name,
                'status' => $status,
                'advertisingChannelType' => 'SEARCH',
                'campaignBudget' => $budgetRn,
                'manualCpc' => new \stdClass,
                'networkSettings' => [
                    'targetGoogleSearch' => true,
                    'targetSearchNetwork' => true,
                    'targetContentNetwork' => false,
                ],
                'containsEuPoliticalAdvertising' => 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
            ],
        ];

        $campRes = $this->mutate($accessToken, $customerId, 'campaigns', [$campaignOp]);
        if (! $campRes['ok']) {
            return ['ok' => false, 'error' => $campRes['error'] ?? 'Campaign create failed'];
        }
        $campRn = (string) ($campRes['results'][0]['resourceName'] ?? '');
        $campaignId = $campRn !== '' ? basename($campRn) : null;

        $cities = $payload['cities'] ?? [];
        if (is_array($cities) && $cities !== [] && $campaignId) {
            $this->attachGeoTargets($accessToken, $customerId, $campaignId, $cities);
        }

        return [
            'ok' => true,
            'campaign_id' => $campaignId,
            'budget_id' => basename($budgetRn),
            'resource_name' => $campRn,
        ];
    }

    /**
     * Performance Max skeleton (PAUSED) — real mutate; assets must be completed in Google Ads UI.
     *
     * @param  array{name: string, daily_budget_sar: float, final_url: string}  $payload
     */
    public function createPerformanceMaxDraft(string $accessToken, string $customerId, array $payload): array
    {
        $id = $this->normalizeCustomerId($customerId);
        $name = trim((string) ($payload['name'] ?? ''));
        $budgetSar = (float) ($payload['daily_budget_sar'] ?? 0);
        $finalUrl = trim((string) ($payload['final_url'] ?? ''));
        if ($name === '' || $budgetSar < 1 || $finalUrl === '') {
            return ['ok' => false, 'error' => 'Name, budget, and final_url required for Performance Max draft.'];
        }

        $budgetOp = [
            'create' => [
                'name' => $name.' PMax Budget '.now()->format('YmdHis'),
                'amountMicros' => (string) (int) round($budgetSar * 1_000_000),
                'deliveryMethod' => 'STANDARD',
                'explicitlyShared' => false,
            ],
        ];
        $budgetRes = $this->mutate($accessToken, $customerId, 'campaignBudgets', [$budgetOp]);
        if (! $budgetRes['ok']) {
            return ['ok' => false, 'error' => $budgetRes['error'] ?? 'Budget failed'];
        }
        $budgetRn = (string) ($budgetRes['results'][0]['resourceName'] ?? '');

        $campaignOp = [
            'create' => [
                'name' => $name,
                'status' => 'PAUSED',
                'advertisingChannelType' => 'PERFORMANCE_MAX',
                'campaignBudget' => $budgetRn,
                'containsEuPoliticalAdvertising' => 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
                'urlExpansionOptOut' => false,
            ],
        ];
        $campRes = $this->mutate($accessToken, $customerId, 'campaigns', [$campaignOp]);
        if (! $campRes['ok']) {
            return ['ok' => false, 'error' => $campRes['error'] ?? 'PMax create failed — complete asset groups in Google Ads UI.'];
        }

        return [
            'ok' => true,
            'campaign_id' => basename((string) ($campRes['results'][0]['resourceName'] ?? '')),
            'budget_id' => basename($budgetRn),
            'note' => 'Performance Max created PAUSED. Add asset group + creatives in Google Ads to go live.',
            'final_url' => $finalUrl,
        ];
    }

    /**
     * @param  array<int, string>  $cities  keys from GEO_PRESETS
     */
    public function attachGeoTargets(string $accessToken, string $customerId, string $campaignId, array $cities): array
    {
        $id = $this->normalizeCustomerId($customerId);
        $cid = preg_replace('/\D+/', '', $campaignId);
        $ops = [];
        foreach ($cities as $city) {
            $key = is_string($city) ? $city : '';
            $preset = self::GEO_PRESETS[$key] ?? null;
            if (! $preset) {
                continue;
            }
            $ops[] = [
                'create' => [
                    'campaign' => "customers/{$id}/campaigns/{$cid}",
                    'location' => [
                        'geoTargetConstant' => 'geoTargetConstants/'.$preset['id'],
                    ],
                    'negative' => false,
                ],
            ];
        }
        if ($ops === []) {
            return ['ok' => true, 'attached' => 0];
        }

        $res = $this->mutate($accessToken, $customerId, 'campaignCriteria', $ops);

        return [
            'ok' => (bool) ($res['ok'] ?? false),
            'attached' => count($ops),
            'error' => $res['error'] ?? null,
        ];
    }

    public function updateCampaignStatus(string $accessToken, string $customerId, string $campaignId, string $status): array
    {
        $id = $this->normalizeCustomerId($customerId);
        $cid = preg_replace('/\D+/', '', $campaignId);
        $status = strtoupper($status);
        if (! in_array($status, ['ENABLED', 'PAUSED'], true)) {
            return ['ok' => false, 'error' => 'Status must be ENABLED or PAUSED'];
        }

        return $this->mutate($accessToken, $customerId, 'campaigns', [[
            'update' => [
                'resourceName' => "customers/{$id}/campaigns/{$cid}",
                'status' => $status,
            ],
            'updateMask' => 'status',
        ]]);
    }

    public function updateCampaignBudget(string $accessToken, string $customerId, string $budgetId, float $dailyBudgetSar): array
    {
        $id = $this->normalizeCustomerId($customerId);
        $bid = preg_replace('/\D+/', '', $budgetId);
        if ($dailyBudgetSar < 1) {
            return ['ok' => false, 'error' => 'Budget must be at least 1 SAR'];
        }

        return $this->mutate($accessToken, $customerId, 'campaignBudgets', [[
            'update' => [
                'resourceName' => "customers/{$id}/campaignBudgets/{$bid}",
                'amountMicros' => (string) (int) round($dailyBudgetSar * 1_000_000),
            ],
            'updateMask' => 'amountMicros',
        ]]);
    }

    /**
     * @return array{ok: bool, items: array<int, array>, error?: string}
     */
    public function listRecommendations(string $accessToken, string $customerId): array
    {
        $q = <<<'GAQL'
SELECT
  recommendation.resource_name,
  recommendation.type,
  recommendation.campaign,
  recommendation.campaign_budget
FROM recommendation
LIMIT 50
GAQL;

        $res = $this->search($accessToken, $customerId, $q);
        if (! $res['ok']) {
            return ['ok' => false, 'items' => [], 'error' => $res['error'] ?? 'recommendations failed'];
        }

        $items = [];
        foreach ($res['rows'] as $row) {
            $r = $row['recommendation'] ?? [];
            $items[] = [
                'resource_name' => (string) ($r['resourceName'] ?? ''),
                'type' => (string) ($r['type'] ?? ''),
                'campaign' => (string) ($r['campaign'] ?? ''),
            ];
        }

        return ['ok' => true, 'items' => $items];
    }

    /**
     * Upload offline click conversions for orders that have gclid (store-scoped).
     *
     * @return array{ok: bool, uploaded: int, skipped: int, error?: string}
     */
    public function uploadOrderConversions(
        string $accessToken,
        string $customerId,
        string $storeId,
        string $conversionActionResource,
    ): array {
        $orders = Order::query()
            ->forStore($storeId)
            ->where('status', '!=', 'cancelled')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        $conversions = [];
        $skipped = 0;
        foreach ($orders as $order) {
            $gclid = $this->extractGclid($order);
            if ($gclid === null) {
                $skipped++;
                continue;
            }
            $conversions[] = [
                'gclid' => $gclid,
                'conversionAction' => $conversionActionResource,
                'conversionDateTime' => optional($order->created_at)->timezone('Asia/Riyadh')->format('Y-m-d H:i:sP')
                    ?? now('Asia/Riyadh')->format('Y-m-d H:i:sP'),
                'conversionValue' => (float) ($order->total_amount ?? 0),
                'currencyCode' => 'SAR',
                'orderId' => (string) ($order->order_number ?? $order->id),
            ];
        }

        if ($conversions === []) {
            return ['ok' => true, 'uploaded' => 0, 'skipped' => $skipped];
        }

        try {
            $id = $this->normalizeCustomerId($customerId);
            $res = Http::withHeaders($this->headers($accessToken))
                ->timeout(60)
                ->post($this->baseUrl($id).':uploadClickConversions', [
                    'conversions' => $conversions,
                    'partialFailure' => true,
                ]);

            if (! $res->successful()) {
                return [
                    'ok' => false,
                    'uploaded' => 0,
                    'skipped' => $skipped,
                    'error' => $this->friendlyError($res->json() ?? [], $res->body()),
                ];
            }

            return ['ok' => true, 'uploaded' => count($conversions), 'skipped' => $skipped];
        } catch (\Throwable $e) {
            return ['ok' => false, 'uploaded' => 0, 'skipped' => $skipped, 'error' => $e->getMessage()];
        }
    }

    protected function extractGclid(Order $order): ?string
    {
        $hay = strtolower(trim(
            (string) ($order->source_details ?? '').' '.
            (string) ($order->utm_content ?? '').' '.
            (string) ($order->utm_term ?? '').' '.
            json_encode($order->meta ?? [])
        ));
        if (preg_match('/gclid[=:\s]+([a-zA-Z0-9_-]+)/', $hay, $m)) {
            return $m[1];
        }
        if (! empty($order->gclid)) {
            return (string) $order->gclid;
        }

        return null;
    }

    public function syncIntegrationSnapshot(StoreGoogleIntegration $integration): array
    {
        $storeId = (string) $integration->store_id;
        $customerId = (string) ($integration->google_ads_customer_id ?? '');
        if ($customerId === '') {
            return ['ok' => false, 'error' => 'Store has no Google Ads customer id.'];
        }

        $token = $this->google->getValidToken($integration);
        if (! $token) {
            return ['ok' => false, 'error' => 'Google token missing or expired. Reconnect Google.'];
        }

        $snapshot = $this->buildSnapshot($token, $customerId, $storeId);
        $integration->update([
            'google_ads_snapshot' => $snapshot,
            'last_synced_at' => now(),
        ]);

        return ['ok' => true, 'snapshot' => $snapshot];
    }

    /**
     * @param  array<mixed>  $json
     */
    protected function friendlyError(array $json, string $rawBody): string
    {
        $msg = $json['error']['message']
            ?? $json['error']['details'][0]['errors'][0]['message']
            ?? null;
        if (is_string($msg) && $msg !== '') {
            if (str_contains(strtolower($msg), 'developer token') || str_contains(strtolower($msg), 'test account')) {
                return $msg.' — Apply for Production access in Google Ads API Center (manager account).';
            }

            return $msg;
        }

        return substr($rawBody, 0, 400) ?: 'Google Ads API error';
    }
}
