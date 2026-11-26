<?php
/**
 * store-coffee only: fix imageBanners duplicate (oak == najdi wallpaper).
 * Points Najdi banner + hero wallpaper refs to new unique heritage assets.
 */
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';
$wpNjdD = '/images/coffee_wallpaper_najdi_heritage_desktop.webp';
$wpNjdM = '/images/coffee_wallpaper_najdi_heritage_mobile.webp';

$theme = DB::table('store_themes')->where('store_id', $storeId)->first();
if (!$theme) {
    fwrite(STDERR, "NO_THEME\n");
    exit(1);
}

$settings = json_decode((string) ($theme->settings ?? '{}'), true);
if (!is_array($settings)) {
    $settings = [];
}

$oldNajdi = [
    '/images/coffee_wallpaper_najdi_desktop.webp',
    '/images/coffee_wallpaper_najdi_desktop.jpg',
    '/images/coffee_wallpaper_najdi_mobile.webp',
    '/images/coffee_wallpaper_najdi_mobile.jpg',
];

$replaceUrl = static function ($url) use ($wpNjdD, $wpNjdM, $oldNajdi) {
    $u = (string) $url;
    if (in_array($u, $oldNajdi, true) || str_contains($u, 'coffee_wallpaper_najdi_desktop') || str_contains($u, 'coffee_wallpaper_najdi_mobile')) {
        return str_contains($u, 'mobile') ? $wpNjdM : $wpNjdD;
    }
    return $u;
};

// imageBanners grid (the 3 cards user screenshotted)
if (!isset($settings['imageBanners']) || !is_array($settings['imageBanners'])) {
    $settings['imageBanners'] = [];
}
$settings['imageBanners']['enabled'] = true;
$settings['imageBanners']['layout'] = $settings['imageBanners']['layout'] ?? 'grid';
$settings['imageBanners']['columnsDesktop'] = $settings['imageBanners']['columnsDesktop'] ?? 3;
$settings['imageBanners']['columnsMobile'] = $settings['imageBanners']['columnsMobile'] ?? 1;
$settings['imageBanners']['items'] = [
    [
        'id' => 'img-oak',
        'enabled' => true,
        'image' => '/images/coffee_wallpaper_oak_desktop.webp',
        'titleEn' => 'Oak Almari',
        'titleAr' => 'دواليب البلوط',
        'subtitleEn' => 'Fluted oak for Riyadh villas',
        'subtitleAr' => 'بلوط محزّز لفلل الرياض',
        'link' => 'products',
        'buttonEn' => 'Shop now',
        'buttonAr' => 'تسوّق الآن',
        'overlay' => 'gradient',
        'altEn' => 'Riyadh fluted oak coffee almari cabinets',
        'altAr' => 'دواليب قهوة بلوط محزّز للرياض',
    ],
    [
        'id' => 'img-marble',
        'enabled' => true,
        'image' => $wpNjdD,
        'titleEn' => 'Najdi Almari',
        'titleAr' => 'دولاب قهوة نجدي',
        'subtitleEn' => 'Saudi heritage coffee cabinets',
        'subtitleAr' => 'دواليب قهوة بتراث سعودي نجدي',
        'link' => 'products',
        'buttonEn' => 'Shop now',
        'buttonAr' => 'تسوّق الآن',
        'overlay' => 'gradient',
        'altEn' => 'Najdi Saudi heritage coffee almari',
        'altAr' => 'دولاب قهوة بتراث نجدي سعودي',
    ],
    [
        'id' => 'img-villa',
        'enabled' => true,
        'image' => '/images/coffee_wallpaper_villa_desktop.webp',
        'titleEn' => 'Villa Dual-Door',
        'titleAr' => 'دواليب الفلل ببابين',
        'subtitleEn' => 'Smoked oak statement pieces',
        'subtitleAr' => 'قطع بلوط مدخّن مميزة',
        'link' => 'products',
        'buttonEn' => 'Shop now',
        'buttonAr' => 'تسوّق الآن',
        'overlay' => 'gradient',
        'altEn' => 'KSA dual-door villa coffee almari',
        'altAr' => 'دواليب قهوة فاخرة ببابين للفلل',
    ],
];

// Walk hero / dual-slider image fields that still point at old najdi twin-of-oak file
$walk = null;
$walk = static function (&$node) use (&$walk, $replaceUrl) {
    if (!is_array($node)) {
        return;
    }
    foreach ($node as $k => &$v) {
        if (is_string($v) && (str_contains($v, 'coffee_wallpaper_najdi_'))) {
            $v = $replaceUrl($v);
        } elseif (is_array($v)) {
            $walk($v);
        }
    }
};
$walk($settings);

$encoded = json_encode($settings, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
DB::table('store_themes')->where('store_id', $storeId)->update([
    'settings' => $encoded,
    'updated_at' => now(),
]);

echo "OK imageBanners najdi heritage wallpaper\n";
echo "najdi=" . $wpNjdD . "\n";
foreach ($settings['imageBanners']['items'] as $it) {
    echo ($it['id'] ?? '?') . ' => ' . ($it['image'] ?? '') . "\n";
}
