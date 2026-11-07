<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryDriver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryDriverController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = DeliveryDriver::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->orderBy('name');

        if ($request->query('is_active') !== null && $request->query('is_active') !== '') {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($city = $request->query('city')) {
            $query->where('city', $city);
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_ar', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

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
            ],
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
            'phone' => ['required', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'vehicle_type' => ['nullable', 'string', 'max:64'],
            'city' => ['nullable', 'string', 'max:100'],
            'base_location' => ['nullable', 'string', 'max:191'],
            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['string', 'max:64'],
            'rate_mode' => ['nullable', 'in:fixed,per_kg,per_km,zone'],
            'fixed_rate' => ['nullable', 'numeric', 'min:0'],
            'per_kg_rate' => ['nullable', 'numeric', 'min:0'],
            'per_km_rate' => ['nullable', 'numeric', 'min:0'],
            'same_day' => ['nullable', 'boolean'],
            'eta_text' => ['nullable', 'string', 'max:100'],
            'payment_options' => ['nullable', 'array'],
            'payment_options.*' => ['in:cod,online,bank_transfer'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $driver = DeliveryDriver::query()->create([
            'id' => $this->newId('drv'),
            'store_id' => $storeId,
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? null,
            'phone' => $data['phone'],
            'email' => $data['email'] ?? null,
            'vehicle_type' => $data['vehicle_type'] ?? null,
            'city' => $data['city'] ?? null,
            'base_location' => $data['base_location'] ?? null,
            'service_areas' => $data['service_areas'] ?? [],
            'rate_mode' => $data['rate_mode'] ?? 'fixed',
            'fixed_rate' => $data['fixed_rate'] ?? 0,
            'per_kg_rate' => $data['per_kg_rate'] ?? 0,
            'per_km_rate' => $data['per_km_rate'] ?? 0,
            'same_day' => $data['same_day'] ?? false,
            'eta_text' => $data['eta_text'] ?? null,
            'payment_options' => $data['payment_options'] ?? ['cod'],
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $driver], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $driver = DeliveryDriver::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'name_ar' => ['nullable', 'string', 'max:191'],
            'phone' => ['sometimes', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:191'],
            'vehicle_type' => ['nullable', 'string', 'max:64'],
            'city' => ['nullable', 'string', 'max:100'],
            'base_location' => ['nullable', 'string', 'max:191'],
            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['string', 'max:64'],
            'rate_mode' => ['sometimes', 'in:fixed,per_kg,per_km,zone'],
            'fixed_rate' => ['sometimes', 'numeric', 'min:0'],
            'per_kg_rate' => ['sometimes', 'numeric', 'min:0'],
            'per_km_rate' => ['sometimes', 'numeric', 'min:0'],
            'same_day' => ['sometimes', 'boolean'],
            'eta_text' => ['nullable', 'string', 'max:100'],
            'payment_options' => ['nullable', 'array'],
            'payment_options.*' => ['in:cod,online,bank_transfer'],
            'is_active' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $driver->fill($data)->save();

        return response()->json(['data' => $driver->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $driver = DeliveryDriver::query()
            ->withoutGlobalScope('store')
            ->forStore($storeId)
            ->where('id', $id)
            ->firstOrFail();

        $driver->delete();

        return response()->json(['message' => 'Delivery driver deleted.', 'id' => $id]);
    }
}
