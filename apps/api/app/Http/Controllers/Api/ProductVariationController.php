<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductVariationController extends Controller
{
    use ResolvesStoreId;

    /** Allowed option keys (custom always allowed as free-form string). */
    private const OPTION_KEYS = ['size', 'color', 'weight', 'material', 'custom'];

    public function index(Request $request, string $productId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = $this->findProduct($storeId, $productId);
        if ($product instanceof JsonResponse) {
            return $product;
        }

        $rows = ProductVariation::query()
            ->forStore($storeId)
            ->where('product_id', $productId)
            ->orderBy('sku')
            ->get();

        return response()->json([
            'data' => $rows->map(fn (ProductVariation $v) => $this->serialize($v)),
            'store_id' => $storeId,
            'product_id' => $productId,
        ]);
    }

    public function store(Request $request, string $productId): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = $this->findProduct($storeId, $productId);
        if ($product instanceof JsonResponse) {
            return $product;
        }

        $data = $request->validate([
            'id' => ['nullable', 'string', 'max:64', 'unique:product_variations,id'],
            'sku' => ['required', 'string', 'max:100'],
            'options' => ['nullable', 'array'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($this->skuExists($storeId, $data['sku'])) {
            return response()->json(['message' => 'Variation SKU already exists for this store.'], 422);
        }

        $variation = ProductVariation::query()->create([
            'id' => $data['id'] ?? $this->newId('var'),
            'store_id' => $storeId,
            'product_id' => $productId,
            'sku' => $data['sku'],
            'options' => $this->normalizeOptions($data['options'] ?? []),
            'price' => $data['price'] ?? null,
            'stock' => $data['stock'] ?? 0,
            'image_url' => $data['image_url'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $this->serialize($variation)], 201);
    }

    public function update(Request $request, string $productId, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = $this->findProduct($storeId, $productId);
        if ($product instanceof JsonResponse) {
            return $product;
        }

        $variation = ProductVariation::query()
            ->forStore($storeId)
            ->where('product_id', $productId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validate([
            'sku' => ['sometimes', 'string', 'max:100'],
            'options' => ['nullable', 'array'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['sku']) && $this->skuExists($storeId, $data['sku'], $variation->id)) {
            return response()->json(['message' => 'Variation SKU already exists for this store.'], 422);
        }

        if (array_key_exists('options', $data)) {
            $data['options'] = $this->normalizeOptions($data['options'] ?? []);
        }

        $variation->fill($data)->save();

        return response()->json(['data' => $this->serialize($variation->fresh())]);
    }

    public function destroy(Request $request, string $productId, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = $this->findProduct($storeId, $productId);
        if ($product instanceof JsonResponse) {
            return $product;
        }

        $variation = ProductVariation::query()
            ->forStore($storeId)
            ->where('product_id', $productId)
            ->where('id', $id)
            ->firstOrFail();

        $variation->delete();

        return response()->json(['message' => 'Variation deleted.', 'id' => $id]);
    }

    /**
     * @return Product|JsonResponse
     */
    protected function findProduct(string $storeId, string $productId): Product|JsonResponse
    {
        $product = Product::query()->forStore($storeId)->where('id', $productId)->first();
        if (! $product) {
            return response()->json(['message' => 'Product not found in this store.'], 404);
        }

        return $product;
    }

    protected function skuExists(string $storeId, string $sku, ?string $exceptId = null): bool
    {
        $q = ProductVariation::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('sku', $sku);

        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->exists();
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, string>
     */
    protected function normalizeOptions(array $raw): array
    {
        $out = [];
        foreach ($raw as $key => $value) {
            $k = is_string($key) ? strtolower(trim($key)) : '';
            if ($k === '' || $value === null || $value === '') {
                continue;
            }
            if (! in_array($k, self::OPTION_KEYS, true) && $k !== 'custom') {
                // Allow unknown keys as custom-like free-form (lean extensibility)
                $k = preg_replace('/[^a-z0-9_]/', '', $k) ?: 'custom';
            }
            $out[$k] = is_scalar($value) ? (string) $value : json_encode($value);
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    protected function serialize(ProductVariation $v): array
    {
        return [
            'id' => $v->id,
            'store_id' => $v->store_id,
            'product_id' => $v->product_id,
            'sku' => $v->sku,
            'options' => $v->options ?? [],
            'price' => $v->price !== null ? (float) $v->price : null,
            'stock' => (int) $v->stock,
            'image_url' => $v->image_url,
            'is_active' => (bool) $v->is_active,
            'created_at' => $v->created_at,
            'updated_at' => $v->updated_at,
        ];
    }
}
