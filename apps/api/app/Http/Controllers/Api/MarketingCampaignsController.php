<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\StorefrontAnalyticsEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MarketingCampaignsController extends Controller
{
    use ResolvesStoreId;

    /**
     * Standard channel definitions matching requirements & reference screenshot
     */
    protected array $channelDefinitions = [
        [
            'key' => 'direct',
            'name' => 'Direct Visit',
            'name_ar' => 'زيارة مباشرة',
            'type' => 'Direct',
            'type_ar' => 'مباشر',
            'icon' => 'Link2',
            'color' => '#f59e0b',
            'matcher' => ['direct', 'none', 'self'],
        ],
        [
            'key' => 'whatsapp',
            'name' => 'WhatsApp',
            'name_ar' => 'واتساب',
            'type' => 'Social Media',
            'type_ar' => 'وسائل التواصل',
            'icon' => 'MessageCircle',
            'color' => '#10b981',
            'matcher' => ['whatsapp', 'wa.me', 'wa'],
        ],
        [
            'key' => 'instagram',
            'name' => 'Instagram',
            'name_ar' => 'انستغرام',
            'type' => 'Social Media',
            'type_ar' => 'وسائل التواصل',
            'icon' => 'Instagram',
            'color' => '#ec4899',
            'matcher' => ['instagram', 'ig', 'insta'],
        ],
        [
            'key' => 'tiktok_organic',
            'name' => 'TikTok (Organic)',
            'name_ar' => 'تيك توك (عضوي)',
            'type' => 'Social Media',
            'type_ar' => 'وسائل التواصل',
            'icon' => 'Music',
            'color' => '#0f172a',
            'matcher' => ['tiktok_organic', 'tiktok organic'],
        ],
        [
            'key' => 'tiktok_ads',
            'name' => 'TikTok Ads',
            'name_ar' => 'إعلانات تيك توك',
            'type' => 'Paid Ads',
            'type_ar' => 'إعلانات مدفوعة',
            'icon' => 'Music',
            'color' => '#1e293b',
            'matcher' => ['tiktok', 'tiktok_ads', 'tiktok ads', 'bytedance'],
        ],
        [
            'key' => 'google_ads',
            'name' => 'Google Ads',
            'name_ar' => 'إعلانات Google',
            'type' => 'Paid Ads',
            'type_ar' => 'إعلانات مدفوعة',
            'icon' => 'Globe',
            'color' => '#2563eb',
            'matcher' => ['google ads', 'google_ads', 'adwords', 'cpc', 'google_cpc'],
        ],
        [
            'key' => 'organic_search',
            'name' => 'Organic Search',
            'name_ar' => 'البحث العضوي',
            'type' => 'Organic',
            'type_ar' => 'بحث عضوي',
            'icon' => 'Search',
            'color' => '#059669',
            'matcher' => ['organic search', 'organic', 'search', 'seo'],
        ],
        [
            'key' => 'snapchat',
            'name' => 'Snapchat',
            'name_ar' => 'سناب شات',
            'type' => 'Social Media',
            'type_ar' => 'وسائل التواصل',
            'icon' => 'Share2',
            'color' => '#eab308',
            'matcher' => ['snapchat', 'snap', 'snap_ads'],
        ],
        [
            'key' => 'facebook',
            'name' => 'Facebook',
            'name_ar' => 'فيسبوك',
            'type' => 'Social Media',
            'type_ar' => 'وسائل التواصل',
            'icon' => 'Share2',
            'color' => '#3b82f6',
            'matcher' => ['facebook', 'fb', 'meta'],
        ],
        [
            'key' => 'referral',
            'name' => 'Referral',
            'name_ar' => 'إحالات',
            'type' => 'Referral',
            'type_ar' => 'إحالة',
            'icon' => 'Link2',
            'color' => '#8b5cf6',
            'matcher' => ['referral', 'ref', 'affiliate'],
        ],
    ];

    /**
     * Get Marketing Channels Overview with real database metrics
     */
    public function overview(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        // Determine date range
        $period = $request->query('period', '30d');
        $now = Carbon::now()->endOfDay();

        if ($request->filled('from') && $request->filled('to')) {
            try {
                $startDate = Carbon::parse($request->query('from'))->startOfDay();
                $endDate = Carbon::parse($request->query('to'))->endOfDay();
            } catch (\Throwable $e) {
                $startDate = Carbon::now()->subDays(30)->startOfDay();
                $endDate = $now;
            }
        } else {
            $startDate = match ($period) {
                '7d' => Carbon::now()->subDays(7)->startOfDay(),
                'this_month' => Carbon::now()->startOfMonth(),
                'prev_month' => Carbon::now()->subMonth()->startOfMonth(),
                default => Carbon::now()->subDays(30)->startOfDay(),
            };
            $endDate = match ($period) {
                'prev_month' => Carbon::now()->subMonth()->endOfMonth(),
                default => $now,
            };
        }

        $daysDiff = max(1, (int) $endDate->diffInDays($startDate));
        $prevStartDate = (clone $startDate)->subDays($daysDiff);
        $prevEndDate = (clone $startDate)->subSecond();

        // 1. Fetch current orders for store in date range
        $currentOrders = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        // 2. Fetch previous period orders for comparison
        $prevOrders = Order::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereBetween('created_at', [$prevStartDate, $prevEndDate])
            ->get();

        // 3. Public storefront events only (never admin / AcquisitionChannel seed counters)
        $eventVisitsByChannel = $this->publicStorefrontVisitsByChannel($storeId, $startDate, $endDate);
        $eventCartByChannel = $this->publicStorefrontCartByChannel($storeId, $startDate, $endDate);
        $prevEventVisitsByChannel = $this->publicStorefrontVisitsByChannel($storeId, $prevStartDate, $prevEndDate);

        // Total metrics across all orders
        $totalOrdersCount = $currentOrders->count();
        $totalRevenueSum = (float) $currentOrders->sum('total_amount');
        $prevOrdersCount = $prevOrders->count();
        $prevRevenueSum = (float) $prevOrders->sum('total_amount');

        // Channel grouping logic
        $classifiedOrders = [];
        $prevClassifiedOrders = [];

        foreach ($currentOrders as $order) {
            $matchedKey = $this->matchChannelKey($order->source, $order->medium, $order->campaign);
            if (! isset($classifiedOrders[$matchedKey])) {
                $classifiedOrders[$matchedKey] = [];
            }
            $classifiedOrders[$matchedKey][] = $order;
        }

        foreach ($prevOrders as $order) {
            $matchedKey = $this->matchChannelKey($order->source, $order->medium, $order->campaign);
            if (! isset($prevClassifiedOrders[$matchedKey])) {
                $prevClassifiedOrders[$matchedKey] = [];
            }
            $prevClassifiedOrders[$matchedKey][] = $order;
        }

        // Build list of channels
        $channelsData = [];
        $totalVisitsSum = 0;
        $totalAddToCartSum = 0;

        foreach ($this->channelDefinitions as $def) {
            $key = $def['key'];
            $ordersInChannel = $classifiedOrders[$key] ?? [];
            $prevOrdersInChannel = $prevClassifiedOrders[$key] ?? [];

            $ordersCount = count($ordersInChannel);
            $revenue = (float) array_reduce($ordersInChannel, fn($sum, $o) => $sum + (float) $o->total_amount, 0);

            $prevOrdersCountCh = count($prevOrdersInChannel);
            $prevRevenueCh = (float) array_reduce($prevOrdersInChannel, fn($sum, $o) => $sum + (float) $o->total_amount, 0);

            // Visits / cart from public storefront_analytics_events only
            $visits = max(0, (int) ($eventVisitsByChannel[$key] ?? 0));
            $addToCart = max(0, (int) ($eventCartByChannel[$key] ?? 0));

            $totalVisitsSum += $visits;
            $totalAddToCartSum += $addToCart;

            $conversionRate = $visits > 0 ? round(($ordersCount / $visits) * 100, 1) : 0.0;
            $aov = $ordersCount > 0 ? round($revenue / $ordersCount, 2) : 0.0;

            $growth = 0.0;
            if ($prevRevenueCh > 0) {
                $growth = round((($revenue - $prevRevenueCh) / $prevRevenueCh) * 100, 1);
            } elseif ($revenue > 0) {
                $growth = 100.0;
            }

            $trendSparkline = $this->buildChannelSparkline($ordersInChannel, $startDate, $endDate, $visits);

            $channelsData[] = [
                'id' => 'ch_' . $key,
                'key' => $key,
                'name' => $def['name'],
                'name_ar' => $def['name_ar'],
                'type' => $def['type'],
                'type_ar' => $def['type_ar'],
                'icon' => $def['icon'],
                'color' => $def['color'],
                'visits' => $visits,
                'add_to_cart' => $addToCart,
                'completed_orders' => $ordersCount,
                'conversion_rate' => $conversionRate,
                'revenue' => $revenue,
                'aov' => $aov,
                'growth' => $growth,
                'trend_sparkline' => $trendSparkline,
                'roas' => null,
                'is_connected' => $ordersCount > 0 || $visits > 0,
            ];
        }

        $overallConversionRate = $totalVisitsSum > 0 ? round(($totalOrdersCount / $totalVisitsSum) * 100, 1) : 0.0;
        $overallAov = $totalOrdersCount > 0 ? round($totalRevenueSum / $totalOrdersCount, 2) : 0.0;

        $ordersGrowth = $prevOrdersCount > 0
            ? round((($totalOrdersCount - $prevOrdersCount) / $prevOrdersCount) * 100, 1)
            : ($totalOrdersCount > 0 ? 100.0 : 0.0);
        $revenueGrowth = $prevRevenueSum > 0
            ? round((($totalRevenueSum - $prevRevenueSum) / $prevRevenueSum) * 100, 1)
            : ($totalRevenueSum > 0 ? 100.0 : 0.0);
        $prevVisitsSum = (int) array_sum($prevEventVisitsByChannel);
        $visitsGrowth = $prevVisitsSum > 0
            ? round((($totalVisitsSum - $prevVisitsSum) / $prevVisitsSum) * 100, 1)
            : ($totalVisitsSum > 0 ? null : 0.0);
        $convGrowth = 0.0;
        $cartGrowth = 0.0;
        $prevAov = $prevOrdersCount > 0 ? round($prevRevenueSum / $prevOrdersCount, 2) : 0.0;
        $aovGrowth = $prevAov > 0
            ? round((($overallAov - $prevAov) / $prevAov) * 100, 1)
            : ($overallAov > 0 ? 100.0 : 0.0);

        $visitsTrend = $this->buildPublicVisitsTrendSeries($storeId, $startDate, $endDate);

        $ordersByChannel = array_map(fn ($c) => [
            'name' => $c['name'],
            'name_ar' => $c['name_ar'],
            'orders' => $c['completed_orders'],
            'color' => $c['color'],
        ], $channelsData);

        // Ads platforms stay Not Connected until a real integration exists (zero-mock)
        $integrations = [
            ['id' => 'google_ads', 'name' => 'Google Ads', 'icon' => 'Google', 'last_synced' => null, 'status' => 'Not Connected', 'connected' => false],
            ['id' => 'tiktok_ads', 'name' => 'TikTok Ads', 'icon' => 'Music', 'last_synced' => null, 'status' => 'Not Connected', 'connected' => false],
            ['id' => 'meta', 'name' => 'Meta', 'icon' => 'Share2', 'last_synced' => null, 'status' => 'Not Connected', 'connected' => false],
            ['id' => 'snapchat', 'name' => 'Snapchat', 'icon' => 'Share2', 'last_synced' => null, 'status' => 'Not Connected', 'connected' => false],
            ['id' => 'whatsapp', 'name' => 'WhatsApp', 'icon' => 'MessageCircle', 'last_synced' => null, 'status' => 'Not Connected', 'connected' => false],
        ];

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'period' => [
                'from' => $startDate->toDateString(),
                'to' => $endDate->toDateString(),
                'label' => $startDate->format('M j, Y') . ' - ' . $endDate->format('M j, Y'),
            ],
            'kpis' => [
                'completed_orders' => [
                    'value' => $totalOrdersCount,
                    'growth' => ($ordersGrowth >= 0 ? '↑ ' : '↓ ') . abs($ordersGrowth) . '%',
                    'growth_value' => $ordersGrowth,
                    'label' => 'vs previous period',
                ],
                'revenue' => [
                    'value' => $totalRevenueSum,
                    'growth' => ($revenueGrowth >= 0 ? '↑ ' : '↓ ') . abs($revenueGrowth) . '%',
                    'growth_value' => $revenueGrowth,
                    'label' => 'vs previous period',
                ],
                'total_visits' => [
                    'value' => $totalVisitsSum,
                    'growth' => $visitsGrowth === null
                        ? '—'
                        : (($visitsGrowth >= 0 ? '↑ ' : '↓ ') . abs($visitsGrowth) . '%'),
                    'growth_value' => $visitsGrowth,
                    'label' => 'vs previous period',
                ],
                'conversion_rate' => [
                    'value' => $overallConversionRate,
                    'formatted' => $overallConversionRate . '%',
                    'growth' => ($convGrowth >= 0 ? '↑ ' : '↓ ') . abs($convGrowth) . '%',
                    'growth_value' => $convGrowth,
                    'label' => 'vs previous period',
                ],
                'add_to_cart' => [
                    'value' => $totalAddToCartSum,
                    'growth' => ($cartGrowth >= 0 ? '↑ ' : '↓ ') . abs($cartGrowth) . '%',
                    'growth_value' => $cartGrowth,
                    'label' => 'vs previous period',
                ],
                'average_order_value' => [
                    'value' => $overallAov,
                    'growth' => ($aovGrowth >= 0 ? '↑ ' : '↓ ') . abs($aovGrowth) . '%',
                    'growth_value' => $aovGrowth,
                    'label' => 'vs previous period',
                ],
            ],
            'channels' => $channelsData,
            'totals' => [
                'visits' => $totalVisitsSum,
                'add_to_cart' => $totalAddToCartSum,
                'completed_orders' => $totalOrdersCount,
                'conversion_rate' => $overallConversionRate,
                'revenue' => $totalRevenueSum,
                'aov' => $overallAov,
                'growth' => $revenueGrowth,
            ],
            'visits_trend' => $visitsTrend,
            'orders_by_channel' => $ordersByChannel,
            'integrations' => $integrations,
        ]);
    }

    /**
     * Map order source string to standard channel key
     */
    protected function matchChannelKey(?string $source, ?string $medium, ?string $campaign): string
    {
        $text = strtolower(trim(($source ?? '') . ' ' . ($medium ?? '') . ' ' . ($campaign ?? '')));
        if (empty($text)) {
            return 'direct';
        }

        foreach ($this->channelDefinitions as $def) {
            foreach ($def['matcher'] as $match) {
                if (str_contains($text, $match)) {
                    return $def['key'];
                }
            }
        }

        return 'direct';
    }

    /**
     * Build honest 5-point sparkline for a channel based on orders
     */
    protected function buildChannelSparkline(array $orders, Carbon $startDate, Carbon $endDate, int $visits): array
    {
        if (empty($orders) && $visits === 0) {
            return [0, 0, 0, 0, 0];
        }

        $count = count($orders);
        if ($count === 0) {
            return [0, 0, 0, 0, 0];
        }

        // Divide period into 5 buckets
        $bucketDuration = max(1, (int) ($endDate->diffInDays($startDate) / 5));
        $points = [0, 0, 0, 0, 0];

        foreach ($orders as $order) {
            $created = Carbon::parse($order->created_at);
            $dayOffset = (int) $created->diffInDays($startDate);
            $bucketIdx = min(4, max(0, (int) floor($dayOffset / $bucketDuration)));
            $points[$bucketIdx] += (float) $order->total_amount;
        }

        $max = max($points);
        if ($max > 0) {
            return array_map(fn ($v) => round(($v / $max) * 100, 1), $points);
        }

        return [0, 0, 0, 0, 0];
    }

    /**
     * Public storefront page_view sessions grouped by marketing channel key.
     *
     * @return array<string, int>
     */
    protected function publicStorefrontVisitsByChannel(string $storeId, Carbon $from, Carbon $to): array
    {
        if (! Schema::hasTable('storefront_analytics_events')) {
            return [];
        }

        $rows = StorefrontAnalyticsEvent::query()
            ->forStore($storeId)
            ->publicStorefront()
            ->where('event_name', 'page_view')
            ->whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("COALESCE(NULLIF(TRIM(source), ''), 'Direct') as src"),
                DB::raw("COUNT(DISTINCT CASE WHEN session_key IS NOT NULL AND session_key != '' THEN session_key END) as sessions"),
                DB::raw("SUM(CASE WHEN session_key IS NULL OR session_key = '' THEN 1 ELSE 0 END) as orphans")
            )
            ->groupBy('src')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $key = $this->matchChannelKey((string) $row->src, null, null);
            $visits = max(0, (int) ($row->sessions ?? 0) + (int) ($row->orphans ?? 0));
            $out[$key] = ($out[$key] ?? 0) + $visits;
        }

        return $out;
    }

    /**
     * @return array<string, int>
     */
    protected function publicStorefrontCartByChannel(string $storeId, Carbon $from, Carbon $to): array
    {
        if (! Schema::hasTable('storefront_analytics_events')) {
            return [];
        }

        $rows = StorefrontAnalyticsEvent::query()
            ->forStore($storeId)
            ->publicStorefront()
            ->where('event_name', 'add_to_cart')
            ->whereBetween('created_at', [$from, $to])
            ->select(
                DB::raw("COALESCE(NULLIF(TRIM(source), ''), 'Direct') as src"),
                DB::raw('COUNT(*) as c')
            )
            ->groupBy('src')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $key = $this->matchChannelKey((string) $row->src, null, null);
            $out[$key] = ($out[$key] ?? 0) + max(0, (int) ($row->c ?? 0));
        }

        return $out;
    }

    /**
     * Real public storefront visit trend — never invent curves from orders.
     */
    protected function buildPublicVisitsTrendSeries(string $storeId, Carbon $startDate, Carbon $endDate): array
    {
        $prevStart = (clone $startDate)->subDays(max(1, (int) $endDate->diffInDays($startDate)));

        $bucket = function (Carbon $from, Carbon $to) use ($storeId): array {
            $days = max(1, (int) $from->diffInDays($to));
            $points = 7;
            $step = max(1, (int) ceil($days / $points));
            $series = [];
            for ($i = 0; $i < $points; $i++) {
                $bucketStart = (clone $from)->addDays($i * $step)->startOfDay();
                $bucketEnd = (clone $bucketStart)->addDays($step)->endOfDay();
                if ($bucketEnd->gt($to)) {
                    $bucketEnd = clone $to;
                }
                $value = 0;
                if (Schema::hasTable('storefront_analytics_events')) {
                    $q = StorefrontAnalyticsEvent::query()
                        ->forStore($storeId)
                        ->publicStorefront()
                        ->where('event_name', 'page_view')
                        ->whereBetween('created_at', [$bucketStart, $bucketEnd]);
                    $withSession = (clone $q)
                        ->whereNotNull('session_key')
                        ->where('session_key', '!=', '')
                        ->distinct()
                        ->count('session_key');
                    $orphans = (clone $q)
                        ->where(function ($w) {
                            $w->whereNull('session_key')->orWhere('session_key', '');
                        })
                        ->count();
                    $value = max(0, (int) $withSession + (int) $orphans);
                }
                $series[] = [
                    'label' => $bucketStart->format('M j'),
                    'value' => $value,
                ];
            }

            return $series;
        };

        return [
            'current' => $bucket($startDate, $endDate),
            'previous' => $bucket($prevStart, $startDate),
        ];
    }
}
