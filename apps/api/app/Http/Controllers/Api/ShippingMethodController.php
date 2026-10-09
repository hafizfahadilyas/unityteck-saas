<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShippingMethodController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $methods = ShippingMethod::query()
            ->forStore($storeId)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $methods,
            'store_id' => $storeId,
            'meta' => ['total' => $methods->count()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:191'],
            'name_ar' => ['nullable', 'string', 'max:191'],
            'type' => [
                'required',
                Rule::in([
                    'free',
                    'flat_rate',
                    'zone_based',
                    'weight_based',
                    'value_based',
                    'same_day',
                    'scheduled',
                    'local_pickup',
                    'cod',
                ]),
            ],
            'base_rate' => ['required', 'numeric', 'min:0'],
            'per_kg_rate' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery' => ['nullable', 'string', 'max:100'],
            'is_cod_allowed' => ['nullable', 'boolean'],
            'cod_fee' => ['nullable', 'numeric', 'min:0'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $id = $this->newId('shipm');

        $method = ShippingMethod::create([
            'id' => $id,
            'store_id' => $storeId,
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? null,
            'type' => $data['type'],
            'base_rate' => $data['base_rate'],
            'per_kg_rate' => $data['per_kg_rate'] ?? 0,
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'free_shipping_threshold' => $data['free_shipping_threshold'] ?? null,
            'estimated_delivery' => $data['estimated_delivery'] ?? '2-3 Days',
            'is_cod_allowed' => $data['is_cod_allowed'] ?? false,
            'cod_fee' => $data['cod_fee'] ?? 0,
            'courier_code' => $data['courier_code'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'description' => $data['description'] ?? null,
        ]);

        return response()->json(['data' => $method], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $method = ShippingMethod::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'name_ar' => ['nullable', 'string', 'max:191'],
            'type' => [
                'sometimes',
                Rule::in([
                    'free',
                    'flat_rate',
                    'zone_based',
                    'weight_based',
                    'value_based',
                    'same_day',
                    'scheduled',
                    'local_pickup',
                    'cod',
                ]),
            ],
            'base_rate' => ['sometimes', 'numeric', 'min:0'],
            'per_kg_rate' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['sometimes', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery' => ['sometimes', 'string', 'max:100'],
            'is_cod_allowed' => ['sometimes', 'boolean'],
            'cod_fee' => ['sometimes', 'numeric', 'min:0'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $method->fill($data)->save();

        return response()->json(['data' => $method->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $method = ShippingMethod::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $method->delete();

        return response()->json(['message' => 'Shipping method deleted successfully.']);
    }
}
