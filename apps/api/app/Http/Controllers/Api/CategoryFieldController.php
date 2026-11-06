<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryFieldDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryFieldController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = CategoryFieldDefinition::query()->forStore($storeId);

        if ($request->filled('category_id')) {
            $catId = $request->query('category_id');
            $query->where(function ($q) use ($catId) {
                $q->whereNull('category_id')->orWhere('category_id', $catId);
            });
        }

        $rows = $query->orderBy('sort')->orderBy('name_en')->get();

        return response()->json(['data' => $rows, 'store_id' => $storeId]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate($this->rules($storeId));

        if (! empty($data['category_id'])) {
            $exists = Category::query()->forStore($storeId)->where('id', $data['category_id'])->exists();
            if (! $exists) {
                return response()->json(['message' => 'Category not found in this store.'], 422);
            }
        }

        $row = CategoryFieldDefinition::query()->create([
            'id' => $this->newId('cfield'),
            'store_id' => $storeId,
            'category_id' => $data['category_id'] ?? null,
            'name_en' => $data['name_en'],
            'name_ar' => $data['name_ar'] ?? null,
            'field_type' => $data['field_type'],
            'options' => $data['options'] ?? null,
            'sort' => $data['sort'] ?? 0,
            'active' => $data['active'] ?? true,
        ]);

        return response()->json(['data' => $row], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $row = CategoryFieldDefinition::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $data = $request->validate($this->rules($storeId, true));

        if (array_key_exists('category_id', $data) && $data['category_id']) {
            $exists = Category::query()->forStore($storeId)->where('id', $data['category_id'])->exists();
            if (! $exists) {
                return response()->json(['message' => 'Category not found in this store.'], 422);
            }
        }

        $row->fill($data)->save();

        return response()->json(['data' => $row->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $row = CategoryFieldDefinition::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $row->delete();

        return response()->json(['message' => 'Field definition deleted.', 'id' => $id]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(string $storeId, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'category_id' => [
                'nullable',
                'string',
                'max:64',
                Rule::exists('categories', 'id')->where(fn ($q) => $q->where('store_id', $storeId)),
            ],
            'name_en' => [$req, 'string', 'max:191'],
            'name_ar' => ['nullable', 'string', 'max:191'],
            'field_type' => [$req, Rule::in(['text', 'number', 'select', 'boolean', 'url'])],
            'options' => ['nullable', 'array'],
            'sort' => ['nullable', 'integer', 'min:0'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
