<?php

/**
 * Ensure platform template store store-souq-default (Premium 500 + common themes + starter catalog).
 * Name: متجر سوق الافتراضي / Souq Default Store
 * Run: php apps/api/scripts/ensure-souq-default-store.php
 *
 * Theme source: docs/37 + docs/_incoming/store-themes-doc.txt (ثيمات المتجر.docx)
 * docs/36 · docs/38
 */

declare(strict_types=1);

$base = dirname(__DIR__);
require $base.'/vendor/autoload.php';
$app = require $base.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\SeoConfig;
use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use App\Models\StoreTheme;
use App\Models\StoreThemeEntitlement;
use App\Services\Store\ProvisionNewStoreService;
use App\Support\Plans;
use Illuminate\Support\Facades\Schema;

/** @var ProvisionNewStoreService $svc */
$svc = app(ProvisionNewStoreService::class);
$store = $svc->ensureTemplateStore();

$themeId = StoreTheme::withoutGlobalScope('store')
    ->where('store_id', $store->id)
    ->value('theme_id');
$ents = Schema::hasTable('store_theme_entitlements')
    ? StoreThemeEntitlement::query()->where('store_id', $store->id)->count()
    : 0;
$products = Product::withoutGlobalScope('store')->where('store_id', $store->id)->count();
$seo = Schema::hasTable('seo_configs')
    ? SeoConfig::withoutGlobalScope('store')->where('store_id', $store->id)->exists()
    : false;
$pay = Schema::hasTable('payment_gateways')
    ? PaymentGateway::withoutGlobalScope('store')->where('store_id', $store->id)->count()
    : 0;
$zones = Schema::hasTable('shipping_zones')
    ? ShippingZone::withoutGlobalScope('store')->where('store_id', $store->id)->count()
    : 0;
$methods = Schema::hasTable('shipping_methods')
    ? ShippingMethod::withoutGlobalScope('store')->where('store_id', $store->id)->count()
    : 0;

echo json_encode([
    'ok' => true,
    'store_id' => $store->id,
    'name' => $store->name,
    'name_en' => ProvisionNewStoreService::TEMPLATE_NAME_EN,
    'slug' => $store->slug,
    'plan' => $store->plan,
    'effective_plan' => Plans::effectiveCode($store),
    'price_sar' => Plans::catalog()['premium']['price_sar'] ?? 500,
    'theme_id' => $themeId,
    'entitlements' => $ents,
    'products' => $products,
    'seo' => $seo,
    'payments' => $pay,
    'shipping_zones' => $zones,
    'shipping_methods' => $methods,
    'demo_domain' => $store->demo_domain,
    'hosting_mode' => $store->hosting_mode,
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT).PHP_EOL;
