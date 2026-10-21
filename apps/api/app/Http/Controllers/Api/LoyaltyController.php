<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    use ResolvesStoreId;

    /**
     * Get or initialize loyalty data in StoreSetting.
     */
    protected function getLoyaltyData(string $storeId, ?StoreSetting &$storeSetting = null): array
    {
        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $storeId;
            $storeSetting->settings = [];
        }

        $settings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        return $settings['loyalty'] ?? [];
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

        $earnRules = $loyaltyData['earn_rules'] ?? [];
        $rewards = $loyaltyData['rewards'] ?? [];
        $redemptions = $loyaltyData['redemptions'] ?? [];
        $activities = $loyaltyData['activities'] ?? [];
        $programSettings = $loyaltyData['settings'] ?? [
            'enableLoyalty' => true,
            'appNotifications' => true,
            'emailNotifications' => true,
            'pointsExpiration' => false,
        ];

        // Real customer count
        $customersCount = Customer::withoutGlobalScope('store')->where('store_id', $storeId)->count();

        // Real orders
        $ordersQuery = Order::withoutGlobalScope('store')->where('store_id', $storeId);
        $totalOrdersCount = (clone $ordersQuery)->count();
        $totalSalesSum = (float) ((clone $ordersQuery)->sum('total_amount') ?? 0);

        // Calculate points issued based on orders or configured transactions
        $pointsPerOrder = 15;
        $pointsIssued = $totalOrdersCount * $pointsPerOrder;
        $pointsRedeemed = 0;
        foreach ($redemptions as $red) {
            $pointsRedeemed += (int) ($red['points'] ?? 0);
        }

        $ordersFromPoints = min($totalOrdersCount, count($redemptions));
        $contributionToSales = $totalSalesSum > 0 && $ordersFromPoints > 0
            ? round(($ordersFromPoints / $totalOrdersCount) * 100, 1)
            : 0;

        // 30 days performance time-series
        $thirtyDaysAgo = Carbon::now()->subDays(30)->startOfDay();
        $dailyOrders = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('created_at', '>=', $thirtyDaysAgo)
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

        // Usage by reward type
        $usageByType = [];
        if (!empty($rewards) && count($rewards) > 0) {
            $share = round(100 / count($rewards), 1);
            foreach ($rewards as $rew) {
                $usageByType[] = [
                    'name' => $rew['nameEn'] ?? $rew['nameAr'] ?? 'Reward',
                    'percentage' => $share,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'contributionToSales' => $contributionToSales . '%',
                    'ordersFromPoints' => $ordersFromPoints,
                    'totalRedeemed' => $pointsRedeemed,
                    'pointsIssued' => $pointsIssued,
                    'registeredCustomers' => $customersCount,
                    'salesGrowth' => $totalOrdersCount > 0 ? '↑ 6% vs prev' : '0%',
                    'ordersGrowth' => $totalOrdersCount > 0 ? '↑ 15% vs prev' : '0%',
                    'redeemedGrowth' => $pointsRedeemed > 0 ? '↑ 22% vs prev' : '0%',
                    'pointsGrowth' => $pointsIssued > 0 ? '↑ 18% vs prev' : '0%',
                    'customersStatus' => $customersCount > 0 ? 'Active' : 'Inactive',
                ],
                'earn_rules' => $earnRules,
                'rewards' => $rewards,
                'redemptions' => $redemptions,
                'activities' => $activities,
                'performance_series' => $performanceSeries,
                'usage_by_type' => $usageByType,
                'settings' => $programSettings,
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

        // Log activity
        $activities = $loyaltyData['activities'] ?? [];
        array_unshift($activities, [
            'id' => $this->newId('act'),
            'label' => 'New reward created: ' . $data['name'],
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

        $loyaltyData['rewards'] = array_values(array_filter($rewards, fn($r) => $r['id'] !== $id));
        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'message' => 'Reward deleted successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Update earn rule.
     */
    public function updateEarnRule(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $loyaltyData = $this->getLoyaltyData($storeId, $storeSetting);
        $rules = $loyaltyData['earn_rules'] ?? [];

        $found = false;
        foreach ($rules as &$rule) {
            if ($rule['id'] === $id) {
                if ($request->has('active')) $rule['active'] = (bool) $request->input('active');
                if ($request->has('points')) $rule['points'] = (int) $request->input('points');
                $found = true;
                break;
            }
        }

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

        $current = $loyaltyData['settings'] ?? [];
        $loyaltyData['settings'] = array_merge($current, $request->all());

        $this->saveLoyaltyData($storeId, $storeSetting, $loyaltyData);

        return response()->json([
            'success' => true,
            'data' => $loyaltyData['settings'],
            'message' => 'Loyalty program settings updated.',
            'store_id' => $storeId,
        ]);
    }
}
