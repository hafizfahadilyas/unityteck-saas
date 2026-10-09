<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    use ResolvesStoreId;

    private const SORTABLE = [
        'name',
        'slug',
        'sort_order',
        'is_active',
        'updated_at',
        'created_at',
    ];

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = Category::query()->forStore($storeId);

        if ($request->query('parent_id') === 'null' || $request->query('roots') === '1') {
            $query->whereNull('parent_id');
        } elseif ($parentId = $request->query('parent_id')) {
            $query->where('parent_id', $parentId);
        }

        if ($request->query('is_active') !== null && $request->query('is_active') !== '') {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%");
            });
        }

        $sort = (string) $request->query('sort', 'sort_order');
        if (! in_array($sort, self::SORTABLE, true)) {
            $sort = 'sort_order';
        }
        $dir = strtolower((string) $request->query('dir', 'asc')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $dir)->orderBy('name');

        if ($request->boolean('all') || ! $request->filled('page')) {
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

        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));
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

        $category = Category::query()
            ->forStore($storeId)
            ->with('children')
            ->where('id', $id)
            ->firstOrFail();

        return response()->json(['data' => $category]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate($this->rules($storeId));

        $parentCheck = $this->assertParent($storeId, $data['parent_id'] ?? null);
        if ($parentCheck instanceof JsonResponse) {
            return $parentCheck;
        }

        $data['id'] = $data['id'] ?? $this->newId('cat');
        $data['store_id'] = $storeId;
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
        $data['sort_order'] = $data['sort_order'] ?? $this->nextSort($storeId, $data['parent_id'] ?? null);
        $data['is_active'] = $data['is_active'] ?? true;

        if ($this->slugExists($storeId, $data['slug'])) {
            $data['slug'] = $data['slug'].'-'.Str::lower(Str::random(3));
        }

        $category = Category::query()->create($data);

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $category = Category::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate($this->rules($storeId, true, $category->id));

        if (array_key_exists('parent_id', $data)) {
            if ($data['parent_id'] === $category->id) {
                return response()->json(['message' => 'Category cannot be its own parent.'], 422);
            }
            $parentCheck = $this->assertParent($storeId, $data['parent_id']);
            if ($parentCheck instanceof JsonResponse) {
                return $parentCheck;
            }
            // Prevent setting parent to own descendant
            if ($data['parent_id'] && $this->isDescendant($storeId, $category->id, $data['parent_id'])) {
                return response()->json(['message' => 'Cannot nest under own subcategory.'], 422);
            }
        }

        if (isset($data['slug']) && $this->slugExists($storeId, $data['slug'], $category->id)) {
            return response()->json(['message' => 'Slug already exists for this store.'], 422);
        }

        $category->fill($data)->save();

        return response()->json(['data' => $category->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $category = Category::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        // Children become roots (FK nullOnDelete also handles parent_id)
        Category::query()
            ->forStore($storeId)
            ->where('parent_id', $id)
            ->update(['parent_id' => null]);

        $category->delete();

        return response()->json(['message' => 'Category deleted.', 'id' => $id]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(string $storeId, bool $partial = false, ?string $exceptId = null): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'id' => [$partial ? 'prohibited' : 'nullable', 'string', 'max:64', 'unique:categories,id'],
            'parent_id' => [
                'nullable',
                'string',
                'max:64',
                Rule::exists('categories', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'name' => [$req, 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:191'],
            'image_url' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function assertParent(string $storeId, ?string $parentId): ?JsonResponse
    {
        if ($parentId === null || $parentId === '') {
            return null;
        }

        $exists = Category::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('id', $parentId)
            ->exists();

        if (! $exists) {
            return response()->json(['message' => 'Parent category not found in this store.'], 422);
        }

        return null;
    }

    protected function isDescendant(string $storeId, string $ancestorId, string $maybeChildId): bool
    {
        $current = $maybeChildId;
        $guard = 0;
        while ($current && $guard < 50) {
            if ($current === $ancestorId) {
                return true;
            }
            $current = Category::withoutGlobalScope('store')
                ->where('store_id', $storeId)
                ->where('id', $current)
                ->value('parent_id');
            $guard++;
        }

        return false;
    }

    protected function slugExists(string $storeId, string $slug, ?string $exceptId = null): bool
    {
        $q = Category::withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->where('slug', $slug);

        if ($exceptId) {
            $q->where('id', '!=', $exceptId);
        }

        return $q->exists();
    }

    protected function nextSort(string $storeId, ?string $parentId): int
    {
        $q = Category::withoutGlobalScope('store')->where('store_id', $storeId);
        if ($parentId) {
            $q->where('parent_id', $parentId);
        } else {
            $q->whereNull('parent_id');
        }

        return ((int) $q->max('sort_order')) + 10;
    }
}
