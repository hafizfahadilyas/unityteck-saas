<?php

namespace App\Support;

use App\Models\ThemeCatalog;
use Illuminate\Support\Facades\Schema;

/**
 * CT-4 — seed / ensure common Souq theme catalog rows (shared settings schema).
 * docs/36 · docs/37
 */
final class SouqCommonThemes
{
    /**
     * @return list<array{
     *   id: string,
     *   name: string,
     *   name_ar: string,
     *   category: string,
     *   tier: string,
     *   price_sar: int,
     *   included_in_tiers: list<string>,
     *   preview_color: string,
     *   is_default: bool
     * }>
     */
    public static function definitions(): array
    {
        return [
            [
                'id' => 'theme-souq-common-retail',
                'name' => 'Souq Common Retail',
                'name_ar' => 'سوق المشترك — تجزئة',
                'category' => 'General',
                'tier' => 'basic',
                'price_sar' => 0,
                'included_in_tiers' => ['starter', 'pro', 'premium', 'custom', 'free', 'paid'],
                'preview_color' => '#0f766e',
                'is_default' => true,
            ],
            [
                'id' => 'theme-souq-common-catalog',
                'name' => 'Souq Common Catalog',
                'name_ar' => 'سوق المشترك — كتالوج',
                'category' => 'General',
                'tier' => 'full',
                'price_sar' => 79,
                'included_in_tiers' => ['pro', 'premium', 'custom'],
                'preview_color' => '#1e3a5f',
                'is_default' => false,
            ],
            [
                'id' => 'theme-souq-common-services',
                'name' => 'Souq Common Services',
                'name_ar' => 'سوق المشترك — خدمات',
                'category' => 'Services',
                'tier' => 'full',
                'price_sar' => 79,
                'included_in_tiers' => ['pro', 'premium', 'custom'],
                'preview_color' => '#7c2d12',
                'is_default' => false,
            ],
            [
                'id' => 'theme-souq-common-boutique',
                'name' => 'Souq Common Boutique',
                'name_ar' => 'سوق المشترك — بوتيك',
                'category' => 'Luxury',
                'tier' => 'full',
                'price_sar' => 149,
                'included_in_tiers' => ['premium', 'custom'],
                'preview_color' => '#581c87',
                'is_default' => false,
            ],
        ];
    }

    public static function ensureCatalogRows(): void
    {
        if (! Schema::hasTable('themes_catalog')) {
            return;
        }

        foreach (self::definitions() as $def) {
            $attrs = [
                'name' => $def['name'],
                'category' => $def['category'],
                'tier' => $def['tier'],
                'preview_color' => $def['preview_color'],
                'is_default' => $def['is_default'],
            ];
            if (Schema::hasColumn('themes_catalog', 'name_ar')) {
                $attrs['name_ar'] = $def['name_ar'];
            }
            if (Schema::hasColumn('themes_catalog', 'price_sar')) {
                $attrs['price_sar'] = $def['price_sar'];
            }
            if (Schema::hasColumn('themes_catalog', 'included_in_tiers')) {
                $attrs['included_in_tiers'] = $def['included_in_tiers'];
            }
            if (Schema::hasColumn('themes_catalog', 'is_active')) {
                $attrs['is_active'] = true;
            }

            ThemeCatalog::query()->updateOrCreate(['id' => $def['id']], $attrs);
        }

        // Prefer common retail as platform default for NEW stores (flagships keep own IDs)
        if (Schema::hasColumn('themes_catalog', 'is_default')) {
            ThemeCatalog::query()
                ->where('id', '!=', 'theme-souq-common-retail')
                ->where('is_default', true)
                ->update(['is_default' => false]);
            ThemeCatalog::query()->where('id', 'theme-souq-common-retail')->update(['is_default' => true]);
        }
    }
}
