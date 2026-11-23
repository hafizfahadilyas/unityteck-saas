<?php

namespace App\Support;

use App\Models\Product;
use App\Models\ProductGroupMember;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

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

        $data = self::attachGroupMeta($data, $product);

        return $data;
    }

    /**
     * Attach group flags + children for HiBrew grouped parents.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function attachGroupMeta(array $data, Product $product): array
    {
        $isGrouped = CoffeeGroupedProducts::isGroupedType($product->product_type ?? null);
        $data['is_grouped'] = $isGrouped;
        $data['purchasable'] = ! $isGrouped;

        if (! $isGrouped || ! CoffeeGroupedProducts::tableReady()) {
            if (! isset($data['group_children'])) {
                $data['group_children'] = [];
            }

            return $data;
        }

        $members = ProductGroupMember::withoutGlobalScope('store')
            ->where('store_id', $product->store_id)
            ->where('parent_product_id', $product->id)
            ->orderBy('sort_order')
            ->get();

        if ($members->isEmpty()) {
            $data['group_children'] = [];

            return $data;
        }

        $childIds = $members->pluck('child_product_id')->all();
        $children = Product::withoutGlobalScope('store')
            ->where('store_id', $product->store_id)
            ->whereIn('id', $childIds)
            ->with(['variations' => function ($q) use ($product) {
                $q->withoutGlobalScope('store')->where('store_id', $product->store_id);
            }])
            ->get()
            ->keyBy('id');

        $selectorByChild = [];
        foreach ($members as $m) {
            $selectorByChild[(string) $m->child_product_id] = $m->selector_image_url;
        }

        $ordered = [];
        foreach ($members as $m) {
            $child = $children->get($m->child_product_id);
            if (! $child) {
                continue;
            }
            $row = self::enrichRowWithoutGroupRecursion($child);
            $row['selector_image_url'] = $selectorByChild[(string) $child->id] ?? null;
            $row['group_sort_order'] = (int) $m->sort_order;
            $row['variations'] = $child->variations->map(static function ($v) {
                return [
                    'id' => $v->id,
                    'store_id' => $v->store_id,
                    'product_id' => $v->product_id,
                    'sku' => $v->sku,
                    'barcode' => $v->barcode ?? null,
                    'options' => $v->options ?? [],
                    'price' => $v->price !== null ? (float) $v->price : null,
                    'compare_at_price' => $v->compare_at_price !== null ? (float) $v->compare_at_price : null,
                    'stock' => (int) $v->stock,
                    'weight' => $v->weight !== null ? (float) $v->weight : null,
                    'weight_unit' => $v->weight_unit ?? 'kg',
                    'low_stock_alert' => $v->low_stock_alert !== null ? (int) $v->low_stock_alert : null,
                    'unlimited_stock' => (bool) ($v->unlimited_stock ?? false),
                    'image_url' => $v->image_url,
                    'is_active' => (bool) $v->is_active,
                    'created_at' => $v->created_at,
                    'updated_at' => $v->updated_at,
                ];
            })->values()->all();
            $ordered[] = $row;
        }

        $data['group_children'] = $ordered;

        return $data;
    }

    /**
     * Enrich without re-entering group attachment (children are never nested groups).
     *
     * @return array<string, mixed>
     */
    private static function enrichRowWithoutGroupRecursion(Product $product): array
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

        $data['is_grouped'] = false;
        $data['purchasable'] = true;
        $data['group_children'] = [];

        return $data;
    }

    /** Child product ids that should stay out of the public catalog list. */
    public static function groupChildIdsForStore(string $storeId): array
    {
        if (! CoffeeGroupedProducts::tableReady()) {
            return [];
        }

        try {
            return DB::table('product_group_members')
                ->where('store_id', $storeId)
                ->pluck('child_product_id')
                ->map(static fn ($id) => (string) $id)
                ->unique()
                ->values()
                ->all();
        } catch (\Throwable) {
            return [];
        }
    }
}
