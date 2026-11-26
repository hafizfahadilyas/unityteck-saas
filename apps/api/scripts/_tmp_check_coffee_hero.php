<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$row = DB::table('store_themes')->where('store_id', 'store-coffee')->first();
$settings = json_decode((string) ($row->settings ?? '{}'), true);
$hero = $settings['heroBanners'] ?? [];
echo 'contentMode=' . ($hero['contentMode'] ?? 'null') . PHP_EOL;
echo 'banners=' . count($hero['banners'] ?? []) . PHP_EOL;
echo 'imageOnly=' . count($hero['imageOnlyBanners'] ?? []) . PHP_EOL;
echo 'enabled=' . (($hero['enabled'] ?? false) ? '1' : '0') . PHP_EOL;
echo 'fsb=' . count($settings['featuredSectionBanners']['banners'] ?? []) . PHP_EOL;
$ids = [];
foreach (($hero['banners'] ?? []) as $b) {
    $ids[] = $b['productId'] ?? '';
}
echo 'banner_products=' . implode(',', $ids) . PHP_EOL;
