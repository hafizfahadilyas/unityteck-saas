<?php

namespace App\Support;

use App\Models\Store;

/**
 * KSA Canva template unlock limits (Step 1).
 * Catalog JSON lives in SPA; API enforces Free/Pro + Master override.
 */
final class CanvaTemplates
{
    public const FREE_PER_CATEGORY = 5;

    public const CATEGORIES = ['product', 'category', 'banner', 'social'];

    /**
     * @return int|null null = unlimited (all catalog templates)
     */
    public static function perCategoryLimit(Store $store): ?int
    {
        $effective = Plans::effectiveCode($store);
        if (in_array($effective, ['pro', 'premium', 'custom'], true)) {
            return null;
        }

        $override = $store->canva_templates_per_category;
        if ($override !== null && (int) $override > 0) {
            return (int) $override;
        }

        return self::FREE_PER_CATEGORY;
    }

    /**
     * @return array{
     *   media_studio: bool,
     *   canva_templates_per_category: int|null,
     *   canva_categories: list<string>,
     *   free_default: int
     * }
     */
    public static function entitlement(Store $store): array
    {
        $limit = self::perCategoryLimit($store);
        // Do NOT call Plans::hasFeature / Plans::forStore here — forStore() embeds
        // entitlement() and that recursion hung every plan.feature write (orders PATCH, etc.).
        $features = Plans::featureListForStore($store);
        $mediaStudio = in_array('all', $features, true) || in_array('media_studio', $features, true);

        return [
            'media_studio' => $mediaStudio,
            'canva_templates_per_category' => $limit,
            'canva_categories' => self::CATEGORIES,
            'free_default' => self::FREE_PER_CATEGORY,
        ];
    }
}
