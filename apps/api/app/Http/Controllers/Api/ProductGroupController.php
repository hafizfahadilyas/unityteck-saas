<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductGroupMember;
use App\Support\CoffeeGroupedProducts;
use App\Support\ProductStorefront;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductGroupController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request, string $parentId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! CoffeeGroupedProducts::tableReady()) {
            return response()->json(['message' => 'Product groups are not available yet.'], 503);
        }

        if (! CoffeeGroupedProducts::allowedForStoreId($storeId)) {
            return response()->json([
                'message' => 'Grouped products are only available for the HiBrew coffee store.',
                'message_ar' => 'المنتجات المجمعة متاحة فقط لمتجر هايبرو للقهوة.',
            ], 403);
        }

        $parent = Product::query()->forStore($storeId)->where('id', $parentId)->firstOrFail();
        if (! $parent->isGrouped()) {
            return response()->json([
                'message' => 'Product is not a grouped parent.',
                'message_ar' => 'هذا المنتج ليس مجموعة أب.',
            ], 422);
        }

        $members = ProductGroupMember::query()
            ->forStore($storeId)
            ->where('parent_product_id', $parentId)
            ->orderBy('sort_order')
            ->with(['childProduct.variations'])
            ->get();

        $data = $members->map(function (ProductGroupMember $m) {
            $child = $m->childProduct;
            $row = $child ? ProductStorefront::enrichRow($child) : null;
            if ($row && $child) {
                $row['variations'] = $child->variations->map(static fn ($v) => [
                    'id' => $v->id,
                    'store_id' => $v->store_id,
                    'product_id' => $v->product_id,
                    'sku' => $v->sku,
                    'options' => $v->options ?? [],
                    'price' => $v->price !== null ? (float) $v->price : null,
                    'compare_at_price' => $v->compare_at_price !== null ? (float) $v->compare_at_price : null,
                    'stock' => (int) $v->stock,
                    'image_url' => $v->image_url,
                    'is_active' => (bool) $v->is_active,
                ])->values()->all();
            }

            return [
                'id' => $m->id,
                'store_id' => $m->store_id,
                'parent_product_id' => $m->parent_product_id,
                'child_product_id' => $m->child_product_id,
                'sort_order' => (int) $m->sort_order,
                'selector_image_url' => $m->selector_image_url,
                'child' => $row,
            ];
        })->values()->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'parent_product_id' => $parentId,
                'count' => count($data),
                'min' => CoffeeGroupedProducts::MIN_CHILDREN,
                'max' => CoffeeGroupedProducts::MAX_CHILDREN,
            ],
        ]);
    }

    /**
     * Replace ordered child membership (3–4 independent products).
     */
    public function sync(Request $request, string $parentId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! CoffeeGroupedProducts::tableReady()) {
            return response()->json(['message' => 'Product groups are not available yet.'], 503);
        }

        if (! CoffeeGroupedProducts::allowedForStoreId($storeId)) {
            return response()->json([
                'message' => 'Grouped products are only available for the HiBrew coffee store.',
                'message_ar' => 'المنتجات المجمعة متاحة فقط لمتجر هايبرو للقهوة.',
            ], 403);
        }

        $validated = $request->validate([
            'members' => ['required', 'array', 'min:'.CoffeeGroupedProducts::MIN_CHILDREN, 'max:'.CoffeeGroupedProducts::MAX_CHILDREN],
            'members.*.child_product_id' => ['required', 'string', 'max:64'],
            'members.*.selector_image_url' => ['nullable', 'string'],
            'members.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:99'],
        ]);

        $parent = Product::query()->forStore($storeId)->where('id', $parentId)->firstOrFail();

        if (! $parent->isGrouped()) {
            // Auto-promote when merchant syncs members on a coffee parent marked grouped in UI.
            $parent->product_type = CoffeeGroupedProducts::PRODUCT_TYPE;
            $parent->save();
        }

        $childIds = [];
        foreach ($validated['members'] as $i => $row) {
            $cid = trim((string) $row['child_product_id']);
            if ($cid === '' || $cid === $parentId) {
                return response()->json([
                    'message' => 'Invalid child product id.',
                    'message_ar' => 'معرّف المنتج الفرعي غير صالح.',
                    'index' => $i,
                ], 422);
            }
            if (in_array($cid, $childIds, true)) {
                return response()->json([
                    'message' => 'Duplicate child product in the group.',
                    'message_ar' => 'منتج فرعي مكرر داخل المجموعة.',
                    'child_product_id' => $cid,
                ], 422);
            }
            $childIds[] = $cid;
        }

        $children = Product::query()
            ->forStore($storeId)
            ->whereIn('id', $childIds)
            ->get()
            ->keyBy('id');

        if ($children->count() !== count($childIds)) {
            return response()->json([
                'message' => 'One or more child products were not found in this store.',
                'message_ar' => 'واحد أو أكثر من المنتجات الفرعية غير موجود في هذا المتجر.',
            ], 422);
        }

        foreach ($children as $child) {
            if ($child->isGrouped()) {
                return response()->json([
                    'message' => 'A grouped parent cannot be added as a child product.',
                    'message_ar' => 'لا يمكن إضافة منتج مجموعة كمنتج فرعي.',
                    'child_product_id' => $child->id,
                ], 422);
            }
        }

        $conflict = ProductGroupMember::query()
            ->forStore($storeId)
            ->whereIn('child_product_id', $childIds)
            ->where('parent_product_id', '!=', $parentId)
            ->first();

        if ($conflict) {
            return response()->json([
                'message' => 'A child product already belongs to another group.',
                'message_ar' => 'منتج فرعي ينتمي بالفعل إلى مجموعة أخرى.',
                'child_product_id' => $conflict->child_product_id,
                'other_parent_product_id' => $conflict->parent_product_id,
            ], 422);
        }

        DB::transaction(function () use ($storeId, $parentId, $validated) {
            ProductGroupMember::query()
                ->forStore($storeId)
                ->where('parent_product_id', $parentId)
                ->delete();

            foreach ($validated['members'] as $i => $row) {
                ProductGroupMember::query()->create([
                    'id' => $this->newId('pgm'),
                    'store_id' => $storeId,
                    'parent_product_id' => $parentId,
                    'child_product_id' => trim((string) $row['child_product_id']),
                    'sort_order' => isset($row['sort_order']) ? (int) $row['sort_order'] : $i,
                    'selector_image_url' => isset($row['selector_image_url']) && trim((string) $row['selector_image_url']) !== ''
                        ? trim((string) $row['selector_image_url'])
                        : null,
                ]);
            }
        });

        ProductController::bustStorefrontCatalogCachePublic($storeId);

        return $this->index($request, $parentId);
    }
}
