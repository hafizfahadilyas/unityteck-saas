<?php

namespace App\Support;

use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

/**
 * Storefront visibility, scheduled publish, and time-window sale pricing.
 */
final class ProductStorefront
{
    /** Products visible on the public storefront for a store. */
    public static function visibleScope(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->where('is_active', true)
            ->where(function (Builder $q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    /** Auto-promote scheduled rows whose publish time has passed. */
    public static function promoteDueScheduled(string $storeId): void
    {
        Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('status', 'draft')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->update([
                'status' => 'published',
                'is_active' => true,
            ]);
    }

    /**
     * @return array{price: float, original_price: ?float, on_sale: bool, sale_active: bool}
     */
    public static function effectivePricing(Product $product, ?Carbon $at = null): array
    {
        $at = $at ?? now();
        $sell = (float) $product->price;
        $compare = $product->original_price !== null ? (float) $product->original_price : null;
        $hasSale = $compare !== null && $compare > $sell;

        if (! $hasSale) {
            return [
                'price' => $sell,
                'original_price' => null,
                'on_sale' => false,
                'sale_active' => false,
            ];
        }

        $start = $product->discount_start_at ? Carbon::parse($product->discount_start_at) : null;
        $end = $product->discount_end_at ? Carbon::parse($product->discount_end_at) : null;
        $inWindow = true;
        if ($start && $at->lt($start)) {
            $inWindow = false;
        }
        if ($end && $at->gt($end)) {
            $inWindow = false;
        }

        if ($inWindow) {
            return [
                'price' => $sell,
                'original_price' => $compare,
                'on_sale' => true,
                'sale_active' => true,
            ];
        }

        return [
            'price' => $compare,
            'original_price' => null,
            'on_sale' => false,
            'sale_active' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function enrichRow(Product $product): array
    {
        $data = $product->toArray();
        $pricing = self::effectivePricing($product);
        $data['storefront_price'] = $pricing['price'];
        $data['storefront_original_price'] = $pricing['original_price'];
        $data['storefront_on_sale'] = $pricing['on_sale'];
        $data['sale_active'] = $pricing['sale_active'];

        $list = $product->category_list;
        if (is_array($list) && $list !== []) {
            $data['categories'] = array_values($list);
        } elseif (! empty($product->category)) {
            $data['categories'] = [trim((string) $product->category)];
        } else {
            $data['categories'] = [];
        }

        return $data;
    }
}
