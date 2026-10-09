<?php

namespace App\Support;

use App\Models\Store;
use App\Models\StoreTheme;
use App\Models\ThemeCatalog;
use Illuminate\Support\Str;

/**
 * Every new store gets one default dummy e-commerce theme.
 * Free / Paid → basic pack; Pro / Custom (or Master Pro grant) → full pack.
 * Merchants can later rebrand via Theme Settings (Phase 5).
 */
final class DefaultTheme
{
    public const CATALOG_ID = 'theme-commerce-starter';

    public const NAME = 'Commerce Starter';

    public const CATEGORY = 'General';

    public const PREVIEW_COLOR = '#1d8b94';

    /**
     * @return array{mode: string, homepage_style: string, homepage_styles: list<string>, sections: list<string>, customizable: list<string>, branding: array<string, mixed>}
     */
    public static function settingsForPlan(string $effectivePlanCode, ?Store $store = null): array
    {
        $full = in_array(Plans::normalizeCode($effectivePlanCode), ['pro', 'custom'], true);
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
                    'featured_products',
                    'categories',
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
        return ThemeCatalog::query()->updateOrCreate(
            ['id' => self::CATALOG_ID],
            [
                'name' => self::NAME,
                'category' => self::CATEGORY,
                'preview_color' => self::PREVIEW_COLOR,
                'tier' => 'basic',
                'is_default' => true,
            ]
        );
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

        $effective = Plans::effectiveCode($store);
        $settings = self::settingsForPlan($effective, $store);

        if ($existing) {
            $existing->fill([
                'theme_id' => self::CATALOG_ID,
                'homepage_style' => $settings['homepage_style'],
                'settings' => $settings,
            ])->save();

            return $existing->fresh();
        }

        return StoreTheme::query()->create([
            'id' => 'stheme-'.Str::lower(Str::random(10)),
            'store_id' => $store->id,
            'theme_id' => self::CATALOG_ID,
            'homepage_style' => $settings['homepage_style'],
            'settings' => $settings,
        ]);
    }
}
