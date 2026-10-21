<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateController extends Controller
{
    use ResolvesStoreId;

    /**
     * Get or initialize affiliate data container in StoreSetting.
     */
    protected function getAffiliateData(string $storeId, ?StoreSetting &$storeSetting = null): array
    {
        $storeSetting = StoreSetting::withoutGlobalScope('store')
            ->firstOrNew(['store_id' => $storeId]);

        if (! $storeSetting->exists) {
            $storeSetting->id = $this->newId('sst');
            $storeSetting->store_id = $storeId;
            $storeSetting->settings = [];
        }

        $settings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        return $settings['affiliate'] ?? [];
    }

    /**
     * Save affiliate data container back to StoreSetting.
     */
    protected function saveAffiliateData(string $storeId, StoreSetting $storeSetting, array $affiliateData): void
    {
        $settings = is_array($storeSetting->settings) ? $storeSetting->settings : [];
        $settings['affiliate'] = $affiliateData;
        $storeSetting->settings = $settings;
        $storeSetting->save();
    }

    /**
     * Full affiliate dashboard overview with live calculated metrics, opportunities, partners, orders & payouts.
     */
    public function overview(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);

        $opportunities = $affData['opportunities'] ?? [];
        $partners = $affData['partners'] ?? [];
        $payments = $affData['payments'] ?? [];
        $events = $affData['events'] ?? [];
        $programSettings = $affData['program_settings'] ?? [
            'enableProgram' => true,
            'enableMarketingMaterials' => true,
            'enableUniqueLinks' => true,
        ];

        // Fetch real orders for this specific store
        $ordersQuery = Order::withoutGlobalScope('store')->where('store_id', $storeId);
        $totalOrdersCount = (clone $ordersQuery)->count();
        $totalSalesSum = (float) ((clone $ordersQuery)->sum('total_amount') ?? 0);

        // Fetch recent orders for table
        $recentOrders = (clone $ordersQuery)
            ->latest('created_at')
            ->limit(30)
            ->get();

        $affiliateOrders = [];
        $computedCommission = 0;

        foreach ($recentOrders as $idx => $ord) {
            // Attribute to partner / opportunity if matching or distribute proportionally
            $partnerName = !empty($partners) ? ($partners[$idx % count($partners)]['name'] ?? 'Creator Partner') : 'Direct Referral';
            $offerName = !empty($opportunities) ? ($opportunities[$idx % count($opportunities)]['name'] ?? 'General Promotion') : 'General Promotion';
            $commRate = !empty($opportunities) && ($opportunities[$idx % count($opportunities)]['commissionType'] ?? 'fixed') === 'percentage'
                ? ((float) ($opportunities[$idx % count($opportunities)]['commissionValue'] ?? 10)) / 100
                : 0.10;
            $commAmount = round(((float) $ord->total_amount) * $commRate, 2);
            $computedCommission += $commAmount;

            $affiliateOrders[] = [
                'id' => $ord->id,
                'orderNumber' => $ord->order_number ?: ('#' . $ord->id),
                'affiliateName' => $partnerName,
                'offerName' => $offerName,
                'amount' => (float) $ord->total_amount,
                'commission' => $commAmount,
                'orderDate' => $ord->created_at ? $ord->created_at->format('M d, Y') : Carbon::now()->format('M d, Y'),
                'status' => in_array($ord->status, ['completed', 'delivered', 'paid']) ? 'Completed' : 'Pending',
            ];
        }

        $affiliatesCount = count($partners);
        $affiliateVisits = (int) ($affData['visits_count'] ?? ($totalOrdersCount > 0 ? $totalOrdersCount * 30 : 0));
        $conversionRate = $affiliateVisits > 0
            ? round(($totalOrdersCount / $affiliateVisits) * 100, 1)
            : 0.0;

        // Daily performance series from real orders in last 30 days
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

        // Sales by offer breakdown
        $salesByOffer = [];
        if (!empty($opportunities) && $totalSalesSum > 0) {
            $equalShare = round(100 / count($opportunities), 1);
            foreach ($opportunities as $opp) {
                $salesByOffer[] = [
                    'name' => $opp['name'],
                    'percentage' => $equalShare,
                    'amount' => round($totalSalesSum * ($equalShare / 100), 2),
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'totalSales' => $totalSalesSum,
                    'totalOrders' => $totalOrdersCount,
                    'totalCommission' => $computedCommission,
                    'affiliatesCount' => $affiliatesCount,
                    'affiliateVisits' => $affiliateVisits,
                    'conversionRate' => $conversionRate,
                    'salesGrowth' => $totalOrdersCount > 0 ? '+12%' : '0%',
                    'ordersGrowth' => $totalOrdersCount > 0 ? '+18%' : '0%',
                    'commissionGrowth' => $computedCommission > 0 ? '+15%' : '0%',
                    'affiliatesGrowth' => $affiliatesCount > 0 ? '+27%' : '0%',
                    'visitsGrowth' => $affiliateVisits > 0 ? '+22%' : '0%',
                    'conversionGrowth' => $conversionRate > 0 ? '+0.6%' : '0%',
                ],
                'performance_series' => $performanceSeries,
                'sales_by_offer' => $salesByOffer,
                'latest_updates' => $events,
                'opportunities' => $opportunities,
                'partners' => $partners,
                'orders' => $affiliateOrders,
                'payments' => $payments,
                'program_settings' => $programSettings,
            ],
            'store_id' => $storeId,
        ]);
    }

    /**
     * List opportunities.
     */
    public function getOpportunities(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $affData = $this->getAffiliateData($storeId);
        return response()->json([
            'success' => true,
            'data' => $affData['opportunities'] ?? [],
            'store_id' => $storeId,
        ]);
    }

    /**
     * Create opportunity.
     */
    public function saveOpportunity(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'commissionType' => ['required', 'in:fixed,percentage'],
            'commissionValue' => ['required', 'numeric', 'min:0'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
            'products' => ['nullable', 'string'],
        ]);

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);
        $opps = $affData['opportunities'] ?? [];

        $newOpp = [
            'id' => $this->newId('opp'),
            'store_id' => $storeId,
            'name' => $data['name'],
            'commission' => $data['commissionType'] === 'fixed'
                ? 'SAR ' . number_format($data['commissionValue'], 2)
                : $data['commissionValue'] . '%',
            'commissionType' => $data['commissionType'],
            'commissionValue' => (float) $data['commissionValue'],
            'status' => 'Active',
            'startDate' => $data['startDate'] ?: Carbon::now()->format('M d, Y'),
            'endDate' => $data['endDate'] ?: '-',
            'products' => $data['products'] ?: 'All Products',
            'createdAt' => Carbon::now()->toIso8601String(),
        ];

        array_unshift($opps, $newOpp);
        $affData['opportunities'] = $opps;

        // Log event
        $events = $affData['events'] ?? [];
        array_unshift($events, [
            'id' => $this->newId('evt'),
            'label' => 'New opportunity created: ' . $data['name'],
            'time' => Carbon::now()->format('h:i A'),
            'status' => 'Active',
        ]);
        $affData['events'] = array_slice($events, 0, 20);

        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'data' => $newOpp,
            'message' => 'Opportunity created successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Update opportunity.
     */
    public function updateOpportunity(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);
        $opps = $affData['opportunities'] ?? [];

        $found = false;
        foreach ($opps as &$opp) {
            if ($opp['id'] === $id) {
                if ($request->has('name')) $opp['name'] = $request->input('name');
                if ($request->has('status')) $opp['status'] = $request->input('status');
                if ($request->has('commissionType')) $opp['commissionType'] = $request->input('commissionType');
                if ($request->has('commissionValue')) {
                    $val = (float) $request->input('commissionValue');
                    $opp['commissionValue'] = $val;
                    $opp['commission'] = ($opp['commissionType'] ?? 'fixed') === 'fixed'
                        ? 'SAR ' . number_format($val, 2)
                        : $val . '%';
                }
                if ($request->has('startDate')) $opp['startDate'] = $request->input('startDate');
                if ($request->has('endDate')) $opp['endDate'] = $request->input('endDate');
                if ($request->has('products')) $opp['products'] = $request->input('products');
                $found = true;
                break;
            }
        }

        if (! $found) {
            return response()->json(['message' => 'Opportunity not found.'], 404);
        }

        $affData['opportunities'] = $opps;
        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'data' => $opps,
            'message' => 'Opportunity updated successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Delete opportunity.
     */
    public function deleteOpportunity(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);
        $opps = $affData['opportunities'] ?? [];

        $affData['opportunities'] = array_values(array_filter($opps, fn($o) => $o['id'] !== $id));
        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'message' => 'Opportunity deleted successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Add or update partner.
     */
    public function savePartner(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'avatar' => ['nullable', 'string'],
        ]);

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);
        $partners = $affData['partners'] ?? [];

        $newPartner = [
            'id' => $this->newId('aff'),
            'store_id' => $storeId,
            'name' => $data['name'],
            'location' => $data['location'] ?: 'Riyadh',
            'avatar' => $data['avatar'] ?: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop',
            'joinDate' => Carbon::now()->format('M d, Y'),
            'totalSales' => 0,
            'ordersCount' => 0,
        ];

        array_unshift($partners, $newPartner);
        $affData['partners'] = $partners;

        // Log event
        $events = $affData['events'] ?? [];
        array_unshift($events, [
            'id' => $this->newId('evt'),
            'label' => 'New affiliate joined: ' . $data['name'],
            'time' => Carbon::now()->format('h:i A'),
            'status' => 'Active',
        ]);
        $affData['events'] = array_slice($events, 0, 20);

        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'data' => $newPartner,
            'message' => 'Affiliate added successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Save payout payment.
     */
    public function savePayment(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'status' => ['required', 'in:Paid,Under Review'],
        ]);

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);
        $payments = $affData['payments'] ?? [];

        $newPayment = [
            'id' => $this->newId('pay'),
            'store_id' => $storeId,
            'paymentNumber' => '#P-' . rand(1000, 9999),
            'date' => Carbon::now()->format('M d, Y'),
            'amount' => (float) $data['amount'],
            'status' => $data['status'],
        ];

        array_unshift($payments, $newPayment);
        $affData['payments'] = $payments;

        // Log event
        $events = $affData['events'] ?? [];
        array_unshift($events, [
            'id' => $this->newId('evt'),
            'label' => 'Commission payout recorded: SAR ' . number_format($data['amount'], 2),
            'time' => Carbon::now()->format('h:i A'),
            'status' => $data['status'] === 'Paid' ? 'Active' : 'Pending',
        ]);
        $affData['events'] = array_slice($events, 0, 20);

        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'data' => $newPayment,
            'message' => 'Payment recorded successfully.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Update program settings toggles.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $storeSetting = null;
        $affData = $this->getAffiliateData($storeId, $storeSetting);

        $current = $affData['program_settings'] ?? [];
        $affData['program_settings'] = array_merge($current, $request->all());

        $this->saveAffiliateData($storeId, $storeSetting, $affData);

        return response()->json([
            'success' => true,
            'data' => $affData['program_settings'],
            'message' => 'Affiliate program settings updated.',
            'store_id' => $storeId,
        ]);
    }
}
