<?php

/**
 * Zero-mock: replace store-coffee catalog with 5 real KSA coffee-almari products.
 * Archives every other store-coffee product. Updates dual-hero theme banners to match.
 *
 * Run: php apps/api/scripts/seed-coffee-ksa-almari-5.php
 */

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$storeId = 'store-coffee';
$now = now();

$products = [
    [
        'id' => 'hb-almari-fluted-oak',
        'sku' => 'HB-ALM-OAK-01',
        'name' => 'Riyadh Fluted Oak Coffee Almari',
        'name_ar' => 'دولاب قهوة بلوط محزّز للرياض',
        'slug' => 'riyadh-fluted-oak-coffee-almari',
        'subtitle' => 'American oak · sintered stone top · concealed power track',
        'subtitle_ar' => 'بلوط أمريكي · سطح حجر مقاوم للحرارة · مسار كهرباء مخفي',
        'description' => 'Handcrafted fluted American oak coffee almari sized for Riyadh villas. Includes sintered stone worktop, soft-close drawers, espresso niche, and a concealed power track for machines and grinders. Delivered and assembled across KSA major cities.',
        'description_ar' => 'دولاب قهوة فاخر من خشب البلوط الأمريكي المحزّز مناسب لفلل الرياض. يشمل سطح حجر مقاوم للحرارة، أدراج إغلاق ناعم، ركن للإسبريسو، ومسار كهرباء مخفي للمكائن والمطاحن. يتوفر التوصيل والتركيب في مدن المملكة الرئيسية.',
        'price' => 2890,
        'original_price' => 3290,
        'stock' => 12,
        'image_url' => '/images/ksa_almari_fluted_oak.png',
        'badge' => 'Riyadh Villa',
        'badge_en' => 'Riyadh Villa',
    ],
    [
        'id' => 'hb-almari-white-marble',
        'sku' => 'HB-ALM-MRB-02',
        'name' => 'Jeddah Black Gold Coffee Almari',
        'name_ar' => 'دولاب قهوة أسود وذهبي لجدة',
        'slug' => 'jeddah-black-gold-coffee-almari',
        'subtitle' => 'Matte black · brushed-gold trim · dual storage doors',
        'subtitle_ar' => 'أسود مطفي · إطار ذهبي مصقول · بابان للتخزين',
        'description' => 'Luxury coffee almari for Jeddah apartments: matte black carcass, brushed-gold trim and handles, open machine niche, and dual lower doors for cups and accessories. Compact footprint with hotel-grade finish.',
        'description_ar' => 'دولاب قهوة فاخر يناسب شقق جدة: هيكل أسود مطفي، إطار ومقابض ذهبية مصقولة، ركن مفتوح للماكينة، وبابان سفليان للأكواب والمستلزمات. حجم مدمج بتشطيب فندقي.',
        'price' => 2490,
        'original_price' => 2790,
        'stock' => 18,
        'image_url' => '/images/ksa_almari_black_gold.png',
        'badge' => 'Jeddah Modern',
        'badge_en' => 'Jeddah Modern',
    ],
    [
        'id' => 'hb-almari-makkah-corner',
        'sku' => 'HB-ALM-MKK-03',
        'name' => 'Makkah Compact Corner Coffee Almari',
        'name_ar' => 'ركن قهوة مدمج لمكة المكرمة',
        'slug' => 'makkah-compact-corner-coffee-almari',
        'subtitle' => 'L-shaped · light walnut · cup hooks · cable tray',
        'subtitle_ar' => 'شكل حرف L · جوز فاتح · علاقات أكواب · مسار أسلاك',
        'description' => 'Space-saving L-shaped corner almari designed for Makkah homes. Light walnut finish, cup hooks, hidden cable tray, and a prep shelf sized for home espresso kits without crowding the kitchen.',
        'description_ar' => 'ركن قهوة بشكل حرف L لتوفير المساحة في منازل مكة. تشطيب جوز فاتح، علاقات للأكواب، مسار أسلاك مخفي، ورف تحضير يناسب أطقم الإسبريسو المنزلية دون إزدحام المطبخ.',
        'price' => 1990,
        'original_price' => 2290,
        'stock' => 22,
        'image_url' => '/images/ksa_almari_makkah_corner.png',
        'badge' => 'Space Saver',
        'badge_en' => 'Space Saver',
    ],
    [
        'id' => 'hb-almari-najdi-heritage',
        'sku' => 'HB-ALM-NJD-04',
        'name' => 'Najdi Heritage Walnut Coffee Station',
        'name_ar' => 'محطة قهوة تراثية نجدية من الجوز',
        'slug' => 'najdi-heritage-walnut-coffee-station',
        'subtitle' => 'Carved geometry · brass accents · camel-tone walnut',
        'subtitle_ar' => 'نقوش هندسية · لمسات نحاسية · جوز بدرجات ترابية',
        'description' => 'Heritage-inspired Najdi coffee station in camel-tone walnut with carved geometric panels and brass accents. Open prep shelf for dallah or espresso gear, closed lower storage for beans and cups. Built for Saudi majlis corners.',
        'description_ar' => 'محطة قهوة بطابع نجدي تراثي من خشب الجوز بدرجات ترابية مع ألواح هندسية منحوتة ولمسات نحاسية. رف مفتوح للتحضير ووحدة تخزين سفلية للبن والأكواب. مصممة لأركان المجالس السعودية.',
        'price' => 3190,
        'original_price' => 3590,
        'stock' => 9,
        'image_url' => '/images/ksa_almari_najdi_heritage.png',
        'badge' => 'Heritage',
        'badge_en' => 'Heritage',
    ],
    [
        'id' => 'hb-almari-dual-door-villa',
        'sku' => 'HB-ALM-VIL-05',
        'name' => 'KSA Dual-Door Villa Coffee Almari',
        'name_ar' => 'دولاب قهوة فاخر ببابين للفلل',
        'slug' => 'ksa-dual-door-villa-coffee-almari',
        'subtitle' => 'Smoked oak · black steel · glass upper doors',
        'subtitle_ar' => 'بلوط مدخّن · فولاذ أسود · أبواب علوية زجاجية',
        'description' => 'Tall dual-door coffee almari for KSA villas: smoked oak with black steel frame, glass upper doors for cup display, espresso niche, and soft-close lower cabinets. Statement piece for open living kitchens.',
        'description_ar' => 'دولاب قهوة طويل ببابين لفلل المملكة: بلوط مدخّن بإطار فولاذي أسود، أبواب علوية زجاجية لعرض الأكواب، ركن للإسبريسو، وخزائن سفلية بإغلاق ناعم. قطعة مميزة للمطابخ المفتوحة.',
        'price' => 3490,
        'original_price' => 3990,
        'stock' => 7,
        'image_url' => '/images/ksa_almari_dual_door_villa.png',
        'badge' => 'Villa Flagship',
        'badge_en' => 'Villa Flagship',
    ],
];

$keepIds = array_column($products, 'id');

DB::transaction(function () use ($storeId, $products, $keepIds, $now) {
    $archived = Product::withoutGlobalScope('store')
        ->where('store_id', $storeId)
        ->whereNotIn('id', $keepIds)
        ->update([
            'status' => 'archived',
            'is_active' => false,
            'updated_at' => $now,
        ]);
    echo "ARCHIVED_OTHERS={$archived}\n";

    foreach ($products as $row) {
        $payload = [
            'store_id' => $storeId,
            'name' => $row['name'],
            'name_ar' => $row['name_ar'],
            'slug' => $row['slug'],
            'subtitle' => $row['subtitle'],
            'subtitle_ar' => $row['subtitle_ar'],
            'description' => $row['description'],
            'price' => $row['price'],
            'original_price' => $row['original_price'],
            'sku' => $row['sku'],
            'stock' => $row['stock'],
            'category' => 'cabinets',
            'category_ar' => 'دواليب وأركان القهوة',
            'brand' => 'HiBrew',
            'product_type' => 'simple',
            'image_url' => $row['image_url'],
            'gallery_urls' => [$row['image_url']],
            'tags' => ['almari', 'cabinets', 'ksa'],
            'badge' => $row['badge'],
            'badge_en' => $row['badge_en'],
            'seo_title' => $row['name'] . ' | HiBrew KSA',
            'seo_description' => $row['description'],
            'status' => 'published',
            'published_at' => $now,
            'is_active' => true,
            'is_featured' => true,
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('products', 'description_ar')) {
            $payload['description_ar'] = $row['description_ar'];
        }

        $existing = Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $row['id'])
            ->first();

        if ($existing) {
            $existing->fill($payload);
            $existing->save();
            echo "UPDATED {$row['id']}\n";
        } else {
            $payload['id'] = $row['id'];
            $payload['created_at'] = $now;
            Product::withoutGlobalScope('store')->create($payload);
            echo "CREATED {$row['id']}\n";
        }
    }
});

// Patch published theme settings hero to dual almari sliders (store-coffee only).
if (Schema::hasTable('store_themes')) {
    $theme = DB::table('store_themes')->where('store_id', $storeId)->first();
    if ($theme) {
        $settings = json_decode((string) ($theme->settings ?? '{}'), true);
        if (!is_array($settings)) {
            $settings = [];
        }

        $wpLifeD = '/images/coffee_wallpaper_lifestyle_desktop.webp';
        $wpLifeM = '/images/coffee_wallpaper_lifestyle_mobile.webp';
        $wpOakD = '/images/coffee_wallpaper_oak_desktop.webp';
        $wpOakM = '/images/coffee_wallpaper_oak_mobile.webp';
        $wpMrbD = '/images/coffee_wallpaper_marble_desktop.webp';
        $wpMrbM = '/images/coffee_wallpaper_marble_mobile.webp';
        $wpNjdD = '/images/coffee_wallpaper_najdi_heritage_desktop.webp';
        $wpNjdM = '/images/coffee_wallpaper_najdi_heritage_mobile.webp';
        $wpVilD = '/images/coffee_wallpaper_villa_desktop.webp';
        $wpVilM = '/images/coffee_wallpaper_villa_mobile.webp';

        $hero = $settings['heroBanners'] ?? [];
        $hero['enabled'] = true;
        $hero['contentMode'] = 'both';
        $hero['autoplay'] = true;
        $hero['intervalMs'] = 6000;
        $hero['showArrows'] = true;
        $hero['showDots'] = true;
        $hero['banners'] = [
            [
                'id' => 'hero-almari-full-1',
                'enabled' => true,
                'image' => $wpOakD,
                'mobileImage' => $wpOakM,
                'tabletImage' => $wpOakD,
                'altEn' => 'Riyadh fluted oak coffee almari wallpaper — KSA villa coffee cabinet',
                'altAr' => 'خلفية دولاب قهوة بلوط محزّز للرياض — خزانة قهوة للفلل السعودية',
                'promoEn' => 'KSA Coffee Almari',
                'promoAr' => 'دولاب القهوة السعودي',
                'titleEn' => 'Riyadh Fluted Oak Coffee Almari',
                'titleAr' => 'دولاب قهوة بلوط محزّز للرياض',
                'descriptionEn' => 'Villa-ready oak almari with stone top and hidden power.',
                'descriptionAr' => 'دولاب بلوط جاهز للفلل مع سطح حجري وكهرباء مخفية.',
                'price' => '2890',
                'productId' => 'hb-almari-fluted-oak',
                'buyNowEn' => 'Shop Now',
                'buyNowAr' => 'تسوق الآن',
                'buyNowEnabled' => true,
                'showPrice' => true,
            ],
            [
                'id' => 'hero-almari-full-2',
                'enabled' => true,
                'image' => $wpNjdD,
                'mobileImage' => $wpNjdM,
                'tabletImage' => $wpNjdD,
                'altEn' => 'Najdi heritage coffee station wallpaper — Saudi majlis',
                'altAr' => 'خلفية محطة قهوة تراثية نجدية — مجالس سعودية',
                'promoEn' => 'Najdi Heritage',
                'promoAr' => 'تراث نجدي',
                'titleEn' => 'Najdi Heritage Walnut Coffee Station',
                'titleAr' => 'محطة قهوة تراثية نجدية من الجوز',
                'descriptionEn' => 'Carved geometry and brass for the Saudi majlis.',
                'descriptionAr' => 'نقوش هندسية ونحاس لمجالس المملكة.',
                'price' => '3190',
                'productId' => 'hb-almari-najdi-heritage',
                'buyNowEn' => 'View Almari',
                'buyNowAr' => 'عرض الدولاب',
                'buyNowEnabled' => true,
                'showPrice' => true,
            ],
            [
                'id' => 'hero-almari-full-3',
                'enabled' => true,
                'image' => $wpVilD,
                'mobileImage' => $wpVilM,
                'tabletImage' => $wpVilD,
                'altEn' => 'KSA dual-door villa coffee almari wallpaper',
                'altAr' => 'خلفية دولاب قهوة فاخر ببابين للفلل',
                'promoEn' => 'Villa Flagship',
                'promoAr' => 'إصدار الفلل',
                'titleEn' => 'KSA Dual-Door Villa Coffee Almari',
                'titleAr' => 'دولاب قهوة فاخر ببابين للفلل',
                'descriptionEn' => 'Smoked oak, glass doors, espresso niche.',
                'descriptionAr' => 'بلوط مدخّن وأبواب زجاجية وركن إسبريسو.',
                'price' => '3490',
                'productId' => 'hb-almari-dual-door-villa',
                'buyNowEn' => 'Buy Almari',
                'buyNowAr' => 'اشترِ الدولاب',
                'buyNowEnabled' => true,
                'showPrice' => true,
            ],
        ];
        $hero['imageOnlyBanners'] = [
            [
                'id' => 'hero-almari-img-1',
                'enabled' => true,
                'image' => $wpLifeD,
                'mobileImage' => $wpLifeM,
                'tabletImage' => $wpLifeD,
                'altEn' => 'Luxury KSA living room coffee almari wallpaper — full-bleed cover',
                'altAr' => 'خلفية مجلس فاخر مع دولاب قهوة سعودي — تغطية كاملة',
                'promoEn' => '',
                'promoAr' => '',
                'titleEn' => 'KSA coffee almari living room',
                'titleAr' => 'دولاب قهوة في مجلس سعودي',
                'descriptionEn' => '',
                'descriptionAr' => '',
                'price' => '',
                'productId' => 'hb-almari-dual-door-villa',
                'buyNowEn' => '',
                'buyNowAr' => '',
                'showPrice' => false,
                'buyNowEnabled' => false,
                'addToCartEnabled' => false,
                'learnMoreEnabled' => false,
                'customOrderEnabled' => false,
            ],
            [
                'id' => 'hero-almari-img-2',
                'enabled' => true,
                'image' => $wpOakD,
                'mobileImage' => $wpOakM,
                'tabletImage' => $wpOakD,
                'altEn' => 'Riyadh fluted oak coffee almari wallpaper — full cover',
                'altAr' => 'خلفية دولاب قهوة بلوط محزّز للرياض — تغطية كاملة',
                'promoEn' => '',
                'promoAr' => '',
                'titleEn' => 'Riyadh fluted oak coffee almari',
                'titleAr' => 'دولاب قهوة بلوط محزّز للرياض',
                'descriptionEn' => '',
                'descriptionAr' => '',
                'price' => '',
                'productId' => 'hb-almari-fluted-oak',
                'buyNowEn' => '',
                'buyNowAr' => '',
                'showPrice' => false,
                'buyNowEnabled' => false,
                'addToCartEnabled' => false,
                'learnMoreEnabled' => false,
                'customOrderEnabled' => false,
            ],
            [
                'id' => 'hero-almari-img-3',
                'enabled' => true,
                'image' => $wpMrbD,
                'mobileImage' => $wpMrbM,
                'tabletImage' => $wpMrbD,
                'altEn' => 'Jeddah black gold coffee almari wallpaper — full-bleed cover',
                'altAr' => 'خلفية دولاب قهوة أسود وذهبي لجدة — تغطية كاملة',
                'promoEn' => '',
                'promoAr' => '',
                'titleEn' => 'Jeddah black gold coffee almari',
                'titleAr' => 'دولاب قهوة أسود وذهبي لجدة',
                'descriptionEn' => '',
                'descriptionAr' => '',
                'price' => '',
                'productId' => 'hb-almari-white-marble',
                'buyNowEn' => '',
                'buyNowAr' => '',
                'showPrice' => false,
                'buyNowEnabled' => false,
                'addToCartEnabled' => false,
                'learnMoreEnabled' => false,
                'customOrderEnabled' => false,
            ],
            [
                'id' => 'hero-almari-img-4',
                'enabled' => true,
                'image' => $wpNjdD,
                'mobileImage' => $wpNjdM,
                'tabletImage' => $wpNjdD,
                'altEn' => 'Najdi heritage coffee station wallpaper — full cover',
                'altAr' => 'خلفية محطة قهوة تراثية نجدية — تغطية كاملة',
                'promoEn' => '',
                'promoAr' => '',
                'titleEn' => 'Najdi heritage coffee station',
                'titleAr' => 'محطة قهوة تراثية نجدية',
                'descriptionEn' => '',
                'descriptionAr' => '',
                'price' => '',
                'productId' => 'hb-almari-najdi-heritage',
                'buyNowEn' => '',
                'buyNowAr' => '',
                'showPrice' => false,
                'buyNowEnabled' => false,
                'addToCartEnabled' => false,
                'learnMoreEnabled' => false,
                'customOrderEnabled' => false,
            ],
        ];
        $settings['heroBanners'] = $hero;

        // Keep featured category rail on cabinets so home/shop mega use real almari SKUs.
        if (isset($settings['featuredCategoriesProducts']['sections'][0])) {
            $settings['featuredCategoriesProducts']['sections'][0]['categoryId'] = 'cabinets';
            $settings['featuredCategoriesProducts']['sections'][0]['productSource'] = 'category';
            $settings['featuredCategoriesProducts']['sections'][0]['productIds'] = $keepIds;
            $settings['featuredCategoriesProducts']['sections'][0]['productCount'] = 5;
        }

        DB::table('store_themes')->where('store_id', $storeId)->update([
            'settings' => json_encode($settings, JSON_UNESCAPED_UNICODE),
            'updated_at' => $now,
        ]);
        echo "THEME_HERO_PATCHED=1\n";
    } else {
        echo "THEME_HERO_PATCHED=0 (no store_themes row)\n";
    }
}

$live = Product::withoutGlobalScope('store')
    ->where('store_id', $storeId)
    ->where('status', 'published')
    ->where('is_active', true)
    ->count();
echo "PUBLISHED_ACTIVE={$live}\n";
echo "DONE\n";
