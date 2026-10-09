<?php

namespace App\Support;

/**
 * Phase 2.3 — Unityteck role catalog (canonical slugs).
 * Legacy aliases normalize in; module matrix enforced via Roles::can().
 */
final class Roles
{
    public const SUPER_ADMIN = 'super_admin';

    public const ADMIN = 'admin';

    public const MANAGER = 'manager';

    public const SUPPORT = 'support';

    public const SALES = 'sales';

    public const MARKETING = 'marketing';

    public const SEO = 'seo';

    public const CONTENT = 'content';

    public const DEVELOPER = 'developer';

    /** Read-only legacy alias. */
    public const VIEWER = 'viewer';

    /**
     * @return array<string, array{label: string, portal: string, level: int}>
     */
    public static function catalog(): array
    {
        return [
            self::SUPER_ADMIN => [
                'label' => 'Super Admin',
                'portal' => 'master',
                'level' => 100,
            ],
            self::ADMIN => [
                'label' => 'Admin',
                'portal' => 'store',
                'level' => 90,
            ],
            self::MANAGER => [
                'label' => 'Manager',
                'portal' => 'store',
                'level' => 80,
            ],
            self::DEVELOPER => [
                'label' => 'Developer',
                'portal' => 'store',
                'level' => 70,
            ],
            self::SEO => [
                'label' => 'SEO',
                'portal' => 'store',
                'level' => 60,
            ],
            self::MARKETING => [
                'label' => 'Marketing',
                'portal' => 'store',
                'level' => 55,
            ],
            self::CONTENT => [
                'label' => 'Content',
                'portal' => 'store',
                'level' => 50,
            ],
            self::SALES => [
                'label' => 'Sales',
                'portal' => 'store',
                'level' => 45,
            ],
            self::SUPPORT => [
                'label' => 'Support',
                'portal' => 'store',
                'level' => 40,
            ],
            self::VIEWER => [
                'label' => 'Viewer',
                'portal' => 'store',
                'level' => 10,
            ],
        ];
    }

    /** Map old Phase-1 slugs → canonical. */
    public static function normalize(?string $role): string
    {
        $r = strtolower(trim((string) $role));

        return match ($r) {
            'master_admin', 'superadmin', 'super_admin' => self::SUPER_ADMIN,
            'store_manager', 'manager' => self::MANAGER,
            'store_admin', 'admin' => self::ADMIN,
            'store_staff', 'support' => self::SUPPORT,
            'store_viewer', 'viewer' => self::VIEWER,
            'sales' => self::SALES,
            'marketing' => self::MARKETING,
            'seo' => self::SEO,
            'content' => self::CONTENT,
            'developer', 'dev' => self::DEVELOPER,
            default => self::VIEWER,
        };
    }

    public static function label(string $role): string
    {
        $n = self::normalize($role);

        return self::catalog()[$n]['label'] ?? $n;
    }

    public static function level(string $role): int
    {
        $n = self::normalize($role);

        return self::catalog()[$n]['level'] ?? 0;
    }

    public static function portal(string $role): string
    {
        $n = self::normalize($role);

        return self::catalog()[$n]['portal'] ?? 'store';
    }

    /**
     * Ability matrix (Phase 2.3 foundation; 2.4 deepens per-module UI gates).
     *
     * @return list<string>
     */
    public static function abilities(string $role): array
    {
        $n = self::normalize($role);

        $allStore = [
            'products.read', 'products.write',
            'orders.read', 'orders.write',
            'customers.read', 'customers.write',
            'coupons.read', 'coupons.write',
            'shipping.read', 'shipping.write',
            'seo.read', 'seo.write',
            'themes.read', 'themes.write',
            'settings.read', 'settings.write',
            'team.read', 'team.write',
            'analytics.read',
        ];

        return match ($n) {
            self::SUPER_ADMIN => array_merge(['stores.read', 'stores.write', '*'], $allStore),
            self::ADMIN, self::MANAGER => array_merge(['stores.read'], $allStore),
            self::DEVELOPER => [
                'products.read', 'orders.read', 'customers.read',
                'seo.read', 'seo.write',
                'themes.read', 'themes.write',
                'settings.read', 'settings.write',
                'analytics.read',
            ],
            self::SEO => [
                'products.read', 'orders.read',
                'seo.read', 'seo.write',
                'analytics.read',
            ],
            self::MARKETING => [
                'products.read', 'orders.read', 'customers.read',
                'coupons.read', 'coupons.write',
                'analytics.read',
            ],
            self::CONTENT => [
                'products.read', 'products.write',
                'themes.read', 'themes.write',
                'seo.read',
            ],
            self::SALES => [
                'products.read',
                'orders.read', 'orders.write',
                'customers.read', 'customers.write',
            ],
            self::SUPPORT => [
                'products.read',
                'orders.read', 'orders.write',
                'customers.read', 'customers.write',
            ],
            default => [
                'products.read', 'orders.read', 'customers.read',
                'coupons.read', 'shipping.read', 'seo.read',
                'themes.read', 'analytics.read',
            ],
        };
    }

    public static function can(string $role, string $ability): bool
    {
        $abilities = self::abilities($role);
        if (in_array('*', $abilities, true)) {
            return true;
        }

        return in_array($ability, $abilities, true);
    }

    /**
     * @return array{slug: string, label: string, level: int, portal: string, abilities: list<string>}
     */
    public static function describe(string $role): array
    {
        $n = self::normalize($role);
        $meta = self::catalog()[$n] ?? [
            'label' => $n,
            'portal' => 'store',
            'level' => 0,
        ];

        return [
            'slug' => $n,
            'label' => $meta['label'],
            'level' => $meta['level'],
            'portal' => $meta['portal'],
            'abilities' => self::abilities($n),
        ];
    }

    /**
     * @return list<array{slug: string, label: string, portal: string, level: int}>
     */
    public static function listForPortal(?string $portal = null): array
    {
        $out = [];
        foreach (self::catalog() as $slug => $meta) {
            if ($portal && $meta['portal'] !== $portal) {
                continue;
            }
            // Hide internal viewer from public pickers unless asked
            if ($slug === self::VIEWER) {
                continue;
            }
            $out[] = [
                'slug' => $slug,
                'label' => $meta['label'],
                'portal' => $meta['portal'],
                'level' => $meta['level'],
            ];
        }

        return $out;
    }
}
