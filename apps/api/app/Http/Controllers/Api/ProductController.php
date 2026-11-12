<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Models\Store;
use App\Services\GeminiAiMediaService;
use App\Support\Plans;
use App\Support\ProductStorefront;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
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
        'is_featured',
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

        $counts = (clone $query)
            ->selectRaw("SUM(CASE WHEN status IS NULL OR status != 'archived' THEN 1 ELSE 0 END) as total")
            ->selectRaw("SUM(CASE WHEN status IN ('published','active') AND stock > 0 THEN 1 ELSE 0 END) as active")
            ->selectRaw("SUM(CASE WHEN (status IS NULL OR status != 'archived') AND stock = 0 THEN 1 ELSE 0 END) as out_of_stock")
            ->selectRaw("SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft")
            ->selectRaw("SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived")
            ->first();

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        } else {
            // Main catalog: recycle-bin (archived) products stay out unless explicitly requested.
            $query->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'archived');
            });
        }

        if ($request->query('is_active') !== null && $request->query('is_active') !== '') {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->query('is_featured') !== null && $request->query('is_featured') !== '') {
            $query->where('is_featured', filter_var($request->query('is_featured'), FILTER_VALIDATE_BOOLEAN));
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

        $stock = (string) $request->query('stock', '');
        if ($stock === '0' || $stock === 'out') {
            $query->where('stock', '<=', 0);
        } elseif ($stock === 'low') {
            $query->whereBetween('stock', [1, 5]);
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
        $query->with(['variations' => function ($q) use ($storeId) {
            $q->withoutGlobalScope('store')->where('store_id', $storeId);
        }]);

        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));

        if ($request->boolean('all')) {
            $perPage = 100;
            $page = 1;
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
                'counts' => [
                    'total' => (int) ($counts->total ?? 0),
                    'active' => (int) ($counts->active ?? 0),
                    'out_of_stock' => (int) ($counts->out_of_stock ?? 0),
                    'draft' => (int) ($counts->draft ?? 0),
                    'archived' => (int) ($counts->archived ?? 0),
                ],
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

        $data = ProductStorefront::enrichRow($product);
        $data['variations'] = $product->variations->map(static function ($v) {
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
        $data = $this->mergeCategoryList($data);

        $data['id'] = $data['id'] ?? $this->newId('prod');
        $data['store_id'] = $storeId;
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']).'-'.Str::lower(Str::random(4));
        $data['stock'] = $data['stock'] ?? 0;
        $data['status'] = $data['status'] ?? 'draft';
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_featured'] = $data['is_featured'] ?? false;
        $data['gallery_urls'] = $data['gallery_urls'] ?? [];
        $data['tags'] = $data['tags'] ?? [];
        $data = $this->applyPublicationState($data);
        $data = $this->onlyExistingJsonColumns($data);

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
        $data = $this->mergeCategoryList($data);

        if (isset($data['sku']) && $this->skuExists($storeId, $data['sku'], $product->id)) {
            return response()->json(['message' => 'SKU already exists for this store.'], 422);
        }

        if (array_key_exists('image_url', $data) && $data['image_url'] !== $product->image_url) {
            $data['image_version'] = $data['image_version'] ?? (string) now()->timestamp;
        }

        $data = $this->applyPublicationState($data);
        $data = $this->onlyExistingJsonColumns($data);
        $product->fill($data)->save();

        return response()->json(['data' => $product->fresh()]);
    }

    /**
     * Soft-delete → recycle bin (status=archived). Use forceDestroy for permanent delete.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $product->status = 'archived';
        $product->is_active = false;
        $product->save();
        $this->syncStoreProductCount($storeId);

        return response()->json([
            'message' => 'Product moved to recycle bin.',
            'id' => $id,
            'data' => $product->fresh(),
        ]);
    }

    /** Restore product from recycle bin → draft (merchant can re-publish). */
    public function restore(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        if ($product->status !== 'archived') {
            return response()->json(['message' => 'Product is not in the recycle bin.', 'data' => $product], 422);
        }

        $product->status = 'draft';
        $product->is_active = false;
        $product->save();
        $this->syncStoreProductCount($storeId);

        return response()->json(['message' => 'Product restored.', 'data' => $product->fresh()]);
    }

    /** Permanent delete from recycle bin only. */
    public function forceDestroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $product = Product::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        if ($product->status !== 'archived') {
            return response()->json([
                'message' => 'Move the product to the recycle bin before permanent delete.',
            ], 422);
        }

        $product->delete();
        $this->syncStoreProductCount($storeId);

        return response()->json(['message' => 'Product permanently deleted.', 'id' => $id]);
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
            'subtitle' => ['nullable', 'string', 'max:500'],
            'subtitle_ar' => ['nullable', 'string', 'max:500'],
            'price' => [$req, 'numeric', 'min:0'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'shipping_mode' => ['nullable', Rule::in(['own_delivery', 'shipping_company', 'store_default'])],
            'shipping_method_id' => ['nullable', 'string', 'max:64'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery_text' => ['nullable', 'string', 'max:191'],
            'requires_own_driver' => ['nullable', 'boolean'],
            'allow_own_delivery' => ['nullable', 'boolean'],
            'allow_shipping_company' => ['nullable', 'boolean'],
            'shipping_rate_mode' => ['nullable', Rule::in(['fixed', 'per_kg', 'per_km', 'zone'])],
            'shipping_per_kg_rate' => ['nullable', 'numeric', 'min:0'],
            'shipping_per_km_rate' => ['nullable', 'numeric', 'min:0'],
            'shipping_payment_options' => ['nullable', 'array'],
            'shipping_payment_options.*' => ['in:cod,online,bank_transfer'],
            'original_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'sku' => [$req, 'string', 'max:100'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'category_id' => ['nullable', 'string', 'max:64'],
            'category' => ['nullable', 'string', 'max:100'],
            'category_ar' => ['nullable', 'string', 'max:100'],
            'category_list' => ['nullable', 'array'],
            'category_list.*' => ['string', 'max:191'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:191'],
            'published_at' => ['nullable', 'date'],
            'brand' => ['nullable', 'string', 'max:191'],
            'product_type' => ['nullable', 'string', 'max:100'],
            'google_taxonomy' => ['nullable', 'string', 'max:500'],
            'sales_channels' => ['nullable', 'array'],
            'sales_channels.*' => ['string', 'max:100'],
            'discount_start_at' => ['nullable', 'date'],
            'discount_end_at' => ['nullable', 'date', 'after_or_equal:discount_start_at'],
            'image_url' => ['nullable', 'string'],
            'image_version' => ['nullable', 'string', 'max:64'],
            'gallery_urls' => ['nullable', 'array'],
            'gallery_urls.*' => ['string'],
            'video_url' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:64'],
            'product_options' => ['nullable', 'array'],
            'custom_fields' => ['nullable', 'array'],
            'conditional_rules' => ['nullable', 'array'],
            'badge' => ['nullable', 'string', 'max:64'],
            'badge_en' => ['nullable', 'string', 'max:64'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::in(['published', 'draft', 'archived'])],
            'visibility' => ['nullable', Rule::in(['active', 'draft', 'scheduled'])],
            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function onlyExistingJsonColumns(array $data): array
    {
        foreach ([
            'custom_fields',
            'conditional_rules',
            'sales_channels',
            'brand',
            'product_type',
            'google_taxonomy',
            'discount_start_at',
            'discount_end_at',
            'category_list',
            'published_at',
        ] as $column) {
            if (array_key_exists($column, $data) && ! Schema::hasColumn('products', $column)) {
                unset($data[$column]);
            }
        }

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mergeCategoryList(array $data): array
    {
        $list = $data['category_list'] ?? $data['categories'] ?? null;
        unset($data['categories']);
        if (is_array($list)) {
            $clean = array_values(array_unique(array_filter(array_map(
                static fn ($v) => trim((string) $v),
                $list
            ))));
            $data['category_list'] = $clean;
            if (! empty($clean) && empty($data['category'])) {
                $data['category'] = $clean[0];
            }
        }

        return $data;
    }

    /**
     * Map merchant visibility: active / draft / scheduled via status + published_at.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function applyPublicationState(array $data): array
    {
        $visibility = strtolower((string) ($data['visibility'] ?? ''));
        unset($data['visibility']);

        if ($visibility === 'active') {
            $data['status'] = 'published';
            $data['is_active'] = true;
            $data['published_at'] = $data['published_at'] ?? null;
        } elseif ($visibility === 'scheduled') {
            $data['status'] = 'draft';
            $data['is_active'] = false;
            if (empty($data['published_at'])) {
                $data['published_at'] = now()->addDay();
            }
        } elseif ($visibility === 'draft') {
            $data['status'] = 'draft';
            $data['is_active'] = false;
            $data['published_at'] = null;
        }

        return $data;
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
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', '!=', 'archived');
            })
            ->count();

        Store::query()->where('id', $storeId)->update(['products_count' => $count]);
    }

    /**
     * Public storefront catalog. One store only. Archived rows stay hidden.
     * Active drafts and published products both appear so new and existing items show.
     */
    public function storefrontCatalog(Request $request): JsonResponse
    {
        $key = trim((string) ($request->query('store_id') ?? $request->header('X-Store-Id') ?? ''));
        if ($key === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        $store = Store::query()->where('id', $key)->orWhere('slug', $key)->first();
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        ProductStorefront::promoteDueScheduled($store->id);

        $base = ProductStorefront::visibleScope(
            Product::withoutGlobalScope('store')->where('store_id', $store->id)
        );
        $source = (string) $request->query('source', '');
        if ($source === 'featured') {
            $base->where('is_featured', true);
        } elseif ($source === 'category') {
            $category = trim((string) $request->query('category', ''));
            if ($category !== '') {
                $base->where(function ($q) use ($category) {
                    $q->where('category', $category)->orWhere('category_id', $category);
                    if (Schema::hasColumn('products', 'category_list')) {
                        $q->orWhereJsonContains('category_list', $category);
                    }
                });
            }
        } elseif ($source === 'on_sale') {
            $base->whereNotNull('original_price')->whereColumn('original_price', '>', 'price')
                ->where(function ($q) {
                    $q->whereNull('discount_start_at')->orWhere('discount_start_at', '<=', now());
                })
                ->where(function ($q) {
                    $q->whereNull('discount_end_at')->orWhere('discount_end_at', '>=', now());
                });
        } elseif ($source === 'manual') {
            $ids = array_values(array_filter(array_map('trim', explode(',', (string) $request->query('ids', '')))));
            $base->whereIn('id', $ids === [] ? [''] : $ids);
        }
        $total = (clone $base)->count();
        $perPage = min(100, max(1, (int) $request->query('per_page', 48)));
        if ($request->query('limit') !== null && $request->query('limit') !== '') {
            $perPage = min(48, max(1, (int) $request->query('limit')));
        }
        $page = max(1, (int) $request->query('page', 1));

        $rows = (clone $base)
            ->with(['variations' => function ($q) use ($store) {
                $q->withoutGlobalScope('store')->where('store_id', $store->id);
            }])
            ->when($source !== 'latest', fn ($q) => $q->orderByDesc('is_featured'))
            ->orderByDesc($source === 'latest' ? 'created_at' : 'updated_at')
            ->forPage($page, $perPage)
            ->get(array_values(array_filter([
                'id',
                'store_id',
                'name',
                'name_ar',
                'slug',
                'description',
                'subtitle',
                'subtitle_ar',
                'price',
                'original_price',
                'cost_price',
                'sku',
                'stock',
                'category',
                'category_ar',
                'category_id',
                Schema::hasColumn('products', 'category_list') ? 'category_list' : null,
                'image_url',
                'image_version',
                'gallery_urls',
                'video_url',
                'tags',
                Schema::hasColumn('products', 'product_options') ? 'product_options' : null,
                Schema::hasColumn('products', 'custom_fields') ? 'custom_fields' : null,
                Schema::hasColumn('products', 'conditional_rules') ? 'conditional_rules' : null,
                'badge',
                'badge_en',
                'seo_title',
                'seo_description',
                'seo_keywords',
                Schema::hasColumn('products', 'discount_start_at') ? 'discount_start_at' : null,
                Schema::hasColumn('products', 'discount_end_at') ? 'discount_end_at' : null,
                'status',
                'is_active',
                'is_featured',
                'updated_at',
                'created_at',
            ])));

        $payloadRows = $rows->map(fn (Product $row) => ProductStorefront::enrichRow($row));

        $categories = [];
        foreach ($payloadRows as $row) {
            foreach ($row['categories'] ?? [] as $label) {
                $label = trim((string) $label);
                if ($label === '') {
                    continue;
                }
                $id = Str::lower($label);
                if (! isset($categories[$id])) {
                    $categories[$id] = [
                        'id' => $id,
                        'name' => $label,
                        'name_ar' => $label,
                        'count' => 0,
                    ];
                }
                $categories[$id]['count']++;
            }
        }

        return response()->json([
            'data' => $payloadRows->values(),
            'categories' => array_values($categories),
            'store_id' => $store->id,
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => max(1, (int) ceil($total / $perPage)),
            ],
        ]);
    }

    /**
     * Public single product by id or slug — full PDP payload for one store.
     */
    public function storefrontProduct(Request $request, string $productKey): JsonResponse
    {
        $key = trim((string) ($request->query('store_id') ?? $request->header('X-Store-Id') ?? ''));
        if ($key === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        $store = Store::query()->where('id', $key)->orWhere('slug', $key)->first();
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        ProductStorefront::promoteDueScheduled($store->id);

        $product = ProductStorefront::visibleScope(
            Product::withoutGlobalScope('store')->where('store_id', $store->id)
        )
            ->with(['variations' => function ($q) use ($store) {
                $q->withoutGlobalScope('store')->where('store_id', $store->id);
            }])
            ->where(function ($q) use ($productKey) {
                $q->where('id', $productKey)->orWhere('slug', $productKey)->orWhere('sku', $productKey);
            })
            ->first();

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $data = ProductStorefront::enrichRow($product);
        $data['variations'] = $product->variations->map(static function ($v) {
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

        return response()->json([
            'data' => $data,
            'store_id' => $store->id,
        ]);
    }

    public function storefrontCategories(Request $request): JsonResponse
    {
        $key = trim((string) ($request->query('store_id') ?? $request->header('X-Store-Id') ?? ''));
        if ($key === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }
        $store = Store::query()->where('id', $key)->orWhere('slug', $key)->first();
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $rows = Category::withoutGlobalScope('store')
            ->where('store_id', $store->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'store_id', 'name', 'name_ar', 'slug', 'image_url']);

        return response()->json([
            'data' => $rows,
            'store_id' => $store->id,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    /**
     * AI suggestion for product title + description. Does not save the product.
     */
    public function suggestCopy(Request $request, GeminiAiMediaService $gemini): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:200'],
            'category' => ['nullable', 'string', 'max:160'],
            'brand' => ['nullable', 'string', 'max:120'],
            'product_type' => ['nullable', 'string', 'max:120'],
            'seed' => ['nullable', 'string', 'max:1000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
        ]);

        $result = $gemini->suggestProductCopy([
            'name' => $validated['name'] ?? '',
            'category' => $validated['category'] ?? '',
            'brand' => $validated['brand'] ?? '',
            'product_type' => $validated['product_type'] ?? '',
            'store_name' => (string) ($store->name ?? ''),
            'seed' => $validated['seed'] ?? '',
            'locale' => $validated['locale'] ?? 'en',
        ]);

        if (! $result['ok']) {
            $status = ($result['code'] ?? '') === 'provider_not_connected' ? 503
                : (($result['code'] ?? '') === 'missing_context' ? 422 : 502);

            return response()->json([
                'message' => $result['message'],
                'code' => $result['code'],
                'store_id' => $storeId,
            ], $status);
        }

        return response()->json([
            'success' => true,
            'store_id' => $storeId,
            'data' => [
                'title' => $result['title'],
                'subtitle' => $result['subtitle'],
                'description' => $result['description'],
                'saved' => false,
                'model' => $result['model'],
            ],
            'message' => 'Product copy suggestion ready.',
        ]);
    }
}
