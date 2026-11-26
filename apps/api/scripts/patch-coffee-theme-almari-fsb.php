<?php

/**
 * Patch store-coffee featuredSectionBanners + featuredProducts to the 5 almari SKUs.
 * Run: php apps/api/scripts/patch-coffee-theme-almari-fsb.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$storeId = 'store-coffee';
$theme = DB::table('store_themes')->where('store_id', $storeId)->first();
if (!$theme) {
    fwrite(STDERR, "NO_THEME\n");
    exit(1);
}

$settings = json_decode((string) ($theme->settings ?? '{}'), true);
if (!is_array($settings)) {
    $settings = [];
}

$oak = '/images/ksa_almari_fluted_oak.png';
$mrb = '/images/ksa_almari_black_gold.png';
$mkk = '/images/ksa_almari_makkah_corner.png';
$njd = '/images/ksa_almari_najdi_heritage.png';
$vil = '/images/ksa_almari_dual_door_villa.png';

$settings['featuredSectionBanners'] = [
    'enabled' => true,
    'titleEn' => 'Featured KSA Coffee Almari',
    'titleAr' => 'دواليب القهوة المميزة للسعودية',
    'subtitleEn' => 'Oak, marble, Najdi heritage, and villa dual-door cabinets.',
    'subtitleAr' => 'بلوط ورخام وتراث نجدي ودواليب فلل ببابين.',
    'banners' => [
        [
            'id' => 'fsb-oak',
            'enabled' => true,
            'bgColor' => '#F5EADA',
            'images' => [$oak, $njd],
            'promoEn' => 'Riyadh villa',
            'promoAr' => 'فلل الرياض',
            'titleEn' => 'Riyadh Fluted Oak Coffee Almari',
            'titleAr' => 'دولاب قهوة بلوط محزّز للرياض',
            'descriptionEn' => 'Stone top, soft-close drawers, concealed power track.',
            'descriptionAr' => 'سطح حجري وأدراج ناعمة ومسار كهرباء مخفي.',
            'showPrice' => true,
            'price' => '2890',
            'currency' => 'SAR',
            'productId' => 'hb-almari-fluted-oak',
            'textColor' => '#1a110c',
            'align' => 'left',
            'overlay' => 'none',
            'overlayOpacity' => 0,
            'buttons' => [
                ['id' => 'fsb-oak-buy', 'enabled' => true, 'type' => 'buy', 'labelEn' => 'Buy Now', 'labelAr' => 'اشتر الآن', 'url' => '', 'productId' => 'hb-almari-fluted-oak'],
                ['id' => 'fsb-oak-cart', 'enabled' => true, 'type' => 'cart', 'labelEn' => 'Add to Cart', 'labelAr' => 'أضف للسلة', 'url' => '', 'productId' => 'hb-almari-fluted-oak'],
                ['id' => 'fsb-oak-more', 'enabled' => true, 'type' => 'link', 'labelEn' => 'Learn More', 'labelAr' => 'تعرف على المزيد', 'url' => 'product-detail', 'productId' => 'hb-almari-fluted-oak'],
            ],
        ],
        [
            'id' => 'fsb-marble',
            'enabled' => true,
            'bgColor' => '#F8E2D8',
            'images' => [$mrb, $mkk],
            'promoEn' => 'Jeddah modern',
            'promoAr' => 'جدة الحديثة',
            'titleEn' => 'Jeddah Black Gold Coffee Almari',
            'titleAr' => 'دولاب قهوة أسود وذهبي لجدة',
            'descriptionEn' => 'Matte white, soft-gold handles, dual storage doors.',
            'descriptionAr' => 'أبيض مطفي ومقابض ذهبية وبابان للتخزين.',
            'showPrice' => true,
            'price' => '2490',
            'currency' => 'SAR',
            'productId' => 'hb-almari-white-marble',
            'textColor' => '#1a110c',
            'align' => 'left',
            'overlay' => 'none',
            'overlayOpacity' => 0,
            'buttons' => [
                ['id' => 'fsb-marble-buy', 'enabled' => true, 'type' => 'buy', 'labelEn' => 'Buy Now', 'labelAr' => 'اشتر الآن', 'url' => '', 'productId' => 'hb-almari-white-marble'],
                ['id' => 'fsb-marble-more', 'enabled' => true, 'type' => 'link', 'labelEn' => 'Learn More', 'labelAr' => 'تعرف على المزيد', 'url' => 'product-detail', 'productId' => 'hb-almari-white-marble'],
            ],
        ],
        [
            'id' => 'fsb-villa',
            'enabled' => true,
            'bgColor' => '#E6ECE5',
            'images' => [$vil, $njd],
            'promoEn' => 'Villa flagship',
            'promoAr' => 'إصدار الفلل',
            'titleEn' => 'KSA Dual-Door Villa Coffee Almari',
            'titleAr' => 'دولاب قهوة فاخر ببابين للفلل',
            'descriptionEn' => 'Smoked oak, glass doors, espresso niche.',
            'descriptionAr' => 'بلوط مدخّن وأبواب زجاجية وركن إسبريسو.',
            'showPrice' => true,
            'price' => '3490',
            'currency' => 'SAR',
            'productId' => 'hb-almari-dual-door-villa',
            'textColor' => '#1a110c',
            'align' => 'left',
            'overlay' => 'none',
            'overlayOpacity' => 0,
            'buttons' => [
                ['id' => 'fsb-villa-buy', 'enabled' => true, 'type' => 'buy', 'labelEn' => 'Buy Now', 'labelAr' => 'اشتر الآن', 'url' => '', 'productId' => 'hb-almari-dual-door-villa'],
                ['id' => 'fsb-villa-more', 'enabled' => true, 'type' => 'link', 'labelEn' => 'Learn More', 'labelAr' => 'تعرف على المزيد', 'url' => 'product-detail', 'productId' => 'hb-almari-dual-door-villa'],
            ],
        ],
    ],
];

$settings['featuredProducts'] = array_merge($settings['featuredProducts'] ?? [], [
    'enabled' => true,
    'titleEn' => 'All Products',
    'titleAr' => 'جميع المنتجات',
    'descriptionEn' => 'KSA coffee almari cabinets for villas, apartments, and majlis corners.',
    'descriptionAr' => 'دواليب قهوة سعودية للفلل والشقق وأركان المجالس.',
    'tabs' => [
        ['id' => 'fp-all', 'enabled' => true, 'labelEn' => 'Latest Product', 'labelAr' => 'أحدث المنتجات', 'categoryId' => 'all'],
        ['id' => 'fp-cabinets', 'enabled' => true, 'labelEn' => 'Coffee Cabinets', 'labelAr' => 'دواليب وأركان القهوة', 'categoryId' => 'cabinets'],
    ],
    'productCount' => 5,
]);

$wpOak = '/images/coffee_wallpaper_oak_desktop.webp';
$wpNjd = '/images/coffee_wallpaper_najdi_heritage_desktop.webp';
$wpVil = '/images/coffee_wallpaper_villa_desktop.webp';

$settings['imageBanners'] = [
    'enabled' => true,
    'layout' => 'grid',
    'columnsDesktop' => 3,
    'columnsMobile' => 1,
    'items' => [
        ['id' => 'img-oak', 'enabled' => true, 'image' => $wpOak, 'titleEn' => 'Oak Almari', 'titleAr' => 'دواليب البلوط', 'subtitleEn' => 'Fluted oak for Riyadh villas', 'subtitleAr' => 'بلوط محزّز لفلل الرياض', 'link' => 'products', 'buttonEn' => 'Shop now', 'buttonAr' => 'تسوّق الآن', 'overlay' => 'gradient', 'altEn' => 'Riyadh fluted oak coffee almari cabinets', 'altAr' => 'دواليب قهوة بلوط محزّز للرياض'],
        ['id' => 'img-marble', 'enabled' => true, 'image' => $wpNjd, 'titleEn' => 'Najdi Almari', 'titleAr' => 'دولاب قهوة نجدي', 'subtitleEn' => 'Saudi heritage coffee cabinets', 'subtitleAr' => 'دواليب قهوة بتراث سعودي نجدي', 'link' => 'products', 'buttonEn' => 'Shop now', 'buttonAr' => 'تسوّق الآن', 'overlay' => 'gradient', 'altEn' => 'Najdi Saudi heritage coffee almari', 'altAr' => 'دولاب قهوة بتراث نجدي سعودي'],
        ['id' => 'img-villa', 'enabled' => true, 'image' => $wpVil, 'titleEn' => 'Villa Dual-Door', 'titleAr' => 'دواليب الفلل ببابين', 'subtitleEn' => 'Smoked oak statement pieces', 'subtitleAr' => 'قطع بلوط مدخّن مميزة', 'link' => 'products', 'buttonEn' => 'Shop now', 'buttonAr' => 'تسوّق الآن', 'overlay' => 'gradient', 'altEn' => 'KSA dual-door villa coffee almari', 'altAr' => 'دواليب قهوة فاخرة ببابين للفلل'],
    ],
];

$settings['productCarouselBanner'] = array_merge($settings['productCarouselBanner'] ?? [], [
    'enabled' => false,
    'bannerImage' => '',
    'titleEn' => '',
    'titleAr' => '',
    'subtitleEn' => '',
    'subtitleAr' => '',
]);

DB::table('store_themes')->where('store_id', $storeId)->update([
    'settings' => json_encode($settings, JSON_UNESCAPED_UNICODE),
    'updated_at' => now(),
]);

echo "FSB_PATCHED=1\n";
