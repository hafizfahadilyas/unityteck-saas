<?php

namespace App\Support;

use App\Models\Store;
use Illuminate\Support\Facades\Schema;

/**
 * HiBrew / store-coffee only — grouped parent → independent child products.
 */
final class CoffeeGroupedProducts
{
    public const PRODUCT_TYPE = 'grouped';

    public const MIN_CHILDREN = 3;

    public const MAX_CHILDREN = 4;

    public static function tableReady(): bool
    {
        try {
            return Schema::hasTable('product_group_members');
        } catch (\Throwable) {
            return false;
        }
    }

    public static function isGroupedType(?string $productType): bool
    {
        return strtolower(trim((string) $productType)) === self::PRODUCT_TYPE;
    }

    public static function allowedForStoreId(string $storeId): bool
    {
        $id = strtolower(trim($storeId));
        if ($id === 'store-coffee' || str_contains($id, 'coffee')) {
            return true;
        }

        $store = Store::query()->where('id', $storeId)->first();
        if (! $store) {
            return false;
        }

        $slug = strtolower(trim((string) ($store->slug ?? '')));
        $name = strtolower(trim((string) ($store->name ?? '')));
        $domain = strtolower(trim((string) ($store->domain ?? '')));

        return str_contains($slug, 'coffee')
            || str_contains($slug, 'hibrew')
            || str_contains($name, 'hibrew')
            || str_contains($name, 'coffee')
            || str_contains($domain, 'coffee')
            || str_contains($domain, 'hibrew')
            || str_contains($domain, 'mieraf');
    }
}
