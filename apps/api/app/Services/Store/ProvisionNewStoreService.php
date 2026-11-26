<?php

namespace App\Services\Store;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Domain;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Models\SeoConfig;
use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use App\Models\Store;
use App\Models\StoreTheme;
use App\Services\Theme\ThemeEntitlementService;
use App\Support\DefaultTheme;
use App\Support\HostingerCloud;
use App\Support\Plans;
use App\Support\SouqCommonSettingsDefaults;
use App\Support\SouqCommonThemes;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Bootstrap every NEW post-pilot store with Souq common defaults.
 * Theme settings source: docs/37 + docs/_incoming/store-themes-doc.txt (ثيمات المتجر.docx @ D:\sueman).
 * docs/36 · docs/38 — Premium 500 unlocks full common theme pack + Pro features.
 *
 * Theme switch never deletes products/orders/customers — only theme_id + settings.by_theme.
 */
final class ProvisionNewStoreService
{
    /** Living template tenant Master can open / clone from (central). */
    public const TEMPLATE_STORE_ID = 'store-souq-default';

    public const TEMPLATE_SLUG = 'souq-default';

    /** Official bilingual name (KSA). */
    public const TEMPLATE_NAME_AR = 'متجر سوق الافتراضي';

    public const TEMPLATE_NAME_EN = 'Souq Default Store';

    public const CENTRAL_HOST = 'mieraf-ksa.com';

    /** Flagships — never overwrite with common pack. */
    private const FLAGSHIP_IDS = ['store-1', 'store-coffee', 'store-bleco'];

    public function __construct(
        private readonly ThemeEntitlementService $entitlements,
    ) {}

    /**
     * Full provision after Store::create (theme, entitlements, builder, catalog, SEO, pay, ship, domain).
     *
     * @return array<string, mixed>
     */
    public function bootstrap(Store $store, bool $seedStarterCatalog = true): array
    {
        if (in_array($store->id, self::FLAGSHIP_IDS, true)) {
            return [
                'theme' => StoreTheme::query()->where('store_id', $store->id)->first(),
                'entitlements' => 0,
                'products' => 0,
                'categories' => 0,
                'seo' => false,
                'payments' => 0,
                'shipping_zones' => 0,
                'shipping_methods' => 0,
                'demo_domain' => $store->demo_domain,
            ];
        }

        SouqCommonThemes::ensureCatalogRows();

        $theme = $this->installDefaultTheme($store);
        $entitled = $this->grantIncludedThemes($store);
        $this->assignCentralDomain($store);
        $seo = $this->seedSeo($store);
        $payments = $this->seedPayments($store);
        [$zones, $methods] = $this->seedShipping($store);
        $welcomeCoupon = $this->seedWelcomeCoupon($store);

        $categories = 0;
        $products = 0;
        if ($seedStarterCatalog) {
            [$categories, $products] = $this->seedStarterCatalog($store);
        }

        $store->refresh();

        return [
            'theme' => $theme,
            'entitlements' => $entitled,
            'products' => $products,
            'categories' => $categories,
            'seo' => $seo,
            'payments' => $payments,
            'shipping_zones' => $zones,
            'shipping_methods' => $methods,
            'welcome_coupon' => $welcomeCoupon,
            'demo_domain' => $store->demo_domain,
        ];
    }

    /**
     * Ensure the platform template store exists (Premium 500 + full pack).
     * Name: متجر سوق الافتراضي / Souq Default Store
     */
    public function ensureTemplateStore(): Store
    {
        $existing = Store::query()->find(self::TEMPLATE_STORE_ID);
        if ($existing) {
            $existing->fill([
                'name' => self::TEMPLATE_NAME_AR,
                'plan' => 'premium',
                'status' => 'active',
                'locale' => 'ar',
                'text_direction' => 'rtl',
                'timezone' => 'Asia/Riyadh',
                'currency' => 'SAR',
                'city' => $existing->city ?: 'Riyadh',
                'country' => $existing->country ?: 'SA',
                'category' => $existing->category ?: 'General Retail',
                'accent_color' => $existing->accent_color ?: '#0f766e',
                'subscription_status' => 'active',
                'demo_domain' => $existing->demo_domain ?: (self::TEMPLATE_SLUG.'.'.self::CENTRAL_HOST),
            ])->save();

            $emptyCatalog = Product::withoutGlobalScope('store')
                ->where('store_id', $existing->id)
                ->count() === 0;
            $this->bootstrap($existing->fresh(), seedStarterCatalog: $emptyCatalog);

            return $existing->fresh();
        }

        $store = Store::query()->create([
            'id' => self::TEMPLATE_STORE_ID,
            'name' => self::TEMPLATE_NAME_AR,
            'slug' => self::TEMPLATE_SLUG,
            'status' => 'active',
            'plan' => 'premium',
            'master_granted_pro' => false,
            'currency' => 'SAR',
            'locale' => 'ar',
            'text_direction' => 'rtl',
            'timezone' => 'Asia/Riyadh',
            'phone' => null,
            'email' => 'default@souq.mieraf-ksa.com',
            'login_email_active' => false,
            'owner_name' => 'منصة سوق',
            'city' => 'Riyadh',
            'country' => 'SA',
            'category' => 'General Retail',
            'logo' => 'store',
            'accent_color' => '#0f766e',
            'hosting_mode' => 'shared',
            'db_isolation' => 'shared_store_id',
            'subscription_status' => 'active',
            'demo_domain' => self::TEMPLATE_SLUG.'.'.self::CENTRAL_HOST,
        ]);

        $this->bootstrap($store, seedStarterCatalog: true);

        return $store->fresh();
    }

    public function installDefaultTheme(Store $store): StoreTheme
    {
        $isTemplate = $store->id === self::TEMPLATE_STORE_ID;
        $nameEn = $isTemplate ? self::TEMPLATE_NAME_EN : (string) ($store->name ?: 'My Store');
        $nameAr = $isTemplate ? self::TEMPLATE_NAME_AR : (string) ($store->name ?: 'متجري');
        $accent = $store->accent_color ?: '#0f766e';
        $planCode = Plans::effectiveCode($store);
        $planMeta = DefaultTheme::settingsForPlan($planCode, $store);
        $common = SouqCommonSettingsDefaults::all();
        $blocks = SouqCommonSettingsDefaults::defaultBuilderBlocks($nameEn, $nameAr, $accent);

        $settings = array_merge($common, [
            'mode' => $planMeta['mode'],
            'homepage_style' => $planMeta['homepage_style'],
            'homepage_styles' => $planMeta['homepage_styles'],
            'sections' => $planMeta['sections'],
            'customizable' => $planMeta['customizable'],
            'branding' => array_merge($common['branding'], [
                'primaryColor' => $accent,
                'store_name' => $store->name,
                'logo' => $store->logo,
            ]),
            'builder' => [
                'published_blocks' => $blocks,
                'draft_blocks' => $blocks,
                'published_at' => now()->toIso8601String(),
            ],
            'by_theme' => [
                DefaultTheme::CATALOG_ID => array_merge($common, [
                    'branding' => array_merge($common['branding'], [
                        'primaryColor' => $accent,
                        'store_name' => $store->name,
                    ]),
                ]),
            ],
            'theme_published_at' => now()->toIso8601String(),
        ]);

        DefaultTheme::ensureCatalogRow();

        $existing = StoreTheme::withoutGlobalScope('store')->where('store_id', $store->id)->first();
        if ($existing) {
            $prev = is_array($existing->settings) ? $existing->settings : [];
            // Platform template store always refreshes default home blocks (easiest styles).
            // Other merchants: never wipe customize/builder if already customized.
            $hasMerchantWork = ! empty($prev['draft']) || ! empty($prev['builder']['draft_blocks'] ?? null);
            if ($hasMerchantWork && $existing->theme_id && ! $isTemplate) {
                return $existing;
            }
            $existing->fill([
                'theme_id' => DefaultTheme::CATALOG_ID,
                'homepage_style' => $planMeta['homepage_style'],
                'settings' => $settings,
            ])->save();

            return $existing->fresh();
        }

        return StoreTheme::withoutGlobalScope('store')->create([
            'id' => 'stheme-'.Str::lower(Str::random(10)),
            'store_id' => $store->id,
            'theme_id' => DefaultTheme::CATALOG_ID,
            'homepage_style' => $planMeta['homepage_style'],
            'settings' => $settings,
        ]);
    }

    /**
     * Grant every common theme included in the store's plan (subscription source).
     */
    public function grantIncludedThemes(Store $store): int
    {
        if (! Schema::hasTable('store_theme_entitlements')) {
            return 0;
        }

        $plan = Plans::effectiveCode($store);
        $count = 0;
        foreach (SouqCommonThemes::definitions() as $def) {
            $tiers = $def['included_in_tiers'] ?? [];
            if (! in_array($plan, $tiers, true) && $plan !== 'custom') {
                continue;
            }
            $this->entitlements->grant(
                $store,
                $def['id'],
                ThemeEntitlementService::SOURCE_SUBSCRIPTION,
                0,
                'provision'
            );
            $count++;
        }

        return $count;
    }

    /**
     * Central Hostinger subdomain: {slug}.mieraf-ksa.com — flowers never uses this path.
     */
    public function assignCentralDomain(Store $store): void
    {
        if (HostingerCloud::isFlowersStore($store->id)) {
            return;
        }

        $slug = trim((string) $store->slug);
        if ($slug === '') {
            $slug = Str::slug((string) $store->id) ?: 'store';
        }
        $host = HostingerCloud::centralHost();
        $demo = strtolower($slug).'.'.$host;

        $forced = HostingerCloud::applyHostingDefaults([], $store->id);
        $updates = [];
        if (Schema::hasColumn('stores', 'demo_domain') && empty($store->demo_domain)) {
            $updates['demo_domain'] = $demo;
        }
        if (Schema::hasColumn('stores', 'hosting_mode')) {
            $updates['hosting_mode'] = $forced['hosting_mode'];
        }
        if (Schema::hasColumn('stores', 'db_isolation')) {
            $updates['db_isolation'] = $forced['db_isolation'];
        }
        if ($updates !== []) {
            $store->fill($updates)->save();
        }

        if (! Schema::hasTable('domains')) {
            return;
        }

        $exists = Domain::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where('domain_name', $demo)
            ->exists();
        if ($exists) {
            return;
        }

        // Avoid unique collision if another store already owns this name
        $taken = Domain::withoutGlobalScope('store')->where('domain_name', $demo)->exists();
        if ($taken) {
            $demo = strtolower((string) $store->id).'.'.$host;
            if (Schema::hasColumn('stores', 'demo_domain')) {
                $store->fill(['demo_domain' => $demo])->save();
            }
            $taken = Domain::withoutGlobalScope('store')->where('domain_name', $demo)->exists();
            if ($taken) {
                return;
            }
        }

        Domain::withoutGlobalScope('store')->create([
            'id' => 'dom-'.Str::lower(Str::random(10)),
            'store_id' => $store->id,
            'domain_name' => $demo,
            'is_primary' => true,
            'ssl_status' => 'active',
            'dns_configured' => false,
            'dns_verified' => false,
            'hosting_tier' => 'Hostinger Cloud',
            'monthly_fee' => 0,
            'payment_received' => true,
            'status' => 'active',
        ]);
    }

    /**
     * Starter catalog for brand-new merchants (EN+AR). Replaceable — not fake KPIs/orders.
     *
     * @return array{0: int, 1: int} categories created, products created
     */
    public function seedStarterCatalog(Store $store): array
    {
        if (! Schema::hasTable('categories') || ! Schema::hasTable('products')) {
            return [0, 0];
        }

        if (Product::withoutGlobalScope('store')->where('store_id', $store->id)->exists()) {
            return [0, 0];
        }

        $catFeatured = Category::withoutGlobalScope('store')->create([
            'id' => 'cat-'.Str::lower(Str::random(8)),
            'store_id' => $store->id,
            'name' => 'Featured',
            'name_ar' => 'مميز',
            'slug' => 'featured',
            'image_url' => '/images/saudi_hero_banner_2.jpg',
            'sort_order' => 1,
            'meta_title' => 'مميز | '.$store->name,
            'meta_description' => 'تصنيف المنتجات المميزة — منصة سوق',
            'is_active' => true,
        ]);
        $catGeneral = Category::withoutGlobalScope('store')->create([
            'id' => 'cat-'.Str::lower(Str::random(8)),
            'store_id' => $store->id,
            'name' => 'General',
            'name_ar' => 'عام',
            'slug' => 'general',
            'image_url' => '/images/saudi_hero_banner_2.jpg',
            'sort_order' => 2,
            'meta_title' => 'عام | '.$store->name,
            'meta_description' => 'التصنيف العام — منصة سوق',
            'is_active' => true,
        ]);

        $defs = [
            [
                'name' => 'Starter Featured Product',
                'name_ar' => 'منتج مميز للبداية',
                'slug' => 'starter-featured',
                'sku' => 'SOUQ-START-01',
                'price' => 99,
                'category_id' => $catFeatured->id,
                'category' => 'Featured',
                'category_ar' => 'مميز',
                'featured' => true,
            ],
            [
                'name' => 'Starter Best Seller',
                'name_ar' => 'الأكثر مبيعاً — بداية',
                'slug' => 'starter-best-seller',
                'sku' => 'SOUQ-START-02',
                'price' => 149,
                'category_id' => $catFeatured->id,
                'category' => 'Featured',
                'category_ar' => 'مميز',
                'featured' => true,
            ],
            [
                'name' => 'Starter New Arrival',
                'name_ar' => 'وصل حديثاً — بداية',
                'slug' => 'starter-new-arrival',
                'sku' => 'SOUQ-START-03',
                'price' => 79,
                'category_id' => $catGeneral->id,
                'category' => 'General',
                'category_ar' => 'عام',
                'featured' => false,
            ],
            [
                'name' => 'Starter Gift Set',
                'name_ar' => 'طقم هدية للبداية',
                'slug' => 'starter-gift-set',
                'sku' => 'SOUQ-START-04',
                'price' => 199,
                'category_id' => $catGeneral->id,
                'category' => 'General',
                'category_ar' => 'عام',
                'featured' => false,
            ],
        ];

        $created = 0;
        foreach ($defs as $def) {
            $row = [
                'id' => 'prod-'.Str::lower(Str::random(10)),
                'store_id' => $store->id,
                'category_id' => $def['category_id'],
                'name' => $def['name'],
                'name_ar' => $def['name_ar'],
                'slug' => $def['slug'],
                'description' => 'Replace this starter product with your real catalog. Souq Platform default seed.',
                'price' => $def['price'],
                'original_price' => null,
                'sku' => $def['sku'].'-'.Str::upper(Str::random(4)),
                'stock' => 25,
                'category' => $def['category'],
                'category_ar' => $def['category_ar'],
                'image_url' => '/images/saudi_hero_banner_2.jpg',
                'status' => 'published',
                'is_active' => true,
            ];
            if (Schema::hasColumn('products', 'is_featured')) {
                $row['is_featured'] = (bool) $def['featured'];
            }
            if (Schema::hasColumn('products', 'published_at')) {
                $row['published_at'] = now();
            }
            if (Schema::hasColumn('products', 'seo_title')) {
                $row['seo_title'] = $def['name_ar'].' | '.$store->name;
            }
            if (Schema::hasColumn('products', 'seo_description')) {
                $row['seo_description'] = 'منتج بداية قابل للاستبدال — منصة سوق';
            }
            Product::withoutGlobalScope('store')->create($row);
            $created++;
        }

        if (Schema::hasColumn('stores', 'products_count')) {
            $store->fill(['products_count' => $created])->save();
        }

        return [2, $created];
    }

    /**
     * Real SEO row for this store only — no fake Google Connected.
     */
    public function seedSeo(Store $store): bool
    {
        if (! Schema::hasTable('seo_configs')) {
            return false;
        }

        $exists = SeoConfig::withoutGlobalScope('store')->where('store_id', $store->id)->exists();
        if ($exists) {
            return true;
        }

        $demo = (string) ($store->demo_domain ?: (self::TEMPLATE_SLUG.'.'.self::CENTRAL_HOST));
        $origin = 'https://'.$demo;
        $brand = $store->id === self::TEMPLATE_STORE_ID
            ? self::TEMPLATE_NAME_AR
            : (string) $store->name;
        $city = trim((string) ($store->city ?: 'Riyadh')) ?: 'Riyadh';
        $cityAr = match (mb_strtolower($city)) {
            'makkah', 'mecca', 'مكة', 'مكة المكرمة' => 'مكة المكرمة',
            'jeddah', 'جدة' => 'جدة',
            'dammam', 'الدمام' => 'الدمام',
            'madinah', 'medina', 'المدينة' => 'المدينة المنورة',
            default => 'الرياض',
        };
        $kwAr = "منصة سوق, متجر إلكتروني, السعودية, تجارة إلكترونية, {$cityAr}, توصيل السعودية";
        $kwEn = "Souq Platform, Saudi e-commerce, KSA online store, {$city}, Saudi delivery";

        SeoConfig::withoutGlobalScope('store')->create([
            'id' => 'seo-'.Str::lower(Str::random(10)),
            'store_id' => $store->id,
            'brand_name' => $brand,
            'city' => $city,
            'country' => 'Saudi Arabia',
            'meta_title' => $brand.' | متجر إلكتروني في '.$cityAr,
            'meta_description' => "متجر {$brand} على منصة سوق — تسوق أونلاين مع توصيل داخل السعودية ({$cityAr}).",
            'keywords' => $kwAr,
            'canonical_url' => $origin.'/',
            'sitemap_enabled' => true,
            'robots_txt' => "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /master\nDisallow: /cart\nDisallow: /checkout\nSitemap: {$origin}/sitemap.xml\n",
            'google_connected' => false,
            'search_console_connected' => false,
            'indexing_api_enabled' => false,
            'sitemap_url' => $origin.'/sitemap.xml',
            'extra' => [
                'meta_title_en' => ($store->id === self::TEMPLATE_STORE_ID ? self::TEMPLATE_NAME_EN : (string) $store->name)." | Online store in {$city}, Saudi Arabia",
                'meta_description_en' => "{$brand} on Souq Platform — shop online with delivery across Saudi Arabia ({$city}).",
                'keywords_en' => $kwEn,
                'keywords_ar' => $kwAr,
            ],
        ]);

        return true;
    }

    /**
     * New-store welcome coupon for first shoppers (store_id isolated — never shared).
     */
    public function seedWelcomeCoupon(Store $store): ?string
    {
        if (! Schema::hasTable('coupons')) {
            return null;
        }

        $code = 'WELCOME10';
        $exists = Coupon::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where('code', $code)
            ->exists();
        if ($exists) {
            return $code;
        }

        try {
            $row = [
                'id' => 'cpn-welcome-'.Str::lower(Str::random(8)),
                'store_id' => $store->id,
                'code' => $code,
                'discount_type' => 'percentage',
                'discount_value' => 10,
                'min_order_amount' => 50,
                'usage_count' => 0,
                'max_uses' => 500,
                'status' => 'active',
                'is_active' => true,
                'expires_at' => now()->addYear(),
            ];
            if (Schema::hasColumn('coupons', 'design_color')) {
                $row['design_color'] = '#0d9488';
            }
            Coupon::withoutGlobalScope('store')->create($row);
        } catch (\Throwable) {
            return null;
        }

        return $code;
    }

    /**
     * COD only until merchant connects a real gateway — never fake Moyasar Connected.
     */
    public function seedPayments(Store $store): int
    {
        if (! Schema::hasTable('payment_gateways')) {
            return 0;
        }

        $existing = PaymentGateway::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where('provider', 'cod')
            ->first();
        if ($existing) {
            return 1;
        }

        PaymentGateway::withoutGlobalScope('store')->create([
            'id' => 'gw-cod-'.Str::lower(Str::random(8)),
            'store_id' => $store->id,
            'provider' => 'cod',
            'title' => 'Cash on Delivery',
            'title_ar' => 'الدفع عند الاستلام',
            'is_enabled' => true,
            'is_sandbox' => false,
            'supported_methods' => ['cod'],
            'transaction_fee_percent' => 0,
            'transaction_fee_fixed' => 0,
            'status' => 'connected',
            'last_tested_at' => now(),
        ]);

        return 1;
    }

    /**
     * KSA shipping defaults — zones + methods. Couriers stay Not Connected until real API keys.
     *
     * @return array{0: int, 1: int}
     */
    public function seedShipping(Store $store): array
    {
        $zonesCreated = 0;
        $methodsCreated = 0;

        if (Schema::hasTable('shipping_methods')
            && ! ShippingMethod::withoutGlobalScope('store')->where('store_id', $store->id)->exists()
        ) {
            $methods = [
                [
                    'id' => 'sm-'.Str::lower(Str::random(8)),
                    'name' => 'Standard Delivery',
                    'name_ar' => 'توصيل عادي',
                    'type' => 'flat_rate',
                    'base_rate' => 25,
                    'is_cod_allowed' => true,
                    'cod_fee' => 10,
                    'estimated_delivery' => '2-4 Days',
                    'is_active' => true,
                    'sort_order' => 1,
                ],
                [
                    'id' => 'sm-'.Str::lower(Str::random(8)),
                    'name' => 'Express Delivery',
                    'name_ar' => 'توصيل سريع',
                    'type' => 'same_day',
                    'base_rate' => 45,
                    'is_cod_allowed' => true,
                    'cod_fee' => 15,
                    'estimated_delivery' => '1-2 Days',
                    'is_active' => true,
                    'sort_order' => 2,
                ],
            ];
            foreach ($methods as $m) {
                ShippingMethod::withoutGlobalScope('store')->create(array_merge($m, [
                    'store_id' => $store->id,
                ]));
                $methodsCreated++;
            }
        }

        if (Schema::hasTable('shipping_zones')
            && ! ShippingZone::withoutGlobalScope('store')->where('store_id', $store->id)->exists()
        ) {
            $zones = [
                [
                    'name' => 'Riyadh Region',
                    'region' => 'Riyadh Region',
                    'rate' => 25,
                    'free_above' => 300,
                    'estimated_delivery' => '1-2 Days',
                    'cod_available' => true,
                    'min_delivery_days' => 1,
                    'max_delivery_days' => 2,
                ],
                [
                    'name' => 'Makkah / Jeddah',
                    'region' => 'Makkah Region',
                    'rate' => 30,
                    'free_above' => 350,
                    'estimated_delivery' => '1-3 Days',
                    'cod_available' => true,
                    'min_delivery_days' => 1,
                    'max_delivery_days' => 3,
                ],
                [
                    'name' => 'Eastern Province',
                    'region' => 'Eastern Province',
                    'rate' => 35,
                    'free_above' => 400,
                    'estimated_delivery' => '2-3 Days',
                    'cod_available' => true,
                    'min_delivery_days' => 2,
                    'max_delivery_days' => 3,
                ],
                [
                    'name' => 'Other Saudi Regions',
                    'region' => 'Other',
                    'rate' => 40,
                    'free_above' => 500,
                    'estimated_delivery' => '3-5 Days',
                    'cod_available' => false,
                    'min_delivery_days' => 3,
                    'max_delivery_days' => 5,
                ],
            ];
            foreach ($zones as $z) {
                ShippingZone::withoutGlobalScope('store')->create(array_merge($z, [
                    'id' => 'sz-'.Str::lower(Str::random(8)),
                    'store_id' => $store->id,
                    'status' => 'active',
                    'is_active' => true,
                ]));
                $zonesCreated++;
            }
        }

        return [$zonesCreated, $methodsCreated];
    }
}
