<?php

namespace App\Services\Theme;

use App\Models\Store;
use App\Models\StoreTheme;
use App\Models\StoreThemeEntitlement;
use App\Models\ThemeCatalog;
use App\Support\Plans;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * CT-3 — per-store theme unlock (subscription tier · purchase · master_grant).
 * docs/36-souq-common-theme-subscription-marketplace.md
 */
final class ThemeEntitlementService
{
    public const SOURCE_SUBSCRIPTION = 'subscription';

    public const SOURCE_PURCHASE = 'purchase';

    public const SOURCE_MASTER_GRANT = 'master_grant';

    /**
     * @return list<string>
     */
    public function entitledThemeIds(Store $store): array
    {
        if (! Schema::hasTable('store_theme_entitlements')) {
            return [];
        }

        return StoreThemeEntitlement::query()
            ->where('store_id', $store->id)
            ->pluck('theme_id')
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();
    }

    public function isUnlocked(Store $store, string $themeId): bool
    {
        $themeId = trim($themeId);
        if ($themeId === '') {
            return false;
        }

        $plan = Plans::effectiveCode($store);
        if ($plan === 'custom') {
            return true;
        }

        // Grandfather: already active on this store
        $active = StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->value('theme_id');
        if ($active && (string) $active === $themeId) {
            return true;
        }

        if (in_array($themeId, $this->entitledThemeIds($store), true)) {
            return true;
        }

        $theme = ThemeCatalog::query()->find($themeId);
        if (! $theme) {
            return false;
        }

        return $this->includedForPlan($theme, $plan);
    }

    public function includedForPlan(ThemeCatalog $theme, string $planCode): bool
    {
        $plan = Plans::normalizeCode($planCode);

        if (Schema::hasColumn('themes_catalog', 'included_in_tiers')) {
            $tiers = $theme->included_in_tiers;
            if (is_string($tiers)) {
                $decoded = json_decode($tiers, true);
                $tiers = is_array($decoded) ? $decoded : [];
            }
            if (! is_array($tiers) || $tiers === []) {
                // Legacy rows without marketplace metadata:
                // default catalog theme only for basic tiers; flagship never auto-included
                if ((bool) ($theme->is_default ?? false)) {
                    return in_array($plan, ['free', 'paid', 'starter', 'pro', 'premium', 'custom'], true);
                }

                return false;
            }

            return in_array($plan, array_map('strval', $tiers), true);
        }

        // Pre-migration: only default theme unlocked
        return (bool) ($theme->is_default ?? false);
    }

    /**
     * Annotate catalog rows for merchant UI (price-first, unlock after pay/grant).
     *
     * @param  Collection<int, ThemeCatalog>  $themes
     * @return list<array<string, mixed>>
     */
    public function annotateCatalog(Store $store, Collection $themes): array
    {
        $plan = Plans::effectiveCode($store);
        $entitled = array_flip($this->entitledThemeIds($store));
        $activeId = (string) (StoreTheme::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->value('theme_id') ?? '');

        $out = [];
        foreach ($themes as $theme) {
            $row = $theme->toArray();
            $id = (string) $theme->id;
            $viaEntitlement = isset($entitled[$id]);
            $viaPlan = $this->includedForPlan($theme, $plan);
            $viaActive = $activeId !== '' && $activeId === $id;
            $unlocked = $plan === 'custom' || $viaEntitlement || $viaPlan || $viaActive;

            $source = null;
            if ($viaActive && ! $viaPlan && ! $viaEntitlement) {
                $source = 'active';
            } elseif ($viaEntitlement) {
                $source = self::SOURCE_PURCHASE; // refined below if needed
                $ent = StoreThemeEntitlement::query()
                    ->where('store_id', $store->id)
                    ->where('theme_id', $id)
                    ->value('source');
                if (is_string($ent) && $ent !== '') {
                    $source = $ent;
                }
            } elseif ($viaPlan) {
                $source = self::SOURCE_SUBSCRIPTION;
            }

            $price = Schema::hasColumn('themes_catalog', 'price_sar')
                ? ($theme->price_sar !== null ? (int) $theme->price_sar : null)
                : null;

            $row['unlocked'] = $unlocked;
            $row['lock_reason'] = $unlocked
                ? null
                : ($price && $price > 0 ? 'purchase_required' : 'upgrade_plan');
            $row['entitlement_source'] = $source;
            $row['price_sar'] = $price;
            $row['currency'] = 'SAR';
            $row['plan_code'] = $plan;
            $out[] = $row;
        }

        return $out;
    }

    /**
     * Grant a theme to a store (purchase / master_grant / subscription pick).
     */
    public function grant(
        Store $store,
        string $themeId,
        string $source = self::SOURCE_PURCHASE,
        ?int $priceSar = null,
        ?string $grantedBy = null,
    ): StoreThemeEntitlement {
        if (! Schema::hasTable('store_theme_entitlements')) {
            throw new \RuntimeException('store_theme_entitlements table missing — run CT-3 migration.');
        }

        $themeId = trim($themeId);
        $existing = StoreThemeEntitlement::query()
            ->where('store_id', $store->id)
            ->where('theme_id', $themeId)
            ->first();

        if ($existing) {
            return $existing;
        }

        $row = [
            'id' => 'ste-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'theme_id' => $themeId,
            'source' => $source,
        ];
        if (Schema::hasColumn('store_theme_entitlements', 'price_sar')) {
            $row['price_sar'] = $priceSar;
        }
        if (Schema::hasColumn('store_theme_entitlements', 'granted_at')) {
            $row['granted_at'] = now();
        }
        if (Schema::hasColumn('store_theme_entitlements', 'granted_by')) {
            $row['granted_by'] = $grantedBy;
        }

        return StoreThemeEntitlement::query()->create($row);
    }
}
