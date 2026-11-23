<?php

/**
 * Seed HiBrew grouped-child buy-page custom fields (store-coffee, prod-c1-yvdusf).
 * Honor-style options: label + imageUrl + price (+ compareAtPrice).
 *
 * Usage: php scripts/seed-coffee-yvdusf-purchase-fields.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';
$childId = 'prod-c1-yvdusf';

if (! Schema::hasColumn('products', 'custom_fields')) {
    fwrite(STDERR, "FAIL: products.custom_fields column missing — run migration first.\n");
    exit(1);
}

$demoFields = [
    [
        'id' => 'cf-yvdusf-pressure',
        'name' => 'Extraction Profile',
        'nameAr' => "\u{0645}\u{0644}\u{0641} \u{0627}\u{0644}\u{0627}\u{0633}\u{062a}\u{062e}\u{0644}\u{0627}\u{0635}",
        'description' => 'Choose how the machine brews your espresso shots.',
        'type' => 'Single Choice',
        'required' => false,
        'extraPrice' => 0,
        'options' => [
            [
                'label' => 'Standard 15 Bar',
                'labelAr' => "\u{0642}\u{064a}\u{0627}\u{0633}\u{064a} 15 \u{0628}\u{0627}\u{0631}",
                'price' => 0,
            ],
            [
                'label' => 'Commercial 20 Bar',
                'labelAr' => "\u{062a}\u{062c}\u{0627}\u{0631}\u{064a} 20 \u{0628}\u{0627}\u{0631}",
                'price' => 0,
            ],
            [
                'label' => 'Turbo Bloom',
                'labelAr' => "\u{062a}\u{064a}\u{0631}\u{0628}\u{0648} \u{0628}\u{0644}\u{0648}\u{0645}",
                'price' => 49,
            ],
        ],
        'hidden' => false,
    ],
    [
        'id' => 'cf-yvdusf-addons',
        'name' => 'Barista Add-on Offers',
        'nameAr' => "\u{0639}\u{0631}\u{0648}\u{0636} \u{0625}\u{0636}\u{0627}\u{0641}\u{0627}\u{062a} \u{0627}\u{0644}\u{0628}\u{0627}\u{0631}\u{064a}\u{0633}\u{062a}\u{0627}",
        'description' => 'Optional kits bundled with this machine.',
        'type' => 'Multiple Choice',
        'required' => false,
        'extraPrice' => 0,
        'options' => [
            [
                'label' => 'Precision Tamper',
                'labelAr' => "\u{062a}\u{0627}\u{0645}\u{0628}\u{0631} \u{062f}\u{0642}\u{064a}\u{0642}",
                'imageUrl' => '/images/hibrew_barista_kit_isolated.jpg',
                'price' => 99,
                'compareAtPrice' => 199,
            ],
            [
                'label' => 'Digital Scale',
                'labelAr' => "\u{0645}\u{064a}\u{0632}\u{0627}\u{0646} \u{0631}\u{0642}\u{0645}\u{064a}",
                'imageUrl' => '/images/hibrew_scale_isolated.jpg',
                'price' => 79,
                'compareAtPrice' => 149,
            ],
            [
                'label' => 'Milk Pitcher',
                'labelAr' => "\u{0625}\u{0628}\u{0631}\u{064a}\u{0642} \u{0627}\u{0644}\u{062d}\u{0644}\u{064a}\u{0628}",
                'imageUrl' => '/images/espresso_wood_pitcher_1791363392554.jpg',
                'price' => 49,
                'compareAtPrice' => 99,
            ],
        ],
        'hidden' => false,
    ],
    [
        'id' => 'cf-yvdusf-care',
        'name' => 'HiBrew Care Package',
        'nameAr' => "\u{0628}\u{0627}\u{0642}\u{0629} \u{0639}\u{0646}\u{0627}\u{064a}\u{0629} \u{0647}\u{0627}\u{064a}\u{0628}\u{0631}\u{0648}",
        'description' => 'Extra care for your espresso machine.',
        'type' => 'Single Choice',
        'required' => false,
        'extraPrice' => 0,
        'options' => [
            [
                'label' => 'Care Pro 1 Year',
                'labelAr' => "\u{0639}\u{0646}\u{0627}\u{064a}\u{0629} \u{0628}\u{0631}\u{0648} \u{0644}\u{0633}\u{0646}\u{0629}",
                'imageUrl' => '/images/hibrew_ceramic_cup_isolated.jpg',
                'price' => 99,
                'compareAtPrice' => 199,
            ],
            [
                'label' => 'Care Pro 2 Years',
                'labelAr' => "\u{0639}\u{0646}\u{0627}\u{064a}\u{0629} \u{0628}\u{0631}\u{0648} \u{0644}\u{0633}\u{0646}\u{062a}\u{064a}\u{0646}",
                'imageUrl' => '/images/hibrew_cabinet_isolated.jpg',
                'price' => 179,
                'compareAtPrice' => 299,
            ],
        ],
        'hidden' => false,
    ],
];

$product = Product::withoutGlobalScope('store')
    ->where('store_id', $storeId)
    ->where('id', $childId)
    ->first();

if (! $product) {
    fwrite(STDERR, "FAIL: product {$childId} not found for {$storeId}\n");
    exit(1);
}

$existing = is_array($product->custom_fields) ? $product->custom_fields : [];
$byId = [];
foreach ($existing as $row) {
    if (! is_array($row) || empty($row['id'])) {
        continue;
    }
    $byId[(string) $row['id']] = $row;
}

foreach ($demoFields as $field) {
    $byId[$field['id']] = $field;
}

$merged = array_values($byId);
$product->custom_fields = $merged;
$product->save();

echo 'OK: saved '.count($demoFields)." Honor-style purchase field(s) on {$childId} (total custom_fields: ".count($merged).")\n";
