<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Store;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    use ResolvesStoreId;

    private const SORTABLE = [
        'name',
        'sku',
        'price',
        'weight_kg',
        'stock',
        'status',
        'category',
        'updated_at',
        'created_at',
    ];

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Product::query()->forStore($storeId);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->query('is_active') !== null && $request->query('is_active') !== '') {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($request->query('min_weight_kg') !== null && $request->query('min_weight_kg') !== '') {
            $query->where('weight_kg', '>=', (float) $request->query('min_weight_kg'));
        }

        if ($request->query('max_weight_kg') !== null && $request->query('max_weight_kg') !== '') {
            $query->where('weight_kg', '<=', (float) $request->query('max_weight_kg'));
        }

        if ($sku = $request->query('sku')) {
            $query->where('sku', 'like', "%{$sku}%");
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('seo_title', 'like', "%{$search}%");
            });
        }

        $sort = (string) $request->query('sort', 'updated_at');
        if (! in_array($sort, self::SORTABLE, true)) {
            $sort = 'updated_at';
        }
        $dir = strtolower((string) $request->query('dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $dir);

        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));

        if ($request->boolean('all')) {
            $rows = $query->get();

            return response()->json([
                'data' => $rows,
                'store_id' => $storeId,
                'meta' => [
                    'total' => $rows->count(),
                    'page' => 1,
                    'per_page' => max(1, $rows->count()),
                    'last_page' => 1,
                    'sort' => $sort,
                    'dir' => $dir,
                ],
            ]);
        }

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $paginator->items(),
            'store_id' => $storeId,
            'meta' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'last_page' => $paginator->lastPage(),
                'sort' => $sort,
                'dir' => $dir,
            ],
        ]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()
            ->forStore($storeId)
            ->with('variations')
            ->where('id', $id)
            ->firstOrFail();

        $data = $product->toArray();
        $data['variations'] = $product->variations->map(static function ($v) {
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
        })->values()->all();

        return response()->json(['data' => $data]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if ($store) {
            $limitMsg = Plans::assertCanAddProduct($store);
            if ($limitMsg) {
                return response()->json([
                    'message' => $limitMsg,
                    'plan' => Plans::forStore($store),
                ], 403);
            }
        }

        $data = $request->validate($this->rules());

        $data['id'] = $data['id'] ?? $this->newId('prod');
        $data['store_id'] = $storeId;
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']).'-'.Str::lower(Str::random(4));
        $data['stock'] = $data['stock'] ?? 0;
        $data['status'] = $data['status'] ?? 'draft';
        $data['is_active'] = $data['is_active'] ?? true;
        $data['gallery_urls'] = $data['gallery_urls'] ?? [];
        $data['tags'] = $data['tags'] ?? [];

        if ($this->skuExists($storeId, $data['sku'])) {
            return response()->json(['message' => 'SKU already exists for this store.'], 422);
        }

        $product = Product::query()->create($data);
        $this->syncStoreProductCount($storeId);

        return response()->json(['data' => $product], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate($this->rules(true));

        if (isset($data['sku']) && $this->skuExists($storeId, $data['sku'], $product->id)) {
            return response()->json(['message' => 'SKU already exists for this store.'], 422);
        }

        if (array_key_exists('image_url', $data) && $data['image_url'] !== $product->image_url) {
            $data['image_version'] = $data['image_version'] ?? (string) now()->timestamp;
        }

        $product->fill($data)->save();

        return response()->json(['data' => $product->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $product->delete();
        $this->syncStoreProductCount($storeId);

        return response()->json(['message' => 'Product deleted.', 'id' => $id]);
    }

    public function togglePublish(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        if ($product->status === 'published') {
            $product->status = 'draft';
            $product->is_active = false;
        } else {
            $product->status = 'published';
            $product->is_active = true;
        }

        $product->save();

        return response()->json(['data' => $product->fresh()]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'id' => [$partial ? 'prohibited' : 'nullable', 'string', 'max:64', 'unique:products,id'],
            'name' => [$req, 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string'],
            'price' => [$req, 'numeric', 'min:0'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sku' => [$req, 'string', 'max:100'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'category_id' => ['nullable', 'string', 'max:64'],
            'category' => ['nullable', 'string', 'max:100'],
            'category_ar' => ['nullable', 'string', 'max:100'],
            'image_url' => ['nullable', 'string'],
            'image_version' => ['nullable', 'string', 'max:64'],
            'gallery_urls' => ['nullable', 'array'],
            'gallery_urls.*' => ['string'],
            'video_url' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
            'badge' => ['nullable', 'string', 'max:64'],
            'badge_en' => ['nullable', 'string', 'max:64'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::in(['published', 'draft', 'archived'])],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function skuExists(string $storeId, string $sku, ?string $exceptId = null): bool
    {
        $q = Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('sku', $sku);

        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->exists();
    }

    protected function syncStoreProductCount(string $storeId): void
    {
        $count = Product::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->count();

        Store::query()->where('id', $storeId)->update(['products_count' => $count]);
    }
}
