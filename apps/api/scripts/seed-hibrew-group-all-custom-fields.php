<?php

/**
 * Replace old HiBrew group demo with a fresh parent + 3 children.
 * Each child gets the full Custom Fields suite so the single buy page shows every type.
 *
 * Usage: php scripts/seed-hibrew-group-all-custom-fields.php
 */

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use App\Models\ProductGroupMember;
use App\Support\CoffeeGroupedProducts;
use App\Support\ProductStorefront;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';
$stamp = 'cfdemo';
$parentId = 'prod-grp-'.$stamp;
$childIds = [
    'prod-grp-c1-'.$stamp,
    'prod-grp-c2-'.$stamp,
    'prod-grp-c3-'.$stamp,
];

if (! Schema::hasTable('product_group_members')) {
    fwrite(STDERR, "FAIL: product_group_members missing\n");
    exit(1);
}
if (! Schema::hasColumn('products', 'custom_fields')) {
    fwrite(STDERR, "FAIL: products.custom_fields missing\n");
    exit(1);
}
if (! CoffeeGroupedProducts::allowedForStoreId($storeId)) {
    fwrite(STDERR, "FAIL: coffee gate rejected {$storeId}\n");
    exit(1);
}

function buildCustomFields(string $childKey, string $stamp): array
{
    $p = "cf-{$stamp}-{$childKey}";

    return [
        [
            'id' => "{$p}-short",
            'name' => 'Gift note',
            'nameAr' => 'ملاحظة الهدية',
            'description' => 'Short text for the gift card.',
            'type' => 'Short Text',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-long",
            'name' => 'Special instructions',
            'nameAr' => 'تعليمات خاصة',
            'description' => 'Long text for delivery / setup notes.',
            'type' => 'Long Text',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-number",
            'name' => 'Quantity of cups',
            'nameAr' => 'عدد الأكواب',
            'type' => 'Number',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-single-text",
            'name' => 'Extraction Profile',
            'nameAr' => 'ملف الاستخلاص',
            'description' => 'Single Choice – Text',
            'type' => 'Single Choice',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                ['label' => 'Standard 15 Bar', 'labelAr' => 'قياسي 15 بار', 'price' => 0],
                ['label' => 'Commercial 20 Bar', 'labelAr' => 'تجاري 20 بار', 'price' => 49],
                ['label' => 'Turbo Bloom', 'labelAr' => 'تيربو بلوم', 'price' => 99, 'compareAtPrice' => 149],
            ],
        ],
        [
            'id' => "{$p}-single-img",
            'name' => 'Care Package',
            'nameAr' => 'باقة العناية',
            'description' => 'Single Choice – Image',
            'type' => 'Single Choice Image',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                [
                    'label' => 'Care Pro 1 Year',
                    'labelAr' => 'عناية برو لسنة',
                    'imageUrl' => '/images/hibrew_scale_isolated.jpg',
                    'price' => 99,
                    'compareAtPrice' => 199,
                ],
                [
                    'label' => 'Care Pro 2 Years',
                    'labelAr' => 'عناية برو لسنتين',
                    'imageUrl' => '/images/hibrew_barista_kit_isolated.jpg',
                    'price' => 179,
                    'compareAtPrice' => 299,
                ],
            ],
        ],
        [
            'id' => "{$p}-single-color",
            'name' => 'Machine color',
            'nameAr' => 'لون الماكينة',
            'description' => 'Single Choice – Color',
            'type' => 'Single Choice Color',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                ['label' => 'Silver', 'labelAr' => 'فضي', 'color' => '#C0C0C0', 'price' => 0],
                ['label' => 'Black', 'labelAr' => 'أسود', 'color' => '#111111', 'price' => 49],
                ['label' => 'Copper', 'labelAr' => 'نحاسي', 'color' => '#B87333', 'price' => 79],
            ],
        ],
        [
            'id' => "{$p}-multi-text",
            'name' => 'Extra services',
            'nameAr' => 'خدمات إضافية',
            'description' => 'Multiple Choice – Text',
            'type' => 'Multiple Choice',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                ['label' => 'Express setup', 'labelAr' => 'تركيب سريع', 'price' => 49],
                ['label' => 'Training session', 'labelAr' => 'جلسة تدريب', 'price' => 99],
            ],
        ],
        [
            'id' => "{$p}-multi-img",
            'name' => 'Barista Add-on Offers',
            'nameAr' => 'عروض إضافات الباريستا',
            'description' => 'Multiple Choice – Image',
            'type' => 'Multiple Choice Image',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                [
                    'label' => 'Precision Tamper',
                    'labelAr' => 'تامبر دقيق',
                    'imageUrl' => '/images/hibrew_barista_kit_isolated.jpg',
                    'price' => 99,
                    'compareAtPrice' => 199,
                ],
                [
                    'label' => 'Digital Scale',
                    'labelAr' => 'ميزان رقمي',
                    'imageUrl' => '/images/hibrew_scale_isolated.jpg',
                    'price' => 79,
                    'compareAtPrice' => 149,
                ],
                [
                    'label' => 'Milk Pitcher',
                    'labelAr' => 'إبريق الحليب',
                    'imageUrl' => '/images/espresso_wood_pitcher_1791363392554.jpg',
                    'price' => 49,
                    'compareAtPrice' => 99,
                ],
            ],
        ],
        [
            'id' => "{$p}-multi-color",
            'name' => 'Accent colors',
            'nameAr' => 'ألوان إضافية',
            'description' => 'Multiple Choice – Color',
            'type' => 'Multiple Choice Color',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                ['label' => 'Teal', 'labelAr' => 'تيل', 'color' => '#1d8b94', 'price' => 19],
                ['label' => 'Gold', 'labelAr' => 'ذهبي', 'color' => '#D4AF37', 'price' => 29],
                ['label' => 'Rose', 'labelAr' => 'وردي', 'color' => '#e11d48', 'price' => 29],
            ],
        ],
        [
            'id' => "{$p}-img-upload",
            'name' => 'Upload logo',
            'nameAr' => 'رفع الشعار',
            'description' => 'Image Upload',
            'type' => 'Image Upload',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 25,
            'options' => [],
        ],
        [
            'id' => "{$p}-file-upload",
            'name' => 'Upload PDF brief',
            'nameAr' => 'رفع ملف PDF',
            'description' => 'File Upload',
            'type' => 'File Upload',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-date",
            'name' => 'Delivery date',
            'nameAr' => 'تاريخ التوصيل',
            'type' => 'Date',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-time",
            'name' => 'Preferred time',
            'nameAr' => 'الوقت المفضل',
            'type' => 'Time',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-datetime",
            'name' => 'Install slot',
            'nameAr' => 'موعد التركيب',
            'type' => 'Date and Time',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-location",
            'name' => 'Install city',
            'nameAr' => 'مدينة التركيب',
            'type' => 'Location',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-color-picker",
            'name' => 'Custom paint',
            'nameAr' => 'طلاء مخصص',
            'description' => 'Color Picker',
            'type' => 'Color Selector',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 120,
            'options' => [],
        ],
        [
            'id' => "{$p}-size",
            'name' => 'Counter size',
            'nameAr' => 'مقاس الركن',
            'description' => 'Size Selector',
            'type' => 'Size Selector',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [
                ['label' => 'S', 'labelAr' => 'صغير', 'price' => 0],
                ['label' => 'M', 'labelAr' => 'وسط', 'price' => 49],
                ['label' => 'L', 'labelAr' => 'كبير', 'price' => 99],
            ],
        ],
        [
            'id' => "{$p}-divider",
            'name' => 'Divider',
            'nameAr' => 'فاصل',
            'type' => 'Divider',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
        ],
        [
            'id' => "{$p}-content",
            'name' => 'Why this model',
            'nameAr' => 'لماذا هذا الموديل',
            'description' => 'Content block on the buy page',
            'type' => 'Content',
            'required' => false,
            'hidden' => false,
            'extraPrice' => 0,
            'options' => [],
            'contentEn' => "This {$childKey} edition includes full custom fields demo for HiBrew KSA.",
            'contentAr' => "هذا الموديل ({$childKey}) يعرض كل أنواع الحقول المخصصة في هايبرو السعودية.",
            'imageUrl' => '/images/hibrew_h7a_flagship_machine.png',
        ],
    ];
}

$childrenMeta = [
    [
        'id' => $childIds[0],
        'key' => 'silver',
        'name' => 'HiBrew Silver Pro (Group Child)',
        'nameAr' => 'هايبرو سيلفر برو',
        'sku' => 'GRP-CF-SILVER',
        'price' => 1999,
        'original' => 2299,
        'stock' => 12,
        'image' => '/images/group_demo_child_silver.jpg',
    ],
    [
        'id' => $childIds[1],
        'key' => 'grinder',
        'name' => 'HiBrew Precision Grinder (Group Child)',
        'nameAr' => 'طاحونة هايبرو الدقيقة',
        'sku' => 'GRP-CF-GRINDER',
        'price' => 749,
        'original' => 899,
        'stock' => 18,
        'image' => '/images/hibrew_scale_isolated.jpg',
    ],
    [
        'id' => $childIds[2],
        'key' => 'black',
        'name' => 'HiBrew Compact Black (Group Child)',
        'nameAr' => 'هايبرو كومباكت أسود',
        'sku' => 'GRP-CF-BLACK',
        'price' => 399,
        'original' => 549,
        'stock' => 20,
        'image' => '/images/hibrew_h7a_flagship_machine.png',
    ],
];

echo "Scanning old group demos for {$storeId}…\n";

$oldQuery = Product::withoutGlobalScope('store')
    ->where('store_id', $storeId)
    ->where(function ($q) use ($parentId, $childIds) {
        $q->whereIn('sku', [
            'GRP-CHILD-SILVER',
            'GRP-CHILD-GRINDER',
            'GRP-CHILD-BLACK',
            'GRP-DEMO-01',
            'GRP-DEMO',
            'GRP-CF-PARENT',
            'GRP-CF-SILVER',
            'GRP-CF-GRINDER',
            'GRP-CF-BLACK',
        ])
            ->orWhereIn('id', array_merge(
                [$parentId, 'prod-grp-live-yvdusf', 'prod-c1-yvdusf', 'prod-c2-yvdusf', 'prod-c3-yvdusf'],
                $childIds
            ))
            ->orWhere('id', 'like', 'prod-c1-yvdusf%')
            ->orWhere('id', 'like', 'prod-c2-yvdusf%')
            ->orWhere('id', 'like', 'prod-c3-yvdusf%')
            ->orWhere('id', 'like', 'prod-grp-demo%')
            ->orWhere('id', 'like', 'prod-grp-live-%')
            ->orWhere('sku', 'like', 'GRP-CHILD-%')
            ->orWhere('sku', 'like', 'GRP-DEMO%')
            ;
    });

$oldIds = $oldQuery->pluck('id')->map(fn ($id) => (string) $id)->unique()->values()->all();
echo 'Old rows: '.count($oldIds).' '.implode(',', $oldIds)."\n";

DB::transaction(function () use ($storeId, $oldIds, $parentId, $childIds, $childrenMeta, $stamp) {
    if ($oldIds) {
        ProductGroupMember::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where(function ($q) use ($oldIds) {
                $q->whereIn('parent_product_id', $oldIds)->orWhereIn('child_product_id', $oldIds);
            })
            ->delete();
        Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereIn('id', $oldIds)
            ->delete();
        echo "Removed old group demo products\n";
    }

    ProductGroupMember::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->where(function ($q) use ($parentId, $childIds) {
            $q->where('parent_product_id', $parentId)->orWhereIn('child_product_id', $childIds);
        })
        ->delete();
    Product::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->whereIn('id', array_merge([$parentId], $childIds))
        ->delete();

    Product::withoutGlobalScope('store')->create([
        'id' => $parentId,
        'store_id' => $storeId,
        'name' => 'HiBrew Custom Fields Group',
        'name_ar' => 'مجموعة حقول هايبرو المخصصة',
        'slug' => 'hibrew-custom-fields-group-'.$stamp,
        'description' => 'Grouped parent — switch children; all custom field types show on buy.',
        'price' => 0,
        'original_price' => 0,
        'sku' => 'GRP-CF-PARENT',
        'stock' => 0,
        'product_type' => CoffeeGroupedProducts::PRODUCT_TYPE,
        'status' => 'published',
        'is_active' => true,
        'image_url' => '/images/hibrew_h7a_flagship_machine.png',
        'gallery_urls' => ['/images/hibrew_h7a_flagship_machine.png'],
        'tags' => [],
        'category' => 'machines',
        'custom_fields' => [],
    ]);
    echo "Created parent {$parentId}\n";

    foreach ($childrenMeta as $i => $c) {
        $fields = buildCustomFields($c['key'], $stamp);
        Product::withoutGlobalScope('store')->create([
            'id' => $c['id'],
            'store_id' => $storeId,
            'name' => $c['name'],
            'name_ar' => $c['nameAr'],
            'slug' => 'hibrew-'.$c['key'].'-'.$stamp,
            'description' => 'Independent child '.$c['key'].' with full custom fields suite.',
            'price' => $c['price'],
            'original_price' => $c['original'],
            'sku' => $c['sku'],
            'stock' => $c['stock'],
            'product_type' => 'Physical Product',
            'status' => 'published',
            'is_active' => true,
            'image_url' => $c['image'],
            'gallery_urls' => [$c['image']],
            'tags' => [],
            'category' => 'machines',
            'custom_fields' => $fields,
        ]);
        ProductGroupMember::withoutGlobalScope('store')->create([
            'id' => 'pgm-'.$stamp.'-'.$i,
            'store_id' => $storeId,
            'parent_product_id' => $parentId,
            'child_product_id' => $c['id'],
            'sort_order' => $i,
            'selector_image_url' => $c['image'],
        ]);
        echo 'Created child '.$c['id'].' fields='.count($fields)."\n";
    }
});

$parent = Product::withoutGlobalScope('store')->where('id', $parentId)->firstOrFail();
$enriched = ProductStorefront::enrichRow($parent);
$kids = $enriched['group_children'] ?? [];
$fieldCount = is_array($kids[0]['customFields'] ?? null)
    ? count($kids[0]['customFields'])
    : (is_array($kids[0]['custom_fields'] ?? null) ? count($kids[0]['custom_fields']) : 0);

if (($enriched['is_grouped'] ?? false) !== true || count($kids) !== 3) {
    fwrite(STDERR, 'FAIL: enrich expected grouped + 3 kids, got '.count($kids)."\n");
    exit(1);
}

echo "PASS: parent={$parentId} children=".implode(',', $childIds)." child0_fields={$fieldCount}\n";
echo "Open: /product/hibrew-custom-fields-group-{$stamp} (or admin Products → GRP-CF-PARENT)\n";
