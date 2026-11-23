<?php

/**
 * Seed store-coffee Makkah-only shipping zones + Saudi courier methods (SAR).
 * Origin: Makkah warehouse. Rates sized for coffee accessories + machines (kg).
 *
 * Usage: php scripts/seed-coffee-makkah-shipping.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$storeId = 'store-coffee';

function sid(string $prefix): string
{
    return $prefix.'_'.substr(str_replace('-', '', (string) Str::uuid()), 0, 12);
}

echo "Seeding Makkah shipping for {$storeId}...\n";

DB::transaction(function () use ($storeId) {
    // Replace zones for this store only (currently empty / stale).
    ShippingZone::query()->withoutGlobalScopes()->where('store_id', $storeId)->delete();

    $zones = [
        [
            'id' => sid('shipz'),
            'store_id' => $storeId,
            'name' => 'Makkah City',
            'region' => 'Makkah',
            'rate' => 18.00,
            'rate_mode' => 'per_kg',
            'rate_per_kg' => 4.00,
            'min_weight_kg' => 2.00,
            'max_weight_kg' => 5.00,
            'min_delivery_days' => 0,
            'max_delivery_days' => 1,
            'estimated_delivery' => 'Same day – 1 day (Makkah)',
            'same_day' => true,
            'free_above' => 300.00,
            'courier_code' => null,
            'cod_available' => true,
            'city_names' => ['Makkah', 'Mecca', 'مكة', 'مكة المكرمة'],
            'status' => 'active',
            'is_active' => true,
        ],
        [
            'id' => sid('shipz'),
            'store_id' => $storeId,
            'name' => 'Makkah – Coffee Machines',
            'region' => 'Makkah',
            'rate' => 35.00,
            'rate_mode' => 'per_kg',
            'rate_per_kg' => 6.00,
            'min_weight_kg' => 5.00,
            'max_weight_kg' => 40.00,
            'min_delivery_days' => 1,
            'max_delivery_days' => 2,
            'estimated_delivery' => '1–2 days (machines / heavy)',
            'same_day' => false,
            'free_above' => 1500.00,
            'courier_code' => null,
            'cod_available' => true,
            'city_names' => ['Makkah', 'Mecca', 'مكة', 'مكة المكرمة'],
            'status' => 'active',
            'is_active' => true,
        ],
        [
            'id' => sid('shipz'),
            'store_id' => $storeId,
            'name' => 'Makkah Districts',
            'region' => 'Makkah',
            'rate' => 22.00,
            'rate_mode' => 'per_kg',
            'rate_per_kg' => 5.00,
            'min_weight_kg' => 1.00,
            'max_weight_kg' => 25.00,
            'min_delivery_days' => 1,
            'max_delivery_days' => 2,
            'estimated_delivery' => '1–2 days',
            'same_day' => false,
            'free_above' => 400.00,
            'courier_code' => null,
            'cod_available' => true,
            'city_names' => [
                'Aziziyah', 'Ajyad', 'Al Awali', 'Al Naseem', 'Al Sharaie',
                'Jabal Omar', 'Al Kakiyyah', 'Al Rusaifah', 'العوالي', 'العزيزية',
            ],
            'status' => 'active',
            'is_active' => true,
        ],
    ];

    foreach ($zones as $z) {
        ShippingZone::query()->create($z);
        echo "  zone: {$z['name']} @ {$z['rate']} SAR + {$z['rate_per_kg']}/kg\n";
    }

    // Keep pickup; replace other methods with Makkah courier set.
    ShippingMethod::query()
        ->withoutGlobalScopes()
        ->where('store_id', $storeId)
        ->where('type', '!=', 'local_pickup')
        ->delete();

    $pickup = ShippingMethod::query()
        ->withoutGlobalScopes()
        ->where('store_id', $storeId)
        ->where('type', 'local_pickup')
        ->first();

    if (! $pickup) {
        ShippingMethod::query()->create([
            'id' => sid('shipm'),
            'store_id' => $storeId,
            'name' => 'Store Pickup – Makkah',
            'name_ar' => 'استلام من المتجر — مكة',
            'type' => 'local_pickup',
            'fulfillment_mode' => 'own_delivery',
            'base_rate' => 0,
            'per_kg_rate' => 0,
            'per_km_rate' => 0,
            'min_order_amount' => 0,
            'free_shipping_threshold' => null,
            'estimated_delivery' => 'Same Day',
            'eta_type' => 'same_day',
            'eta_value' => 0,
            'tracking_enabled' => false,
            'is_cod_allowed' => true,
            'allow_online' => true,
            'allow_bank_transfer' => true,
            'payment_options' => ['cod', 'online', 'bank_transfer'],
            'cod_fee' => 0,
            'courier_code' => null,
            'logo_url' => null,
            'vehicle_type' => null,
            'is_active' => true,
            'sort_order' => 1,
            'description' => 'Collect from Makkah warehouse / store',
        ]);
    } else {
        $pickup->fill([
            'name' => 'Store Pickup – Makkah',
            'name_ar' => 'استلام من المتجر — مكة',
            'base_rate' => 0,
            'is_active' => true,
            'sort_order' => 1,
            'description' => 'Collect from Makkah warehouse / store',
        ])->save();
    }

    // Famous Saudi couriers — Makkah local-ish SAR (coffee accessories + machines).
    $methods = [
        [
            'name' => 'Local Makkah Delivery',
            'name_ar' => 'توصيل محلي داخل مكة',
            'type' => 'same_day',
            'fulfillment_mode' => 'own_delivery',
            'base_rate' => 20.00,
            'per_kg_rate' => 5.00,
            'free_shipping_threshold' => 350.00,
            'estimated_delivery' => 'Same day (Makkah)',
            'eta_type' => 'same_day',
            'eta_value' => 0,
            'courier_code' => null,
            'logo_url' => null,
            'vehicle_type' => 'van',
            'is_cod_allowed' => true,
            'sort_order' => 2,
            'description' => 'Own fleet inside Makkah — accessories & machines',
        ],
        [
            'name' => 'SMSA Express',
            'name_ar' => 'سمسا إكسبريس',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 22.00,
            'per_kg_rate' => 5.00,
            'free_shipping_threshold' => 500.00,
            'estimated_delivery' => '1–2 days (Makkah)',
            'eta_type' => 'days',
            'eta_value' => 2,
            'courier_code' => 'smsa',
            'logo_url' => '/shipping-methods/smsa.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 3,
            'description' => 'SMSA domestic — Makkah from Makkah warehouse',
        ],
        [
            'name' => 'Aramex',
            'name_ar' => 'أرامكس',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 25.00,
            'per_kg_rate' => 6.00,
            'free_shipping_threshold' => 550.00,
            'estimated_delivery' => '1–3 days (Makkah)',
            'eta_type' => 'days',
            'eta_value' => 2,
            'courier_code' => 'aramex',
            'logo_url' => '/shipping-methods/aramex.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 4,
            'description' => 'Aramex — coffee machines & parcels in Makkah',
        ],
        [
            'name' => 'Saudi Post (SPL)',
            'name_ar' => 'البريد السعودي (سبل)',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 20.00,
            'per_kg_rate' => 4.50,
            'free_shipping_threshold' => 450.00,
            'estimated_delivery' => '2–4 days (Makkah)',
            'eta_type' => 'days',
            'eta_value' => 3,
            'courier_code' => 'spl',
            'logo_url' => '/shipping-methods/spl.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 5,
            'description' => 'SPL Wasel / national post — Makkah',
        ],
        [
            'name' => 'RedBox',
            'name_ar' => 'ريدبوكس',
            'type' => 'flat_rate',
            'fulfillment_mode' => 'courier',
            'base_rate' => 18.00,
            'per_kg_rate' => 3.50,
            'free_shipping_threshold' => 400.00,
            'estimated_delivery' => '2–4 days (locker / PUDO)',
            'eta_type' => 'days',
            'eta_value' => 3,
            'courier_code' => 'redbox',
            'logo_url' => '/shipping-methods/redbox.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 6,
            'description' => 'RedBox pickup points — lighter coffee accessories',
        ],
        [
            'name' => 'AyMakan',
            'name_ar' => 'أي مكان',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 24.00,
            'per_kg_rate' => 5.50,
            'free_shipping_threshold' => 500.00,
            'estimated_delivery' => '1–3 days (Makkah)',
            'eta_type' => 'days',
            'eta_value' => 2,
            'courier_code' => 'aymakan',
            'logo_url' => '/shipping-methods/aymakan.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 7,
            'description' => 'AyMakan — Makkah city deliveries',
        ],
        [
            'name' => 'J&T Express',
            'name_ar' => 'جيه آند تي إكسبريس',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 19.00,
            'per_kg_rate' => 4.00,
            'free_shipping_threshold' => 450.00,
            'estimated_delivery' => '2–4 days (Makkah)',
            'eta_type' => 'days',
            'eta_value' => 3,
            'courier_code' => 'jt',
            'logo_url' => '/shipping-methods/jt-express.png',
            'vehicle_type' => null,
            'is_cod_allowed' => true,
            'sort_order' => 8,
            'description' => 'J&T Express domestic — Makkah',
        ],
        [
            'name' => 'DHL Express',
            'name_ar' => 'دي إتش إل إكسبريس',
            'type' => 'weight_based',
            'fulfillment_mode' => 'courier',
            'base_rate' => 55.00,
            'per_kg_rate' => 12.00,
            'free_shipping_threshold' => null,
            'estimated_delivery' => '1–2 days (premium)',
            'eta_type' => 'days',
            'eta_value' => 2,
            'courier_code' => 'dhl',
            'logo_url' => '/shipping-methods/dhl-express.png',
            'vehicle_type' => null,
            'is_cod_allowed' => false,
            'sort_order' => 9,
            'description' => 'DHL premium — heavy machines / priority',
        ],
    ];

    foreach ($methods as $m) {
        ShippingMethod::query()->create([
            'id' => sid('shipm'),
            'store_id' => $storeId,
            'name' => $m['name'],
            'name_ar' => $m['name_ar'],
            'type' => $m['type'],
            'fulfillment_mode' => $m['fulfillment_mode'],
            'base_rate' => $m['base_rate'],
            'per_kg_rate' => $m['per_kg_rate'],
            'per_km_rate' => 0,
            'min_order_amount' => 0,
            'free_shipping_threshold' => $m['free_shipping_threshold'],
            'estimated_delivery' => $m['estimated_delivery'],
            'eta_type' => $m['eta_type'],
            'eta_value' => $m['eta_value'],
            'tracking_enabled' => true,
            'is_cod_allowed' => $m['is_cod_allowed'],
            'allow_online' => true,
            'allow_bank_transfer' => true,
            'payment_options' => $m['is_cod_allowed']
                ? ['cod', 'online', 'bank_transfer']
                : ['online', 'bank_transfer'],
            'cod_fee' => 0,
            'courier_code' => $m['courier_code'],
            'logo_url' => $m['logo_url'],
            'vehicle_type' => $m['vehicle_type'],
            'is_active' => true,
            'sort_order' => $m['sort_order'],
            'description' => $m['description'],
        ]);
        echo "  method: {$m['name']} @ {$m['base_rate']} SAR\n";
    }
});

$zCount = ShippingZone::query()->withoutGlobalScopes()->where('store_id', $storeId)->count();
$mCount = ShippingMethod::query()->withoutGlobalScopes()->where('store_id', $storeId)->count();

// Mirror zones into stores.data for commerce.php hosts that still read JSON first.
$zoneRows = DB::table('shipping_zones')->where('store_id', $storeId)->orderBy('name')->get();
$payload = [];
foreach ($zoneRows as $z) {
    $cities = json_decode((string) ($z->city_names ?? '[]'), true);
    if (! is_array($cities)) {
        $cities = [];
    }
    $payload[] = [
        'id' => $z->id,
        'store_id' => $storeId,
        'name' => $z->name,
        'city_name' => $z->name,
        'region' => $z->region,
        'province' => $z->region,
        'rate' => (float) $z->rate,
        'rate_per_kg' => (float) $z->rate_per_kg,
        'min_weight_kg' => (float) $z->min_weight_kg,
        'max_weight_kg' => (float) $z->max_weight_kg,
        'free_above' => $z->free_above !== null ? (float) $z->free_above : null,
        'estimated_delivery' => $z->estimated_delivery,
        'min_delivery_days' => (int) $z->min_delivery_days,
        'max_delivery_days' => (int) $z->max_delivery_days,
        'city_names' => $cities,
        'status' => ((int) $z->is_active === 1) ? 'active' : 'inactive',
        'is_active' => (bool) $z->is_active,
        'cod_available' => (bool) $z->cod_available,
    ];
}
$existingExtras = DB::table('store_extras')->where('store_id', $storeId)->value('data');
$data = [];
if (is_string($existingExtras) && $existingExtras !== '') {
    $decoded = json_decode($existingExtras, true);
    if (is_array($decoded)) {
        $data = $decoded;
    }
}
$data['shipping'] = $payload;
$data['shipping_zones'] = $payload;
DB::table('store_extras')->updateOrInsert(
    ['store_id' => $storeId],
    ['data' => json_encode($data, JSON_UNESCAPED_UNICODE), 'updated_at' => now()]
);
echo 'synced store_extras shipping zones='.count($payload)."\n";

echo "DONE store={$storeId} zones={$zCount} methods={$mCount}\n";
