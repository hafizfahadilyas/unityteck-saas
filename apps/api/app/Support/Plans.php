<?php

namespace App\Support;

use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subscription;
use App\Support\Subscriptions;

/**
 * Phase 2.6 — plan catalog + effective limits/features per store.
 * Master grant (`master_granted_pro`) upgrades feature set to Pro without changing billing row.
 */
final class Plans
{
    /**
     * @return array<string, array{
     *   id: string,
     *   name: string,
     *   price_sar: int|null,
     *   product_limit: int|null,
     *   order_limit: int|null,
     *   storage_mb: int|null,
     *   team_seats: int|null,
     *   features: list<string>
     * }>
     */
    public static function catalog(): array
    {
        return [
            'free' => [
                'id' => 'plan-free',
                'name' => 'Free',
                'price_sar' => 0,
                'product_limit' => 50,
                'order_limit' => 100,
                'storage_mb' => 512,
                'team_seats' => 1,
                'features' => ['catalog', 'orders', 'basic_seo', 'themes_basic', 'media_studio'],
            ],
            'paid' => [
                'id' => 'plan-paid',
                'name' => 'Paid',
                'price_sar' => null,
                'product_limit' => 500,
                'order_limit' => 2000,
                'storage_mb' => 5120,
                'team_seats' => 5,
                'features' => ['catalog', 'orders', 'seo', 'coupons', 'shipping', 'analytics', 'reports', 'themes_basic', 'media_studio'],
            ],
            'pro' => [
                'id' => 'plan-pro',
                'name' => 'Pro',
                'price_sar' => 300,
                'product_limit' => 5000,
                'order_limit' => null,
                'storage_mb' => 51200,
                'team_seats' => 20,
                'features' => [
                    'catalog', 'orders', 'seo', 'coupons', 'shipping',
                    'analytics', 'reports', 'themes_basic', 'themes', 'media_studio', 'custom_domain',
                    'whatsapp', 'social',
                ],
            ],
            'premium' => [
                'id' => 'plan-premium',
                'name' => 'Premium',
                'price_sar' => 500,
                'product_limit' => null,
                'order_limit' => null,
                'storage_mb' => 102400,
                'team_seats' => 50,
                'features' => [
                    'catalog', 'orders', 'seo', 'coupons', 'shipping',
                    'analytics', 'reports', 'themes_basic', 'themes', 'media_studio', 'custom_domain',
                    'whatsapp', 'social',
                    'backups', 'zatca', 'ai', 'api_access', 'advanced_seo', 'advanced_analytics',
                ],
            ],
            'custom' => [
                'id' => 'plan-custom',
                'name' => 'Custom',
                'price_sar' => null,
                'product_limit' => null,
                'order_limit' => null,
                'storage_mb' => null,
                'team_seats' => null,
                'features' => ['all'],
            ],
        ];
    }

    public static function normalizeCode(?string $code): string
    {
        $c = strtolower(trim((string) $code));

        return in_array($c, ['free', 'paid', 'pro', 'premium', 'custom'], true) ? $c : 'free';
    }

    /**
     * Effective plan code after Master Pro grant.
     */
    public static function effectiveCode(Store $store): string
    {
        $code = self::normalizeCode($store->plan);
        if ($store->master_granted_pro && in_array($code, ['free', 'paid'], true)) {
            return 'pro';
        }

        return $code;
    }

    /**
     * @return array{
     *   code: string,
     *   billed_code: string,
     *   name: string,
     *   price_sar: int|null,
     *   product_limit: int|null,
     *   order_limit: int|null,
     *   storage_mb: int|null,
     *   team_seats: int|null,
     *   features: list<string>,
     *   master_granted_pro: bool,
     *   products_used: int,
     *   subscription_status: string|null,
     *   subscription: array|null
     * }
     */
    public static function forStore(Store $store): array
    {
        $billed = self::normalizeCode($store->plan);
        $effective = self::effectiveCode($store);
        $meta = self::catalog()[$effective];

        // Prefer DB plan row when present (Hostinger may customize Custom)
        $db = Plan::query()->where('code', $effective)->first();
        if ($db) {
            $custom = $effective === 'custom';
            $meta = [
                'id' => $db->id,
                'name' => $db->name ?: $meta['name'],
                'price_sar' => $db->price_sar ?? $meta['price_sar'],
                'product_limit' => $custom ? $db->product_limit : $meta['product_limit'],
                'order_limit' => $meta['order_limit'],
                'storage_mb' => $custom ? $db->storage_mb : $meta['storage_mb'],
                'team_seats' => $custom ? $db->team_seats : $meta['team_seats'],
                'features' => $custom && is_array($db->features) ? $db->features : $meta['features'],
            ];
        }

        $subLife = Subscriptions::forStore($store, true);

        $productsUsed = Product::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->count();

        $canva = CanvaTemplates::entitlement($store);

        return [
            'code' => $effective,
            'billed_code' => $billed,
            'name' => $meta['name'],
            'price_sar' => $meta['price_sar'],
            'product_limit' => $meta['product_limit'],
            'order_limit' => $meta['order_limit'],
            'storage_mb' => $meta['storage_mb'],
            'team_seats' => $meta['team_seats'],
            'features' => $meta['features'],
            'master_granted_pro' => (bool) $store->master_granted_pro,
            'products_used' => $productsUsed,
            'subscription_status' => $subLife['status'],
            'subscription' => $subLife,
            'canva_templates_per_category' => $canva['canva_templates_per_category'],
            'canva_free_default' => $canva['free_default'],
            'media_studio' => $canva['media_studio'],
        ];
    }

    /**
     * Feature flags only (no product counts / Canva entitlement — safe for middleware gates).
     *
     * @return list<string>
     */
    public static function featureListForStore(Store $store): array
    {
        $effective = self::effectiveCode($store);
        $meta = self::catalog()[$effective] ?? self::catalog()['free'];
        $features = $meta['features'];

        $db = Plan::query()->where('code', $effective)->first();
        if ($db && $effective === 'custom' && is_array($db->features)) {
            $features = $db->features;
        }

        return is_array($features) ? array_values($features) : [];
    }

    public static function hasFeature(Store $store, string $feature): bool
    {
        // Lightweight path — never call forStore() (that embeds Canva entitlement → recursion).
        $features = self::featureListForStore($store);
        if (in_array('all', $features, true)) {
            return true;
        }
        if (in_array($feature, $features, true)) {
            return true;
        }
        // basic_seo unlocks seo.read-level; full seo write still needs seo
        if ($feature === 'seo' && in_array('basic_seo', $features, true)) {
            return true;
        }
        // Full themes unlocks basic theme access
        if ($feature === 'themes_basic' && in_array('themes', $features, true)) {
            return true;
        }
        if ($feature === 'seo' && in_array('advanced_seo', $features, true)) {
            return true;
        }
        if ($feature === 'analytics' && in_array('advanced_analytics', $features, true)) {
            return true;
        }

        return false;
    }

    public static function assertCanAddProduct(Store $store): ?string
    {
        $info = self::forStore($store);
        $limit = $info['product_limit'];
        if ($limit === null) {
            return null;
        }
        if ($info['products_used'] >= $limit) {
            return "Product limit reached for {$info['name']} plan ({$limit}).";
        }

        return null;
    }
}
