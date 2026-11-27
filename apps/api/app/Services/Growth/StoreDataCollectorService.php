<?php

namespace App\Services\Growth;

use App\Models\CashbackCampaign;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\SeoConfig;
use App\Models\ShippingMethod;
use App\Models\SocialAccount;
use App\Models\SocialPost;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\ThemePage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Live Store Data Ingestion Engine.
 * Extracts 100% genuine database metrics across all store operations with ZERO mock numbers.
 */
class StoreDataCollectorService
{
    /**
     * Gather comprehensive telemetry snapshot for a specific store.
     *
     * @param string $storeId
     * @return array<string, mixed>
     */
    public function collectStoreSnapshot(string $storeId): array
    {
        $store = Store::query()->find($storeId);
        if (!$store) {
            return [];
        }

        // 1. Catalog Metrics
        $totalProducts = Product::query()->forStore($storeId)->count();
        $activeProducts = Product::query()->forStore($storeId)->where('is_active', true)->count();
        $outOfStockCount = Product::query()->forStore($storeId)->where('stock', '<=', 0)->count();
        $lowStockCount = Product::query()->forStore($storeId)->where('stock', '>', 0)->where('stock', '<=', 5)->count();
        $categoriesCount = Category::query()->forStore($storeId)->count();
        $topSellingProduct = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.store_id', $storeId)
            ->where(function ($q) {
                $q->where('orders.payment_status', 'paid')
                  ->orWhereIn('orders.status', ['completed', 'processing', 'delivered']);
            })
            ->select('order_items.product_id', 'order_items.product_name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_sold')
            ->first();

        // 2. Sales & Commerce Metrics
        $totalOrders = Order::query()->forStore($storeId)->count();
        $paidOrders = Order::query()->forStore($storeId)->where(function ($q) {
            $q->where('payment_status', 'paid')
              ->orWhereIn('status', ['completed', 'processing', 'delivered']);
        })->count();
        $unpaidOrders = Order::query()->forStore($storeId)->where(function ($q) {
            $q->whereIn('payment_status', ['unpaid', 'pending'])
              ->orWhereIn('status', ['pending', 'partially_paid']);
        })->count();
        $totalRevenue = (float) Order::query()->forStore($storeId)->where(function ($q) {
            $q->where('payment_status', 'paid')
              ->orWhereIn('status', ['completed', 'processing', 'delivered']);
        })->sum('total_amount');
        $averageOrderValue = $paidOrders > 0 ? round($totalRevenue / $paidOrders, 2) : 0.0;
        
        $last30DaysOrders = Order::query()->forStore($storeId)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();
        $last30DaysRevenue = (float) Order::query()->forStore($storeId)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhereIn('status', ['completed', 'processing', 'delivered']);
            })
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('total_amount');

        // Single-item orders percentage (cross-selling indicator)
        $singleItemOrders = DB::table('orders')
            ->where('orders.store_id', $storeId)
            ->where(function ($q) {
                $q->where('orders.payment_status', 'paid')
                  ->orWhereIn('orders.status', ['completed', 'processing', 'delivered']);
            })
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('order_items')
                    ->whereColumn('order_items.order_id', 'orders.id')
                    ->groupBy('order_items.order_id')
                    ->havingRaw('COUNT(order_items.id) = 1');
            })
            ->count();
        $singleItemOrdersPct = $paidOrders > 0 ? round(($singleItemOrders / $paidOrders) * 100, 1) : 0.0;

        // 3. Customers & Retention
        $totalCustomers = Customer::query()->forStore($storeId)->count();
        $repeatCustomers = DB::table('orders')
            ->where('store_id', $storeId)
            ->where(function ($q) {
                $q->where('payment_status', 'paid')
                  ->orWhereIn('status', ['completed', 'processing', 'delivered']);
            })
            ->whereNotNull('customer_id')
            ->select('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('COUNT(id) > 1')
            ->count();
        $retentionRate = $totalCustomers > 0 ? round(($repeatCustomers / $totalCustomers) * 100, 1) : 0.0;

        // 4. Cart Activity & Abandonment
        $abandonmentRate = ($paidOrders + $unpaidOrders) > 0 
            ? round(($unpaidOrders / ($paidOrders + $unpaidOrders)) * 100, 1) 
            : 0.0;

        // 5. Shipping Configuration
        $shippingMethods = ShippingMethod::query()->forStore($storeId)->get();
        $activeShippingMethods = $shippingMethods->where('is_active', true)->count();

        // 6. Payment Gateways
        $paymentGateways = PaymentGateway::query()->forStore($storeId)->get();
        $activeGateways = $paymentGateways->where('is_enabled', true)->count();
        $hasTabbyOrTamara = $paymentGateways->where('is_enabled', true)
            ->filter(fn($gw) => in_array(strtolower($gw->provider ?? ''), ['tabby', 'tamara']))
            ->count() > 0;

        // 7. Store Design & Dynamic Page Builder
        $themePages = ThemePage::query()->forStore($storeId)->get();
        $homePage = $themePages->firstWhere('slug', 'home') ?? $themePages->firstWhere('type', 'home');
        $homeSections = [];
        $hasCrossSellWidget = false;
        $hasUpsellWidget = false;
        $hasHeroBanner = false;

        if ($homePage && is_array($homePage->published_layout)) {
            $sections = $homePage->published_layout['sections'] ?? [];
            if (is_array($sections)) {
                $homeSections = $sections;
                foreach ($sections as $sec) {
                    $type = strtolower($sec['type'] ?? '');
                    if (str_contains($type, 'cross') || str_contains($type, 'related') || str_contains($type, 'bundle')) {
                        $hasCrossSellWidget = true;
                    }
                    if (str_contains($type, 'upsell') || str_contains($type, 'featured')) {
                        $hasUpsellWidget = true;
                    }
                    if (str_contains($type, 'hero') || str_contains($type, 'slider') || str_contains($type, 'banner')) {
                        $hasHeroBanner = true;
                    }
                }
            }
        }

        // 8. SEO Metadata
        $seoConfig = SeoConfig::query()->forStore($storeId)->first();
        $isGlobalSeoConfigured = !empty($seoConfig?->meta_title) && !empty($seoConfig?->meta_description);
        $productsMissingSeo = Product::query()->forStore($storeId)
            ->where(function ($q) {
                $q->whereNull('seo_title')->orWhere('seo_title', '');
            })
            ->count();

        // 9. Marketing & Promotions
        $activeCoupons = Coupon::query()->forStore($storeId)->where('is_active', true)->count();
        $activeCashback = CashbackCampaign::query()->forStore($storeId)->where('status', 'active')->count();

        // 10. Social Media Connections
        $socialAccounts = SocialAccount::query()->where('store_id', $storeId)->count();
        $scheduledPosts = SocialPost::query()->where('store_id', $storeId)->where('status', 'scheduled')->count();

        // 11. WhatsApp / Notifications Configuration
        $storeSetting = StoreSetting::query()->where('store_id', $storeId)->first();
        $settings = is_array($storeSetting?->settings) ? $storeSetting->settings : [];
        $whatsappConfigured = !empty($settings['whatsapp']['phone_number_id']) || !empty(config('services.whatsapp.phone_number_id'));

        // Calculate Genuine Store Health Score (0 - 100)
        $healthScore = $this->calculateHealthScore([
            'active_gateways' => $activeGateways,
            'active_shipping' => $activeShippingMethods,
            'active_products' => $activeProducts,
            'out_of_stock' => $outOfStockCount,
            'is_seo_configured' => $isGlobalSeoConfigured,
            'products_missing_seo' => $productsMissingSeo,
            'has_cross_sell' => $hasCrossSellWidget,
            'abandonment_rate' => $abandonmentRate,
            'active_promotions' => ($activeCoupons + $activeCashback),
            'whatsapp_configured' => $whatsappConfigured,
        ]);

        return [
            'store_id' => $storeId,
            'store_name' => $store->name,
            'store_category' => $store->category ?? 'General Retail',
            'health_score' => $healthScore['score'],
            'health_grade' => $healthScore['grade'],
            'health_breakdown' => $healthScore['breakdown'],
            'catalog' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'out_of_stock_count' => $outOfStockCount,
                'low_stock_count' => $lowStockCount,
                'categories_count' => $categoriesCount,
                'top_seller' => $topSellingProduct ? [
                    'product_id' => $topSellingProduct->product_id,
                    'name' => $topSellingProduct->product_name,
                    'total_sold' => (int) $topSellingProduct->total_sold,
                ] : null,
            ],
            'commerce' => [
                'total_orders' => $totalOrders,
                'paid_orders' => $paidOrders,
                'unpaid_orders' => $unpaidOrders,
                'total_revenue_sar' => $totalRevenue,
                'average_order_value_sar' => $averageOrderValue,
                'single_item_orders_pct' => $singleItemOrdersPct,
                'last_30_days_orders' => $last30DaysOrders,
                'last_30_days_revenue_sar' => $last30DaysRevenue,
                'cart_abandonment_rate_pct' => $abandonmentRate,
            ],
            'customers' => [
                'total_customers' => $totalCustomers,
                'repeat_customers' => $repeatCustomers,
                'retention_rate_pct' => $retentionRate,
            ],
            'operations' => [
                'active_shipping_methods' => $activeShippingMethods,
                'active_payment_gateways' => $activeGateways,
                'has_bnpl_gateway' => $hasTabbyOrTamara,
                'whatsapp_configured' => $whatsappConfigured,
            ],
            'storefront' => [
                'has_home_page' => (bool) $homePage,
                'sections_count' => count($homeSections),
                'has_cross_sell_widget' => $hasCrossSellWidget,
                'has_upsell_widget' => $hasUpsellWidget,
                'has_hero_banner' => $hasHeroBanner,
            ],
            'seo' => [
                'is_global_configured' => $isGlobalSeoConfigured,
                'products_missing_seo' => $productsMissingSeo,
            ],
            'marketing' => [
                'active_coupons' => $activeCoupons,
                'active_cashback' => $activeCashback,
                'social_accounts' => $socialAccounts,
                'scheduled_posts' => $scheduledPosts,
            ],
            'collected_at' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Compute store health score out of 100 based on verified real indicators.
     *
     * @param array<string, mixed> $data
     * @return array{score: int, grade: string, breakdown: array<string, int>}
     */
    private function calculateHealthScore(array $data): array
    {
        $breakdown = [];

        // 1. Payment Readiness (max 20 pts)
        $payPts = 0;
        if ($data['active_gateways'] >= 2) {
            $payPts = 20;
        } elseif ($data['active_gateways'] === 1) {
            $payPts = 12;
        }
        $breakdown['payments'] = $payPts;

        // 2. Shipping Readiness (max 15 pts)
        $shipPts = $data['active_shipping'] > 0 ? 15 : 0;
        $breakdown['shipping'] = $shipPts;

        // 3. Catalog & Inventory Health (max 20 pts)
        $catPts = 0;
        if ($data['active_products'] > 0) {
            $catPts += 12;
            if ($data['out_of_stock'] === 0) {
                $catPts += 8;
            } elseif ($data['out_of_stock'] <= 3) {
                $catPts += 4;
            }
        }
        $breakdown['catalog'] = min(20, $catPts);

        // 4. SEO & Visibility (max 15 pts)
        $seoPts = 0;
        if ($data['is_seo_configured']) {
            $seoPts += 9;
        }
        if ($data['products_missing_seo'] === 0 && $data['active_products'] > 0) {
            $seoPts += 6;
        } elseif ($data['products_missing_seo'] < 5) {
            $seoPts += 3;
        }
        $breakdown['seo'] = min(15, $seoPts);

        // 5. Conversion & Cart Optimization (max 15 pts)
        $convPts = 0;
        if ($data['has_cross_sell']) {
            $convPts += 8;
        }
        if ($data['abandonment_rate'] < 50.0 && $data['abandonment_rate'] > 0) {
            $convPts += 7;
        } elseif ($data['abandonment_rate'] <= 70.0) {
            $convPts += 4;
        }
        $breakdown['conversion'] = min(15, $convPts);

        // 6. Retention, Loyalty & Notifications (max 15 pts)
        $retPts = 0;
        if ($data['active_promotions'] > 0) {
            $retPts += 8;
        }
        if ($data['whatsapp_configured']) {
            $retPts += 7;
        }
        $breakdown['retention'] = min(15, $retPts);

        $totalScore = array_sum($breakdown);
        $totalScore = max(0, min(100, $totalScore));

        $grade = 'A+';
        if ($totalScore < 45) {
            $grade = 'Action Required';
        } elseif ($totalScore < 65) {
            $grade = 'C';
        } elseif ($totalScore < 80) {
            $grade = 'B';
        } elseif ($totalScore < 92) {
            $grade = 'A';
        }

        return [
            'score' => $totalScore,
            'grade' => $grade,
            'breakdown' => $breakdown,
        ];
    }
}
