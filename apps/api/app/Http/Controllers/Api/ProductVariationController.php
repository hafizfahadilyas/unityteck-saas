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
            'barcode' => ['nullable', 'string', 'max:128'],
            'options' => ['nullable', 'array'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'weight_unit' => ['nullable', 'string', 'max:16'],
            'low_stock_alert' => ['nullable', 'integer', 'min:0'],
            'unlimited_stock' => ['nullable', 'boolean'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($this->skuExists($storeId, $data['sku'])) {
            return response()->json(['message' => 'Variation SKU already exists for this store.'], 422);
        }

        if (! empty($data['barcode']) && $this->barcodeExists($storeId, $data['barcode'])) {
            return response()->json(['message' => 'Variation barcode already exists for this store.'], 422);
        }

        $normalizedOptions = $this->normalizeOptions($data['options'] ?? []);
        if ($this->optionsComboExists($storeId, $productId, $normalizedOptions)) {
            return response()->json(['message' => 'A variation with the same option combination already exists.'], 422);
        }

        $variation = ProductVariation::query()->create([
            'id' => $data['id'] ?? $this->newId('var'),
            'store_id' => $storeId,
            'product_id' => $productId,
            'sku' => $data['sku'],
            'barcode' => $data['barcode'] ?? null,
            'options' => $normalizedOptions,
            'price' => $data['price'] ?? null,
            'compare_at_price' => $data['compare_at_price'] ?? null,
            'stock' => $data['stock'] ?? 0,
            'weight' => $data['weight'] ?? null,
            'weight_unit' => $data['weight_unit'] ?? 'kg',
            'low_stock_alert' => $data['low_stock_alert'] ?? null,
            'unlimited_stock' => $data['unlimited_stock'] ?? false,
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
            'barcode' => ['nullable', 'string', 'max:128'],
            'options' => ['nullable', 'array'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'weight_unit' => ['nullable', 'string', 'max:16'],
            'low_stock_alert' => ['nullable', 'integer', 'min:0'],
            'unlimited_stock' => ['nullable', 'boolean'],
            'image_url' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['sku']) && $this->skuExists($storeId, $data['sku'], $variation->id)) {
            return response()->json(['message' => 'Variation SKU already exists for this store.'], 422);
        }

        if (! empty($data['barcode']) && $this->barcodeExists($storeId, $data['barcode'], $variation->id)) {
            return response()->json(['message' => 'Variation barcode already exists for this store.'], 422);
        }

        if (array_key_exists('options', $data)) {
            $data['options'] = $this->normalizeOptions($data['options'] ?? []);
            if ($this->optionsComboExists($storeId, $productId, $data['options'], $variation->id)) {
                return response()->json(['message' => 'A variation with the same option combination already exists.'], 422);
            }
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

        // Soft-deactivate to preserve historical order integrity (never hard-wipe linked rows).
        $usedInOrders = false;
        if (\Illuminate\Support\Facades\Schema::hasColumn('order_items', 'variation_id')) {
            $usedInOrders = \Illuminate\Support\Facades\DB::table('order_items')
                ->where('store_id', $storeId)
                ->where('variation_id', $id)
                ->exists();
        }

        if ($usedInOrders) {
            $variation->is_active = false;
            $variation->save();

            return response()->json([
                'message' => 'Variation archived (kept for historical orders).',
                'id' => $id,
                'archived' => true,
            ]);
        }

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

    protected function barcodeExists(string $storeId, string $barcode, ?string $exceptId = null): bool
    {
        $q = ProductVariation::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('barcode', $barcode);

        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->exists();
    }

    /**
     * @param  array<string, string>  $options
     */
    protected function optionsComboExists(
        string $storeId,
        string $productId,
        array $options,
        ?string $exceptId = null,
    ): bool {
        if ($options === []) {
            return false;
        }

        $fingerprint = $this->optionsFingerprint($options);
        $rows = ProductVariation::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('product_id', $productId)
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->get(['id', 'options']);

        foreach ($rows as $row) {
            $fp = $this->optionsFingerprint(is_array($row->options) ? $row->options : []);
            if ($fp !== '' && $fp === $fingerprint) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $options
     */
    protected function optionsFingerprint(array $options): string
    {
        $normalized = [];
        foreach ($options as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }
            $normalized[strtolower(trim((string) $key))] = strtolower(trim((string) $value));
        }
        ksort($normalized);
        $parts = [];
        foreach ($normalized as $k => $v) {
            $parts[] = $k.'='.$v;
        }

        return implode('|', $parts);
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, string>
     */
    protected function normalizeOptions(array $raw): array
    {
        $out = [];
        foreach ($raw as $key => $value) {
            $k = is_string($key) ? trim($key) : '';
            $k = preg_replace('/\s+/u', ' ', $k) ?? '';
            $k = trim($k);
            if ($k === '' || $value === null || $value === '') {
                continue;
            }
            if (mb_strlen($k) > 80) {
                $k = mb_substr($k, 0, 80);
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
            'barcode' => $v->barcode,
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
    }
}
