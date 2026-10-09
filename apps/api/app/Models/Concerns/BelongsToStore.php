<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Scopes queries to the current X-Store-Id / request store_id attribute.
 */
trait BelongsToStore
{
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope('store', function (Builder $builder) {
            $storeId = request()->attributes->get('store_id')
                ?? request()->header('X-Store-Id');

            if (is_string($storeId) && trim($storeId) !== '') {
                $builder->where(
                    $builder->getModel()->getTable().'.store_id',
                    trim($storeId)
                );
            }
        });
    }

    public function scopeForStore(Builder $query, string $storeId): Builder
    {
        return $query->where($query->getModel()->getTable().'.store_id', $storeId);
    }

    public function scopeWithoutStoreScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('store');
    }
}
