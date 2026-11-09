<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\LoyaltyPointTransaction;
use App\Models\Order;
use App\Models\StoreSetting;
use App\Services\Loyalty\LoyaltyPointsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class LoyaltyController extends Controller
{
    use ResolvesStoreId;

    public function __construct(private LoyaltyPointsService $loyalty)
    {
    }

    /**
     * Get or initialize loyalty data in StoreSetting.
     */
    protected function getLoyaltyData(string $storeId, ?StoreSetting &$storeSetting = null): array
    {
        $program = $this->loyalty->loadProgram($storeId);
        $storeSetting = $program['storeSetting'];

        return $program['loyalty'];
    }

    /**
     * Save loyalty data back to StoreSetting.
     */
    protected function saveLoyaltyData(string $storeId, StoreSetting $storeSetting, array $loyaltyData): void
    {
        $settings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $settings['loyalty'] = $loyaltyData;
        $storeSetting->settings = $settings;
        $storeSetting->save();
    }

    /**
     * Full loyalty dashboard overview with live calculated metrics, rules, rewards, and activity.
     */
    public function overview(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);

        $earnRules = LoyaltyPointsService::mergeEarnRules(
            is_array($loyaltyData['earn_rules'] ?? null) ? $loyaltyData['earn_rules'] : []
        );
        // Keep stored rules in sync with canonical trigger set
        if (($loyaltyData['earn_rules'] ?? null) !== $earnRules) {
            $loyaltyData['earn_rules'] = $earnRules;
            $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);
        }

        $rewards = $loyaltyData['rewards'] ?? [];
        $redemptions = $loyaltyData['redemptions'] ?? [];
        $activities = $loyaltyData['activities'] ?? [];
        $programSettings = $loyaltyData['settings'] ?? [
            'enableLoyalty' => true,
            'appNotifications' => true,
            'emailNotifications' => true,
            'pointsExpiration' => false,
        ];
        $gameSettings = LoyaltyPointsService::mergeGameSettings(
            is_array($loyaltyData['game_settings'] ?? null) ? $loyaltyData['game_settings'] : []
        );

        $customersCount = Customer::withoutGlobalScope('store')->where('store_id', $storeId)->count();

        $from = $request->query('from')
            ? Carbon::parse((string) $request->query('from'))->startOfDay()
            : Carbon::now()->subDays(30)->startOfDay();
        $to = $request->query('to')
            ? Carbon::parse((string) $request->query('to'))->endOfDay()
            : Carbon::now()->endOfDay();

        $pointsIssued = 0;
        $pointsRedeemed = 0;
        $ledgerReady = Schema::hasTable('loyalty_point_transactions');

        if ($ledgerReady) {
            $pointsIssued = (int) LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->where('transaction_type', 'credit')
                ->where('points_delta', '>', 0)
                ->whereBetween('created_at', [$from, $to])
                ->sum('points_delta');

            $pointsRedeemed = (int) abs((float) LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->whereIn('transaction_type', ['debit', 'reversal'])
                ->where('points_delta', '<', 0)
                ->whereBetween('created_at', [$from, $to])
                ->sum('points_delta'));
        }

        foreach ($redemptions as $red) {
            $createdAt = isset($red['createdAt']) ? Carbon::parse($red['createdAt']) : null;
            if ($createdAt && ($createdAt->lt($from) || $createdAt->gt($to))) {
                continue;
            }
            $pointsRedeemed += (int) ($red['points'] ?? 0);
        }

        $ordersFromPoints = 0;
        if ($ledgerReady) {
            $ordersFromPoints = (int) LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->where('transaction_type', 'debit')
                ->whereNotNull('order_id')
                ->whereBetween('created_at', [$from, $to])
                ->selectRaw('COUNT(DISTINCT order_id) as c')
                ->value('c');
        }
        if ($ordersFromPoints === 0 && is_array($redemptions)) {
            $ordersFromPoints = count(array_filter($redemptions, function ($red) use ($from, $to) {
                if (empty($red['order_id']) && empty($red['orderId'])) {
                    return false;
                }
                if (! isset($red['createdAt'])) {
                    return true;
                }
                $createdAt = Carbon::parse($red['createdAt']);

                return $createdAt->greaterThanOrEqualTo($from) && $createdAt->lessThanOrEqualTo($to);
            }));
        }

        $loyaltyAttributedSales = 0.0;
        if ($ordersFromPoints > 0 && ! empty($redemptions)) {
            $orderIds = [];
            foreach ($redemptions as $red) {
                $oid = $red['order_id'] ?? $red['orderId'] ?? null;
                if ($oid) {
                    $orderIds[] = (string) $oid;
                }
            }
            if ($orderIds !== []) {
                $loyaltyAttributedSales = (float) Order::withoutGlobalScope('store')
                    ->where('store_id', $storeId)
                    ->whereIn('id', array_unique($orderIds))
                    ->sum('total_amount');
            }
        }

        $periodSales = (float) Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereBetween('created_at', [$from, $to])
            ->sum('total_amount');

        $contributionToSales = $periodSales > 0 && $loyaltyAttributedSales > 0
            ? round(($loyaltyAttributedSales / $periodSales) * 100, 1)
            : 0;

        $dailyOrders = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders_count, SUM(total_amount) as sales_sum')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $performanceSeries = [];
        foreach ($dailyOrders as $day) {
            $performanceSeries[] = [
                'date' => Carbon::parse($day->date)->format('M d'),
                'sales' => (float) $day->sales_sum,
                'orders' => (int) $day->orders_count,
            ];
        }

        // Real points usage by reward type from redemptions (empty → empty, never invent %)
        $usageByType = [];
        $typeTotals = [];
        $typePointsSum = 0;
        foreach ($redemptions as $red) {
            $type = (string) ($red['rewardType'] ?? $red['type'] ?? 'other');
            $pts = (int) ($red['points'] ?? 0);
            $typeTotals[$type] = ($typeTotals[$type] ?? 0) + $pts;
            $typePointsSum += $pts;
        }
        if ($typePointsSum > 0) {
            foreach ($typeTotals as $name => $pts) {
                $usageByType[] = [
                    'name' => $name,
                    'percentage' => round(($pts / $typePointsSum) * 100, 1),
                ];
            }
        }

        // Recent ledger activity (real), fall back to stored activity log only
        if ($ledgerReady) {
            $ledgerActs = LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(function (LoyaltyPointTransaction $tx) {
                    $sign = $tx->points_delta >= 0 ? '+' : '';

                    return [
                        'id' => $tx->id,
                        'label' => trim(($tx->reason ?: ($tx->method ?? 'points')).' ('.$sign.$tx->points_delta.')'),
                        'time' => optional($tx->created_at)->format('h:i A') ?? '',
                        'status' => $tx->transaction_type === 'credit' ? 'Earned' : 'Redeemed',
                        'method' => $tx->method,
                        'points' => $tx->points_delta,
                        'createdAt' => optional($tx->created_at)->toIso8601String(),
                    ];
                })
                ->all();
            if ($ledgerActs !== []) {
                $activities = $ledgerActs;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'contributionToSales' => $contributionToSales.'%',
                    'ordersFromPoints' => $ordersFromPoints,
                    'totalRedeemed' => $pointsRedeemed,
                    'pointsIssued' => $pointsIssued,
                    'registeredCustomers' => $customersCount,
                    // No invented growth — empty when no prior-period comparison yet
                    'salesGrowth' => '—',
                    'ordersGrowth' => '—',
                    'redeemedGrowth' => '—',
                    'pointsGrowth' => '—',
                    'customersStatus' => $customersCount > 0 ? 'Active' : 'Inactive',
                ],
                'earn_rules' => $earnRules,
                'rewards' => $rewards,
                'redemptions' => $redemptions,
                'activities' => $activities,
                'performance_series' => $performanceSeries,
                'usage_by_type' => $usageByType,
                'settings' => $programSettings,
                'game_settings' => $gameSettings,
            ],
            'store_id' => $storeId,
        ]);
    }

    /**
     * Add a new loyalty reward.
     */
    public function saveReward(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'points' => ['required', 'integer', 'min:1'],
            'rewardType' => ['nullable', 'string'],
        ]);

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);
        $rewards = $loyaltyData['rewards'] ?? [];

        $newReward = [
            'id' => $this->newId('rew'),
            'store_id' => $storeId,
            'nameEn' => $data['name'],
            'nameAr' => $data['name'],
            'points' => (int) $data['points'],
            'rewardType' => $data['rewardType'] ?? 'discount',
            'status' => 'active',
            'createdAt' => Carbon::now()->toIso8601String(),
        ];

        array_unshift($rewards, $newReward);
        $loyaltyData['rewards'] = $rewards;

        $activities = $loyaltyData['activities'] ?? [];
        array_unshift($activities, [
            'id' => $this->newId('act'),
            'label' => 'New reward created: '.$data['name'],
            'time' => Carbon::now()->format('h:i A'),
            'status' => 'Active',
        ]);
        $loyaltyData['activities'] = array_slice($activities, 0, 20);

        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'data' => $newReward,
            'message' => 'Reward created successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Delete a reward.
     */
    public function deleteReward(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);
        $rewards = $loyaltyData['rewards'] ?? [];

        $loyaltyData['rewards'] = array_values(array_filter($rewards, fn ($r) => ($r['id'] ?? '') !== $id));
        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'message' => 'Reward deleted successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Update earn rule (toggle, points, and method-specific config).
     */
    public function updateEarnRule(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'active' => ['sometimes', 'boolean'],
            'points' => ['sometimes', 'integer', 'min:0'],
            'config' => ['sometimes', 'array'],
            'config.points_per_sar' => ['sometimes', 'numeric', 'min:0'],
            'config.qualifying_statuses' => ['sometimes', 'array'],
            'config.product_ids' => ['sometimes', 'array'],
            'config.product_ids.*' => ['string', 'max:64'],
            'config.mode' => ['sometimes', 'string', 'in:double,fixed'],
            'config.fixed_points_per_unit' => ['sometimes', 'integer', 'min:0'],
            'config.threshold_sar' => ['sometimes', 'numeric', 'min:0'],
            'config.bonus_points' => ['sometimes', 'integer', 'min:0'],
            'config.points' => ['sometimes', 'integer', 'min:0'],
            'config.require_verified' => ['sometimes', 'boolean'],
            'config.require_approval' => ['sometimes', 'boolean'],
            'config.within_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
        ]);

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);
        $rules = LoyaltyPointsService::mergeEarnRules(
            is_array($loyaltyData['earn_rules'] ?? null) ? $loyaltyData['earn_rules'] : []
        );

        $found = false;
        foreach ($rules as &$rule) {
            if (($rule['id'] ?? '') === $id) {
                if (array_key_exists('active', $data)) {
                    $rule['active'] = (bool) $data['active'];
                }
                if (array_key_exists('points', $data)) {
                    $rule['points'] = (int) $data['points'];
                }
                if (isset($data['config']) && is_array($data['config'])) {
                    $rule['config'] = array_merge(
                        is_array($rule['config'] ?? null) ? $rule['config'] : [],
                        $data['config']
                    );
                    // Keep top-level points in sync with common config.points
                    if (isset($data['config']['points'])) {
                        $rule['points'] = (int) $data['config']['points'];
                    }
                    if (isset($data['config']['bonus_points'])) {
                        $rule['points'] = (int) $data['config']['bonus_points'];
                    }
                    if (isset($data['config']['points_per_sar'])) {
                        $rule['points'] = (int) $data['config']['points_per_sar'];
                    }
                }
                $found = true;
                break;
            }
        }
        unset($rule);

        if (! $found) {
            return response()->json(['message' => 'Earn rule not found.'], 404);
        }

        $loyaltyData['earn_rules'] = $rules;
        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'data' => $rules,
            'message' => 'Earn rule updated successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Save program settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);

        $validated = $request->validate([
            'enableLoyalty' => ['sometimes', 'boolean'],
            'appNotifications' => ['sometimes', 'boolean'],
            'emailNotifications' => ['sometimes', 'boolean'],
            'pointsExpiration' => ['sometimes', 'boolean'],
            'game_settings' => ['sometimes', 'array'],
            'game_settings.gameEnabled' => ['sometimes', 'boolean'],
            'game_settings.storefrontDockEnabled' => ['sometimes', 'boolean'],
            'game_settings.coinsPerSar' => ['sometimes', 'integer', 'min:1', 'max:1000'],
            'game_settings.minSpinCoins' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'game_settings.maxSpinCoins' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'game_settings.spinCooldownHours' => ['sometimes', 'integer', 'min:1', 'max:168'],
            'game_settings.cardPaymentBonusCoins' => ['sometimes', 'integer', 'min:0', 'max:5000'],
            'game_settings.signupLocationBonusCoins' => ['sometimes', 'integer', 'min:0', 'max:5000'],
        ]);

        $current = is_array($loyaltyData['settings'] ?? null) ? $loyaltyData['settings'] : [];
        $programKeys = ['enableLoyalty', 'appNotifications', 'emailNotifications', 'pointsExpiration'];
        $programPatch = array_intersect_key($validated, array_flip($programKeys));
        $loyaltyData['settings'] = array_merge($current, $programPatch);

        if (isset($validated['game_settings']) && is_array($validated['game_settings'])) {
            $loyaltyData['game_settings'] = LoyaltyPointsService::mergeGameSettings(
                array_merge(
                    is_array($loyaltyData['game_settings'] ?? null) ? $loyaltyData['game_settings'] : [],
                    $validated['game_settings']
                )
            );
        }

        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $loyaltyData['settings'],
                'game_settings' => LoyaltyPointsService::mergeGameSettings(
                    is_array($loyaltyData['game_settings'] ?? null) ? $loyaltyData['game_settings'] : []
                ),
            ],
            'message' => 'Loyalty program settings updated.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Customer loyalty balance + recent credits (store_id isolated).
     * Used by storefront gift popup + profile points.
     */
    public function customerSummary(Request $request, string $customerId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $customer = Customer::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $customerId)
            ->first();
        if (! $customer) {
            return response()->json(['message' => 'Customer not found for this store.'], 404);
        }

        $points = 0;
        if (Schema::hasTable('customer_wallets')) {
            $wallet = \App\Models\CustomerWallet::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $customerId)
                ->first();
            $points = $wallet ? (int) $wallet->loyalty_points : 0;
        }

        $recent = [];
        if (Schema::hasTable('loyalty_point_transactions')) {
            $recent = LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $customerId)
                ->where('transaction_type', 'credit')
                ->where('points_delta', '>', 0)
                ->orderByDesc('created_at')
                ->limit(10)
                ->get()
                ->map(static function (LoyaltyPointTransaction $tx) {
                    return [
                        'id' => $tx->id,
                        'points' => (int) $tx->points_delta,
                        'method' => $tx->method,
                        'reason' => $tx->reason,
                        'source_event_id' => $tx->source_event_id,
                        'created_at' => optional($tx->created_at)?->toIso8601String(),
                    ];
                })
                ->all();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'loyalty_points' => $points,
                'recent_credits' => $recent,
            ],
            'store_id' => $storeId,
            'customer_id' => $customerId,
        ]);
    }

    /**
     * Public storefront balance (no merchant session) — store_id + customer_id only.
     */
    public function storefrontBalance(Request $request, string $storeId): JsonResponse
    {
        $customerId = trim((string) $request->query('customer_id', ''));
        if ($customerId === '') {
            return response()->json(['message' => 'customer_id is required.'], 422);
        }

        $customer = Customer::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $customerId)
            ->first();
        if (! $customer) {
            return response()->json([
                'success' => true,
                'data' => ['loyalty_points' => 0, 'recent_credits' => []],
                'store_id' => $storeId,
                'customer_id' => $customerId,
            ]);
        }

        $points = 0;
        if (Schema::hasTable('customer_wallets')) {
            $wallet = \App\Models\CustomerWallet::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $customerId)
                ->first();
            $points = $wallet ? (int) $wallet->loyalty_points : 0;
        }

        $recent = [];
        if (Schema::hasTable('loyalty_point_transactions')) {
            $recent = LoyaltyPointTransaction::query()
                ->where('store_id', $storeId)
                ->where('customer_id', $customerId)
                ->where('transaction_type', 'credit')
                ->where('points_delta', '>', 0)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(static function (LoyaltyPointTransaction $tx) {
                    return [
                        'id' => $tx->id,
                        'points' => (int) $tx->points_delta,
                        'method' => $tx->method,
                        'reason' => $tx->reason,
                        'source_event_id' => $tx->source_event_id,
                        'created_at' => optional($tx->created_at)?->toIso8601String(),
                    ];
                })
                ->all();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'loyalty_points' => $points,
                'recent_credits' => $recent,
            ],
            'store_id' => $storeId,
            'customer_id' => $customerId,
        ]);
    }

    /**
     * Admin/storefront Daily Spin — credits real loyalty_points (store_id isolated).
     */
    public function dailySpin(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'customer_id' => ['required', 'string', 'max:64'],
        ]);

        $result = $this->loyalty->awardDailySpin($storeId, (string) $data['customer_id']);
        if (! ($result['ok'] ?? false)) {
            $code = ($result['message'] ?? '') === 'cooldown_active' ? 429 : 422;

            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'spin_failed',
                'next_spin_at' => $result['next_spin_at'] ?? null,
                'store_id' => $storeId,
            ], $code);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'points' => $result['points'] ?? 0,
                'next_spin_at' => $result['next_spin_at'] ?? null,
                'transaction' => $result['transaction'] ?? null,
            ],
            'store_id' => $storeId,
        ]);
    }

    /**
     * One-time Saved Card payment bonus.
     */
    public function awardSavedCardBonus(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'customer_id' => ['required', 'string', 'max:64'],
            'order_id' => ['nullable', 'string', 'max:64'],
        ]);

        $result = $this->loyalty->awardSavedCardBonus(
            $storeId,
            (string) $data['customer_id'],
            isset($data['order_id']) ? (string) $data['order_id'] : null
        );

        if (! ($result['ok'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'bonus_failed',
                'store_id' => $storeId,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => ['points' => $result['points'] ?? 0],
            'store_id' => $storeId,
        ]);
    }

    /**
     * One-time Location & Push permission bonus.
     */
    public function awardLocationPushBonus(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'customer_id' => ['required', 'string', 'max:64'],
        ]);

        $result = $this->loyalty->awardLocationPushBonus($storeId, (string) $data['customer_id']);
        if (! ($result['ok'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'bonus_failed',
                'store_id' => $storeId,
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => ['points' => $result['points'] ?? 0],
            'store_id' => $storeId,
        ]);
    }
}
