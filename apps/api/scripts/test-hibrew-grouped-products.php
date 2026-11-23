<?php

/**
 * Live DB smoke: create HiBrew grouped parent + 3 children, sync members, enrich, cleanup optional.
 * Usage: php scripts/test-hibrew-grouped-products.php [--keep]
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\ProductGroupMember;
use App\Support\CoffeeGroupedProducts;
use App\Support\ProductStorefront;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

$keep = in_array('--keep', $argv, true);
$storeId = 'store-coffee';

if (! Schema::hasTable('product_group_members')) {
    fwrite(STDERR, "FAIL: product_group_members missing — run ensure-product-group-members-table.php first\n");
    exit(1);
}

if (! CoffeeGroupedProducts::allowedForStoreId($storeId)) {
    fwrite(STDERR, "FAIL: coffee gate rejected store-coffee\n");
    exit(1);
}

$stamp = strtolower(Str::random(6));
$parentId = 'prod-grp-test-'.$stamp;
$childIds = [
    'prod-grp-c1-'.$stamp,
    'prod-grp-c2-'.$stamp,
    'prod-grp-c3-'.$stamp,
];

echo "Creating parent {$parentId} + 3 children…\n";

$parent = Product::withoutGlobalScope('store')->create([
    'id' => $parentId,
    'store_id' => $storeId,
    'name' => 'HiBrew Group Test '.$stamp,
    'name_ar' => 'مجموعة اختبار هايبرو '.$stamp,
    'slug' => 'hibrew-group-test-'.$stamp,
    'description' => 'Parent group shell — not for sale',
    'price' => 0,
    'sku' => 'GRP-TEST-'.$stamp,
    'stock' => 0,
    'product_type' => CoffeeGroupedProducts::PRODUCT_TYPE,
    'status' => 'published',
    'is_active' => true,
    'image_url' => '/images/hibrew_h7a_flagship_machine.png',
    'gallery_urls' => [],
    'tags' => [],
]);

$prices = [1299, 1599, 1899];
foreach ($childIds as $i => $cid) {
    Product::withoutGlobalScope('store')->create([
        'id' => $cid,
        'store_id' => $storeId,
        'name' => 'Group Child '.($i + 1).' '.$stamp,
        'name_ar' => 'منتج فرعي '.($i + 1).' '.$stamp,
        'slug' => 'group-child-'.($i + 1).'-'.$stamp,
        'description' => 'Independent child product '.($i + 1),
        'price' => $prices[$i],
        'original_price' => $prices[$i] + 200,
        'sku' => 'CHILD-'.($i + 1).'-'.$stamp,
        'stock' => 10 + $i,
        'product_type' => 'Physical Product',
        'status' => 'published',
        'is_active' => true,
        'image_url' => '/images/hibrew_h7a_flagship_machine.png',
        'gallery_urls' => [],
        'tags' => [],
    ]);
}

foreach ($childIds as $i => $cid) {
    ProductGroupMember::withoutGlobalScope('store')->create([
        'id' => 'pgm-'.$stamp.'-'.$i,
        'store_id' => $storeId,
        'parent_product_id' => $parentId,
        'child_product_id' => $cid,
        'sort_order' => $i,
        'selector_image_url' => null,
    ]);
}

$parentFresh = Product::withoutGlobalScope('store')->where('id', $parentId)->firstOrFail();
$enriched = ProductStorefront::enrichRow($parentFresh);
$kids = $enriched['group_children'] ?? [];

if (($enriched['is_grouped'] ?? false) !== true) {
    fwrite(STDERR, "FAIL: is_grouped not true\n");
    exit(1);
}
if (($enriched['purchasable'] ?? true) !== false) {
    fwrite(STDERR, "FAIL: parent should not be purchasable\n");
    exit(1);
}
if (count($kids) !== 3) {
    fwrite(STDERR, 'FAIL: expected 3 children, got '.count($kids)."\n");
    exit(1);
}
if ((string) ($kids[1]['sku'] ?? '') !== 'CHILD-2-'.$stamp) {
    fwrite(STDERR, "FAIL: child 2 SKU mismatch\n");
    exit(1);
}
if ((float) ($kids[1]['price'] ?? 0) !== 1599.0) {
    fwrite(STDERR, "FAIL: child 2 price mismatch\n");
    exit(1);
}

$childIdsHidden = ProductStorefront::groupChildIdsForStore($storeId);
foreach ($childIds as $cid) {
    if (! in_array($cid, $childIdsHidden, true)) {
        fwrite(STDERR, "FAIL: child {$cid} not in catalog exclusion list\n");
        exit(1);
    }
}

// Independence: patch child 1 only
Product::withoutGlobalScope('store')->where('id', $childIds[0])->update([
    'price' => 1111,
    'name' => 'Group Child 1 EDITED '.$stamp,
]);
$parentFresh2 = Product::withoutGlobalScope('store')->where('id', $parentId)->firstOrFail();
$enriched2 = ProductStorefront::enrichRow($parentFresh2);
$kids2 = $enriched2['group_children'] ?? [];
if ((float) ($kids2[0]['price'] ?? 0) !== 1111.0) {
    fwrite(STDERR, "FAIL: child 1 edit not reflected\n");
    exit(1);
}
if ((float) ($kids2[1]['price'] ?? 0) !== 1599.0) {
    fwrite(STDERR, "FAIL: child 2 changed when child 1 edited\n");
    exit(1);
}

echo "PASS: grouped parent + 3 independent children OK\n";
echo "parent_id={$parentId}\n";
echo 'children='.implode(',', $childIds)."\n";

if (! $keep) {
    ProductGroupMember::withoutGlobalScope('store')->where('parent_product_id', $parentId)->delete();
    Product::withoutGlobalScope('store')->whereIn('id', array_merge([$parentId], $childIds))->delete();
    echo "CLEANED test rows\n";
} else {
    echo "KEPT test rows for storefront smoke\n";
}
