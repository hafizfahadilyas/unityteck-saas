<?php

/**
 * One-shot: real MySQL rows via same logic as public storefront APIs.
 * Usage: php scripts/seed-real-tracking-journey.php [store_id]
 */

use App\Models\Order;
use App\Models\StorefrontAnalyticsEvent;
use Illuminate\Support\Str;

$storeId = $argv[1] ?? 'store-1';

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$product = \App\Models\Product::query()
    ->where('store_id', $storeId)
    ->where('stock', '>', 0)
    ->orderBy('id')
    ->first();

if (!$product) {
    fwrite(STDERR, "No in-stock product for {$storeId}\n");
    exit(1);
}

$meta = ['surface' => 'public_storefront'];
$source = 'Organic Search';
$medium = 'google';
$campaign = 'unityteck-demo-tracking';

function emitEvent(
    string $storeId,
    string $event,
    string $sessionKey,
    ?string $customerId,
    string $path,
    array $extraMeta = [],
): void {
    global $source, $medium, $campaign, $meta;
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
        'meta' => array_merge($meta, $extraMeta),
    ]);
    if ($event === 'page_view') {
        \App\Models\Store::query()->where('id', $storeId)->increment('visitors_count');
    }
}

// —— Visitor who abandons (checkout started, order stays pending) ——
$abandonCustomerId = null;
$sessionAbandon = 'sf_sess_abandon_' . date('Ymd_His');

emitEvent($storeId, 'page_view', $sessionAbandon, null, '/flowers/shop', []);
emitEvent($storeId, 'product_view', $sessionAbandon, null, '/flowers/product/' . $product->id, [
    'product_id' => $product->id,
    'product_name' => $product->name,
]);
emitEvent($storeId, 'add_to_cart', $sessionAbandon, null, '/flowers/cart', [
    'product_id' => $product->id,
    'product_name' => $product->name,
    'quantity' => 1,
]);
emitEvent($storeId, 'begin_checkout', $sessionAbandon, null, '/flowers/checkout', [
    'cart_value' => (float) $product->price,
]);

$pendingPayload = [
    'customer_name' => 'نورة الحربي',
    'customer_email' => 'noura.alharbi.mk@gmail.com',
    'customer_phone' => '+966501112233',
    'total_amount' => (float) $product->price,
    'currency' => 'SAR',
    'source' => 'Organic Search',
    'medium' => $medium,
    'campaign' => $campaign,
    'delivery_location' => 'Makkah - Al Aziziyah',
    'status' => 'pending',
    'payment_method' => 'COD',
    'items' => [[
        'product_id' => $product->id,
        'name' => $product->name,
        'quantity' => 1,
        'price' => (float) $product->price,
    ]],
];

// —— Visitor who completes COD order with shipping ——
$sessionBuy = 'sf_sess_order_' . date('Ymd_His');
emitEvent($storeId, 'page_view', $sessionBuy, null, '/flowers/shop', []);
emitEvent($storeId, 'product_view', $sessionBuy, null, '/flowers/product/' . $product->id, [
    'product_id' => $product->id,
    'product_name' => $product->name,
]);
emitEvent($storeId, 'add_to_cart', $sessionBuy, null, '/flowers/cart', [
    'product_id' => $product->id,
    'product_name' => $product->name,
    'quantity' => 1,
]);
emitEvent($storeId, 'begin_checkout', $sessionBuy, null, '/flowers/checkout', [
    'cart_value' => (float) $product->price,
]);

// Ghost checkout (no order) — funnel signal for abandoned carts analytics
$sessionGhost = 'sf_sess_ghost_checkout_' . date('Ymd_His');
emitEvent($storeId, 'begin_checkout', $sessionGhost, null, '/flowers/checkout', [
    'cart_value' => (float) $product->price,
    'abandoned' => true,
]);

/** @var \App\Http\Controllers\Api\OrderController $orders */
$orders = app(\App\Http\Controllers\Api\OrderController::class);

$pendingReq = \Illuminate\Http\Request::create('/api/storefront/orders', 'POST', $pendingPayload, [], [], [
    'HTTP_X-Store-Id' => $storeId,
    'HTTP_X-Storefront-Surface' => 'public_storefront',
]);
$pendingReq->headers->set('X-Store-Id', $storeId);
$pendingRes = $orders->storefrontStore($pendingReq);
$pendingJson = json_decode($pendingRes->getContent(), true);
if ($pendingRes->getStatusCode() >= 400) {
    fwrite(STDERR, 'Pending order failed: ' . $pendingRes->getContent() . "\n");
    exit(1);
}

$codPayload = [
    'customer_name' => 'سعد الغامدي',
    'customer_email' => 'saad.alghamdi.mk@gmail.com',
    'customer_phone' => '+966509887766',
    'total_amount' => (float) $product->price,
    'currency' => 'SAR',
    'source' => 'Direct',
    'medium' => $medium,
    'campaign' => $campaign,
    'delivery_location' => 'Makkah - Al Naseem',
    'status' => 'processing',
    'payment_method' => 'COD',
    'payment_status' => 'pending',
    'items' => [[
        'product_id' => $product->id,
        'name' => $product->name,
        'quantity' => 1,
        'price' => (float) $product->price,
    ]],
];

$codReq = \Illuminate\Http\Request::create('/api/storefront/orders', 'POST', $codPayload, [], [], [
    'HTTP_X-Store-Id' => $storeId,
]);
$codReq->headers->set('X-Store-Id', $storeId);
$codRes = $orders->storefrontStore($codReq);
$codJson = json_decode($codRes->getContent(), true);
if ($codRes->getStatusCode() >= 400) {
    fwrite(STDERR, 'COD order failed: ' . $codRes->getContent() . "\n");
    exit(1);
}

$codOrderId = $codJson['data']['id'] ?? null;
if ($codOrderId) {
    Order::query()->where('id', $codOrderId)->update([
        'cod_status' => 'pending_collection',
        'shipping_status' => 'shipped',
        'courier_code' => 'aramex',
        'tracking_number' => 'ARX' . strtoupper(substr(md5($codOrderId), 0, 10)),
        'awb_number' => 'AWB-' . date('Ymd') . '-DEMO',
    ]);

    $buyerCustomerId = $codJson['data']['customer_id'] ?? null;
    emitEvent($storeId, 'purchase', $sessionBuy, $buyerCustomerId, '/flowers/thankyou', [
        'order_id' => $codOrderId,
        'order_number' => $codJson['data']['order_number'] ?? null,
        'payment_method' => 'COD',
        'total_amount' => (float) $product->price,
    ]);
}

$visits = StorefrontAnalyticsEvent::query()
    ->where('store_id', $storeId)
    ->where('event_name', 'page_view')
    ->count();

echo json_encode([
    'store_id' => $storeId,
    'product' => ['id' => $product->id, 'name' => $product->name, 'price' => $product->price],
    'page_views_total' => $visits,
    'pending_abandoned_order' => [
        'id' => $pendingJson['data']['id'] ?? null,
        'order_number' => $pendingJson['data']['order_number'] ?? null,
        'customer_phone' => $pendingPayload['customer_phone'],
    ],
    'cod_order' => [
        'id' => $codOrderId,
        'order_number' => $codJson['data']['order_number'] ?? null,
        'tracking' => Order::query()->find($codOrderId)?->tracking_number,
        'customer_phone' => $codPayload['customer_phone'],
    ],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
