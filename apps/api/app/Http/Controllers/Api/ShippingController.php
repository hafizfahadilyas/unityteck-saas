<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use App\Models\ShippingZone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ShippingController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = ShippingZone::query()->forStore($storeId);

        if ($region = $request->query('region')) {
            $query->where('region', $region);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->query('min_weight_kg') !== null && $request->query('min_weight_kg') !== '') {
            $query->where(function ($q) use ($request) {
                $q->whereNull('max_weight_kg')
                    ->orWhere('max_weight_kg', '>=', (float) $request->query('min_weight_kg'));
            });
        }

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('region', 'like', "%{$search}%");
            });
        }

        $query->orderBy('name');

        $perPage = min(100, max(1, (int) $request->query('per_page', 25)));
        $page = max(1, (int) $request->query('page', 1));

        if ($request->boolean('all')) {
            $zones = $query->get();

            return response()->json([
                'data' => $zones,
                'store_id' => $storeId,
                'meta' => [
                    'total' => $zones->count(),
                    'page' => 1,
                    'per_page' => max(1, $zones->count()),
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
            'region' => ['required', 'string', 'max:100'],
            'rate' => ['required', 'numeric', 'min:0'],
            'rate_per_kg' => ['nullable', 'numeric', 'min:0'],
            'min_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'min_delivery_days' => ['nullable', 'integer', 'min:0'],
            'max_delivery_days' => ['nullable', 'integer', 'min:0'],
            'estimated_delivery' => ['nullable', 'string', 'max:191'],
            'free_above' => ['nullable', 'numeric', 'min:0'],
            'shipping_method_id' => ['nullable', 'string', 'max:64'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'cod_available' => ['nullable', 'boolean'],
            'city_names' => ['nullable', 'array'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $id = $this->newId('shipz');

        $zone = ShippingZone::create([
            'id' => $id,
            'store_id' => $storeId,
            'name' => $data['name'],
            'region' => $data['region'],
            'rate' => $data['rate'],
            'rate_per_kg' => $data['rate_per_kg'] ?? 0,
            'min_weight_kg' => $data['min_weight_kg'] ?? 0,
            'max_weight_kg' => $data['max_weight_kg'] ?? null,
            'min_delivery_days' => $data['min_delivery_days'] ?? 1,
            'max_delivery_days' => $data['max_delivery_days'] ?? 2,
            'estimated_delivery' => $data['estimated_delivery'] ?? '1-2 Days',
            'free_above' => $data['free_above'] ?? null,
            'shipping_method_id' => $data['shipping_method_id'] ?? null,
            'courier_code' => $data['courier_code'] ?? null,
            'cod_available' => $data['cod_available'] ?? true,
            'city_names' => $data['city_names'] ?? null,
            'status' => $data['status'] ?? 'active',
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $zone], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $zone = ShippingZone::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:191'],
            'region' => ['sometimes', 'string', 'max:100'],
            'rate' => ['sometimes', 'numeric', 'min:0'],
            'rate_per_kg' => ['sometimes', 'numeric', 'min:0'],
            'min_weight_kg' => ['sometimes', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'min_delivery_days' => ['sometimes', 'integer', 'min:0'],
            'max_delivery_days' => ['sometimes', 'integer', 'min:0'],
            'estimated_delivery' => ['nullable', 'string', 'max:191'],
            'free_above' => ['nullable', 'numeric', 'min:0'],
            'shipping_method_id' => ['nullable', 'string', 'max:64'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'cod_available' => ['sometimes', 'boolean'],
            'city_names' => ['nullable', 'array'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $zone->fill($data)->save();

        return response()->json(['data' => $zone->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $zone = ShippingZone::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $zone->delete();

        return response()->json(['message' => 'Shipping zone deleted successfully.']);
    }

    /**
     * Real dynamic shipping calculation based on store's actual configuration
     */
    public function calculate(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'city' => ['required', 'string'],
            'order_total' => ['required', 'numeric', 'min:0'],
            'total_weight_kg' => ['nullable', 'numeric', 'min:0'],
        ]);

        $city = trim($validated['city']);
        $orderTotal = (float) $validated['order_total'];
        $weightKg = (float) ($validated['total_weight_kg'] ?? 1.0);

        // Find best matching zone for this store
        $zones = ShippingZone::query()->forStore($storeId)->where('is_active', true)->get();

        $matchedZone = $zones->first(function ($z) use ($city) {
            if (strcasecmp($z->name, $city) === 0) return true;
            if (is_array($z->city_names) && in_array($city, $z->city_names)) return true;
            if ($z->region && stripos($city, $z->region) !== false) return true;
            return false;
        }) ?? $zones->first();

        // Calculate rate based on zone configuration
        $rate = 0.0;
        $isFree = false;
        $estimatedDelivery = '2-3 Days';
        $codAvailable = true;

        if ($matchedZone) {
            $estimatedDelivery = $matchedZone->estimated_delivery ?? '2-3 Days';
            $codAvailable = $matchedZone->cod_available ?? true;

            // Free shipping threshold check
            if ($matchedZone->free_above !== null && $matchedZone->free_above > 0 && $orderTotal >= (float) $matchedZone->free_above) {
                $isFree = true;
                $rate = 0.0;
            } else {
                $base = (float) $matchedZone->rate;
                $perKg = (float) ($matchedZone->rate_per_kg ?? 0);
                $minW = (float) ($matchedZone->min_weight_kg ?? 0);

                if ($perKg > 0 && $weightKg > $minW) {
                    $excess = $weightKg - $minW;
                    $rate = $base + ($excess * $perKg);
                } else {
                    $rate = $base;
                }
            }
        }

        // Also fetch active configurable shipping methods for store
        $methods = ShippingMethod::query()->forStore($storeId)->where('is_active', true)->get();

        $availableMethods = $methods->map(function ($m) use ($orderTotal, $weightKg) {
            $fee = (float) $m->base_rate;
            $isMethodFree = false;

            if ($m->type === 'free' || ($m->free_shipping_threshold && $orderTotal >= (float) $m->free_shipping_threshold)) {
                $fee = 0.0;
                $isMethodFree = true;
            } elseif ($m->type === 'weight_based' && $m->per_kg_rate > 0) {
                $fee = (float) $m->base_rate + ($weightKg * (float) $m->per_kg_rate);
            }

            return [
                'id' => $m->id,
                'name' => $m->name,
                'name_ar' => $m->name_ar,
                'type' => $m->type,
                'fee' => round($fee, 2),
                'is_free' => $isMethodFree,
                'estimated_delivery' => $m->estimated_delivery,
                'courier_code' => $m->courier_code,
                'is_cod_allowed' => $m->is_cod_allowed,
                'cod_fee' => (float) $m->cod_fee,
            ];
        });

        return response()->json([
            'store_id' => $storeId,
            'matched_zone' => $matchedZone ? [
                'id' => $matchedZone->id,
                'name' => $matchedZone->name,
                'region' => $matchedZone->region,
                'rate' => round($rate, 2),
                'is_free' => $isFree,
                'estimated_delivery' => $estimatedDelivery,
                'cod_available' => $codAvailable,
            ] : null,
            'calculated_shipping_fee' => round($rate, 2),
            'is_free_shipping' => $isFree,
            'available_methods' => $availableMethods,
        ]);
    }
}
