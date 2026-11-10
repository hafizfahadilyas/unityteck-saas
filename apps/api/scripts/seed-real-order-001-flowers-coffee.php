<?php

/**
 * Real storefront order + customer + analytics + activity for flowers & coffee.
 * Uses the same OrderController::storefrontStore path as production checkout.
 *
 * Usage:
 *   php scripts/seed-real-order-001-flowers-coffee.php
 *   php scripts/seed-real-order-001-flowers-coffee.php store-1
 *   php scripts/seed-real-order-001-flowers-coffee.php all --strip-demo-seed-orders
 */

declare(strict_types=1);

use App\Http\Controllers\Api\OrderController;
use App\Models\Customer;
use App\Models\CustomerActivity;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$target = $argv[1] ?? 'all';
$stripDemo = in_array('--strip-demo-seed-orders', $argv, true);

$stores = [
    'store-1' => [
        'path' => '/flowers',
        'source' => 'Organic Search',
        'medium' => 'google',
        'campaign' => 'makkah-flowers-real-001',
        'abandon' => [
            'customer_name' => 'نورة الحربي',
            'customer_email' => 'noura.alharbi.mk@gmail.com',
            'customer_phone' => '+966501112233',
            'delivery_location' => 'مكة المكرمة - العزيزية',
        ],
        'buyer' => [
            'customer_name' => 'سعد الغامدي',
            'customer_email' => 'saad.alghamdi.mk@gmail.com',
            'customer_phone' => '+966509887766',
            'delivery_location' => 'مكة المكرمة - النسيم',
        ],
        'demo_order_patterns' => ['#MKK-%', 'ord-mkk-%'],
    ],
    'store-coffee' => [
        'path' => '/shop',
        'source' => 'Instagram',
        'medium' => 'social',
        'campaign' => 'hibrew-real-001',
        'abandon' => [
            'customer_name' => 'لمى بنت فهد العتيبي',
            'customer_email' => 'lama.otaibi.ksa@gmail.com',
            'customer_phone' => '+966503344556',
            'delivery_location' => 'الرياض - حي العليا',
        ],
        'buyer' => [
            'customer_name' => 'فيصل بن سعود المطيري',
            'customer_email' => 'faisal.mutairi.coffee@gmail.com',
            'customer_phone' => '+966505677889',
            'delivery_location' => 'الرياض - حي النرجس',
        ],
        'demo_order_patterns' => ['#COF-%', 'ord-cof-%'],
    ],
];

function stripDemoSeedOrders(string $storeId, array $patterns): int
{
    $deleted = 0;
    $orders = Order::query()
        ->where('store_id', $storeId)
        ->where(function ($q) use ($patterns) {
            foreach ($patterns as $p) {
                if (str_contains($p, '%')) {
                    $q->orWhere('order_number', 'like', $p)
                        ->orWhere('id', 'like', $p);
                }
            }
        })
        ->get();

    foreach ($orders as $order) {
        DB::transaction(function () use ($storeId, $order, &$deleted) {
            if (Schema::hasTable('order_items')) {
                OrderItem::query()->where('order_id', $order->id)->delete();
            }
            if (Schema::hasTable('customer_activities')) {
                CustomerActivity::query()->where('store_id', $storeId)->where('order_id', $order->id)->delete();
            }
            $order->delete();
            $deleted++;
        });
    }

    return $deleted;
}

function emitEvent(
    string $storeId,
    string $event,
    string $sessionKey,
    ?string $customerId,
    string $path,
    string $source,
    string $medium,
    string $campaign,
    array $extraMeta = [],
): void {
    StorefrontAnalyticsEvent::query()->create([
        'id' => 'evt-' . (string) Str::uuid(),
        'store_id' => $storeId,
        'event_name' => $event,
        'path' => $path,
        'source' => $source,
        'medium' => $medium,
        'campaign' => $campaign,
        'customer_id' => $customerId,
        'session_key' => $sessionKey,
        'meta' => array_merge(['surface' => 'public_storefront'], $extraMeta),
    ]);
}

function placeStorefrontOrder(string $storeId, array $payload): array
{
    /** @var OrderController $orders */
    $orders = app(OrderController::class);
    $req = Request::create('/api/storefront/orders', 'POST', $payload, [], [], []);
    $req->headers->set('X-Store-Id', $storeId);
    $req->headers->set('X-Storefront-Surface', 'public_storefront');
    $res = $orders->storefrontStore($req);
    $json = json_decode($res->getContent(), true) ?? [];
    if ($res->getStatusCode() >= 400) {
        throw new RuntimeException("Order create failed ({$storeId}): " . $res->getContent());
    }

    return $json;
}

function runStoreJourney(string $storeId, array $cfg): array
{
    $product = Product::query()
        ->where('store_id', $storeId)
        ->where('stock', '>', 0)
        ->orderBy('id')
        ->first();

    if (! $product) {
        throw new RuntimeException("No in-stock product for {$storeId}");
    }

    $base = rtrim($cfg['path'], '/');
    $price = (float) $product->price;
    $source = $cfg['source'];
    $medium = $cfg['medium'];
    $campaign = $cfg['campaign'];
    $suffix = substr(md5($storeId . microtime(true)), 0, 6);

    $sessionAbandon = "sf_abandon_{$storeId}_{$suffix}";
    emitEvent($storeId, 'page_view', $sessionAbandon, null, "{$base}/shop", $source, $medium, $campaign);
    emitEvent($storeId, 'product_view', $sessionAbandon, null, "{$base}/product/{$product->id}", $source, $medium, $campaign, [
        'product_id' => $product->id,
        'product_name' => $product->name,
    ]);
    emitEvent($storeId, 'add_to_cart', $sessionAbandon, null, "{$base}/cart", $source, $medium, $campaign, [
        'product_id' => $product->id,
        'quantity' => 1,
        'cart_value' => $price,
    ]);
    emitEvent($storeId, 'begin_checkout', $sessionAbandon, null, "{$base}/checkout", $source, $medium, $campaign, [
        'cart_value' => $price,
    ]);

    $itemBlock = [[
        'product_id' => $product->id,
        'name' => $product->name,
        'quantity' => 1,
        'price' => $price,
    ]];

    $pendingPayload = array_merge($cfg['abandon'], [
        'total_amount' => $price,
        'currency' => 'SAR',
        'source' => $source,
        'medium' => $medium,
        'campaign' => $campaign,
        'status' => 'pending',
        'payment_method' => 'COD',
        'items' => $itemBlock,
    ]);
    $pendingJson = placeStorefrontOrder($storeId, $pendingPayload);
    $pendingOrder = $pendingJson['data'] ?? [];

    $sessionGhost = "sf_ghost_{$storeId}_{$suffix}";
    emitEvent($storeId, 'begin_checkout', $sessionGhost, null, "{$base}/checkout", $source, $medium, $campaign, [
        'cart_value' => $price,
        'abandoned' => true,
    ]);

    $sessionBuy = "sf_buy_{$storeId}_{$suffix}";
    emitEvent($storeId, 'page_view', $sessionBuy, null, "{$base}/shop", $source, $medium, $campaign);
    emitEvent($storeId, 'product_view', $sessionBuy, null, "{$base}/product/{$product->id}", $source, $medium, $campaign, [
        'product_id' => $product->id,
        'product_name' => $product->name,
    ]);
    emitEvent($storeId, 'add_to_cart', $sessionBuy, null, "{$base}/cart", $source, $medium, $campaign, [
        'product_id' => $product->id,
        'quantity' => 1,
    ]);
    emitEvent($storeId, 'begin_checkout', $sessionBuy, null, "{$base}/checkout", $source, $medium, $campaign, [
        'cart_value' => $price,
    ]);

    $buyPayload = array_merge($cfg['buyer'], [
        'total_amount' => $price,
        'currency' => 'SAR',
        'source' => 'Direct',
        'medium' => $medium,
        'campaign' => $campaign,
        'delivery_location' => $cfg['buyer']['delivery_location'],
        'status' => 'processing',
        'payment_method' => 'COD',
        'payment_status' => 'pending',
        'items' => $itemBlock,
    ]);
    $buyJson = placeStorefrontOrder($storeId, $buyPayload);
    $buyOrder = $buyJson['data'] ?? [];
    $buyOrderId = $buyOrder['id'] ?? null;
    $buyerCustomerId = $buyOrder['customer_id'] ?? null;

    if ($buyOrderId) {
        Order::query()->where('id', $buyOrderId)->update([
            'cod_status' => 'pending_collection',
            'shipping_status' => 'shipped',
            'courier_code' => 'smsa',
            'tracking_number' => 'SMSA' . strtoupper(substr(md5($buyOrderId), 0, 9)),
            'awb_number' => 'AWB-' . date('Ymd') . '-' . strtoupper(substr($storeId, -3)),
        ]);

        emitEvent($storeId, 'purchase', $sessionBuy, $buyerCustomerId, "{$base}/thankyou", $source, $medium, $campaign, [
            'order_id' => $buyOrderId,
            'order_number' => $buyOrder['order_number'] ?? null,
            'payment_method' => 'COD',
            'total_amount' => $price,
        ]);
    }

    $eventsCount = StorefrontAnalyticsEvent::query()->where('store_id', $storeId)->count();
    $pageViews = StorefrontAnalyticsEvent::query()
        ->where('store_id', $storeId)
        ->where('event_name', 'page_view')
        ->count();

    return [
        'store_id' => $storeId,
        'product' => ['id' => $product->id, 'name' => $product->name, 'price' => $price],
        'analytics_events_total' => $eventsCount,
        'page_views' => $pageViews,
        'pending_abandoned' => [
            'id' => $pendingOrder['id'] ?? null,
            'order_number' => $pendingOrder['order_number'] ?? null,
            'customer_id' => $pendingOrder['customer_id'] ?? null,
        ],
        'live_order' => [
            'id' => $buyOrderId,
            'order_number' => $buyOrder['order_number'] ?? null,
            'customer_id' => $buyerCustomerId,
            'tracking' => $buyOrderId ? Order::query()->find($buyOrderId)?->tracking_number : null,
        ],
        'customers_in_db' => Customer::query()->where('store_id', $storeId)->count(),
        'activities_for_buyer' => $buyerCustomerId && Schema::hasTable('customer_activities')
            ? CustomerActivity::query()->where('store_id', $storeId)->where('customer_id', $buyerCustomerId)->count()
            : 0,
    ];
}

$runIds = $target === 'all' ? array_keys($stores) : [$target];
$out = ['strip_demo_deleted' => [], 'journeys' => []];

foreach ($runIds as $storeId) {
    if (! isset($stores[$storeId])) {
        fwrite(STDERR, "Unknown store: {$storeId}\n");
        exit(1);
    }
    if ($stripDemo) {
        $out['strip_demo_deleted'][$storeId] = stripDemoSeedOrders($storeId, $stores[$storeId]['demo_order_patterns']);
    }
    $out['journeys'][$storeId] = runStoreJourney($storeId, $stores[$storeId]);
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
