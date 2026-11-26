<?php

namespace App\Support;

use App\Models\Store;
use App\Models\StoreTheme;
use App\Models\ThemeCatalog;
use Illuminate\Support\Facades\Schema;

/**
 * Every new store gets Souq common retail + docs/37 shared settings.
 * Starter → basic pack; Pro / Premium / Custom → full pack + builder.
 * Prefer ProvisionNewStoreService::bootstrap for full install (entitlements, catalog, domain).
 */
final class DefaultTheme
{
    /** CT-4: new stores default to Souq common retail (not flagship flora). */
    public const CATALOG_ID = 'theme-souq-common-retail';

    public const NAME = 'Souq Common Retail';

    public const CATEGORY = 'General';

    public const PREVIEW_COLOR = '#0f766e';

    /**
     * @return array{mode: string, homepage_style: string, homepage_styles: list<string>, sections: list<string>, customizable: list<string>, branding: array<string, mixed>}
     */
    public static function settingsForPlan(string $effectivePlanCode, ?Store $store = null): array
    {
        $full = in_array(Plans::normalizeCode($effectivePlanCode), ['pro', 'premium', 'custom'], true);
        // starter / free / paid → basic pack (1 common theme entitlement path)
        $accent = $store?->accent_color ?: self::PREVIEW_COLOR;

        if ($full) {
            return [
                'mode' => 'full',
                'homepage_style' => 'Modern Bento',
                'homepage_styles' => [
                    'Modern Bento',
                    'Editorial Cinema',
                    'Grid Showcase',
                    'Soft Minimalist',
                    'Luxury Boutique Hero',
                ],
                'sections' => [
                    'hero',
                    'features',
                    'categories',
                    'featured_products',
                    'shop_by_category',
                    'special_offer',
                    'promotions',
                    'metrics',
                    'testimonials',
                    'newsletter',
                    'footer',
                ],
                'customizable' => [
                    'accent_color',
                    'logo',
                    'fonts',
                    'header',
                    'footer',
                    'banners',
                    'product_cards',
                    'custom_css',
                ],
                'branding' => [
                    'accent_color' => $accent,
                    'store_name' => $store?->name,
                    'logo' => $store?->logo,
                ],
            ];
        }

        return [
            'mode' => 'basic',
            'homepage_style' => 'Modern Bento',
            'homepage_styles' => ['Modern Bento'],
            'sections' => ['hero', 'featured_products', 'footer'],
            'customizable' => ['accent_color', 'logo', 'store_name'],
            'branding' => [
                'accent_color' => $accent,
                'store_name' => $store?->name,
                'logo' => $store?->logo,
            ],
        ];
    }

    public static function ensureCatalogRow(): ThemeCatalog
    {
        SouqCommonThemes::ensureCatalogRows();

        $attrs = [
            'name' => self::NAME,
            'category' => self::CATEGORY,
            'preview_color' => self::PREVIEW_COLOR,
            'tier' => 'basic',
            'is_default' => true,
        ];
        // Marketplace columns (CT-3) — safe when migration not yet applied
        if (\Illuminate\Support\Facades\Schema::hasColumn('themes_catalog', 'name_ar')) {
            $attrs['name_ar'] = 'سوق المشترك — تجزئة';
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn('themes_catalog', 'price_sar')) {
            $attrs['price_sar'] = 0;
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn('themes_catalog', 'included_in_tiers')) {
            $attrs['included_in_tiers'] = ['starter', 'pro', 'premium', 'custom', 'free', 'paid'];
        }
        if (\Illuminate\Support\Facades\Schema::hasColumn('themes_catalog', 'is_active')) {
            $attrs['is_active'] = true;
        }

        $row = ThemeCatalog::query()->updateOrCreate(
            ['id' => self::CATALOG_ID],
            $attrs
        );

        // Legacy ID kept for existing store_themes FK rows (tests + Hostinger)
        $legacy = array_merge($attrs, [
            'name' => 'Commerce Starter (Legacy)',
            'is_default' => false,
        ]);
        if (Schema::hasColumn('themes_catalog', 'name_ar')) {
            $legacy['name_ar'] = 'بداية التجارة (قديم)';
        }
        ThemeCatalog::query()->updateOrCreate(
            ['id' => 'theme-commerce-starter'],
            $legacy
        );

        return $row;
    }

    /**
     * Assign (or refresh) the default store theme row for a newly created store.
     */
    public static function assignToStore(Store $store, bool $overwrite = false): StoreTheme
    {
        self::ensureCatalogRow();

        $existing = StoreTheme::query()->where('store_id', $store->id)->first();
        if ($existing && ! $overwrite) {
            return $existing;
        }

        // Full docs/37 + builder install (shared with ProvisionNewStoreService)
        return app(\App\Services\Store\ProvisionNewStoreService::class)->installDefaultTheme($store);
    }
}
