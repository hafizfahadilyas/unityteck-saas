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

        $this->ensureFreeShippingDefaults($storeId);

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
            'fulfillment_mode' => ['nullable', Rule::in(['own_delivery', 'courier'])],
            'base_rate' => ['required', 'numeric', 'min:0'],
            'per_kg_rate' => ['nullable', 'numeric', 'min:0'],
            'per_km_rate' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery' => ['nullable', 'string', 'max:100'],
            'eta_type' => ['nullable', Rule::in(['same_day', 'hours', 'days'])],
            'eta_value' => ['nullable', 'integer', 'min:0'],
            'tracking_enabled' => ['nullable', 'boolean'],
            'is_cod_allowed' => ['nullable', 'boolean'],
            'allow_online' => ['nullable', 'boolean'],
            'allow_bank_transfer' => ['nullable', 'boolean'],
            'payment_options' => ['nullable', 'array'],
            'payment_options.*' => ['in:cod,online,bank_transfer'],
            'cod_fee' => ['nullable', 'numeric', 'min:0'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'logo_url' => ['nullable', 'string', 'max:512'],
            'vehicle_type' => ['nullable', Rule::in(['bike', 'car', 'van'])],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $id = $this->newId('shipm');
        $paymentOptions = $data['payment_options'] ?? null;
        if ($paymentOptions === null) {
            $paymentOptions = array_values(array_filter([
                ($data['is_cod_allowed'] ?? false) ? 'cod' : null,
                ($data['allow_online'] ?? true) ? 'online' : null,
                ($data['allow_bank_transfer'] ?? false) ? 'bank_transfer' : null,
            ]));
        }

        $method = ShippingMethod::create([
            'id' => $id,
            'store_id' => $storeId,
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? null,
            'type' => $data['type'],
            'fulfillment_mode' => $data['fulfillment_mode'] ?? 'courier',
            'base_rate' => $data['base_rate'],
            'per_kg_rate' => $data['per_kg_rate'] ?? 0,
            'per_km_rate' => $data['per_km_rate'] ?? 0,
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'free_shipping_threshold' => $data['free_shipping_threshold'] ?? null,
            'estimated_delivery' => $data['estimated_delivery'] ?? '2-3 Days',
            'eta_type' => $data['eta_type'] ?? ($data['type'] === 'same_day' ? 'same_day' : 'days'),
            'eta_value' => $data['eta_value'] ?? null,
            'tracking_enabled' => $data['tracking_enabled'] ?? true,
            'is_cod_allowed' => $data['is_cod_allowed'] ?? in_array('cod', $paymentOptions, true),
            'allow_online' => $data['allow_online'] ?? in_array('online', $paymentOptions, true),
            'allow_bank_transfer' => $data['allow_bank_transfer'] ?? in_array('bank_transfer', $paymentOptions, true),
            'payment_options' => $paymentOptions,
            'cod_fee' => $data['cod_fee'] ?? 0,
            'courier_code' => $data['courier_code'] ?? null,
            'logo_url' => $data['logo_url'] ?? null,
            'vehicle_type' => $data['vehicle_type'] ?? null,
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
            'fulfillment_mode' => ['sometimes', Rule::in(['own_delivery', 'courier'])],
            'base_rate' => ['sometimes', 'numeric', 'min:0'],
            'per_kg_rate' => ['sometimes', 'numeric', 'min:0'],
            'per_km_rate' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['sometimes', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'estimated_delivery' => ['sometimes', 'string', 'max:100'],
            'eta_type' => ['sometimes', Rule::in(['same_day', 'hours', 'days'])],
            'eta_value' => ['nullable', 'integer', 'min:0'],
            'tracking_enabled' => ['sometimes', 'boolean'],
            'is_cod_allowed' => ['sometimes', 'boolean'],
            'allow_online' => ['sometimes', 'boolean'],
            'allow_bank_transfer' => ['sometimes', 'boolean'],
            'payment_options' => ['nullable', 'array'],
            'payment_options.*' => ['in:cod,online,bank_transfer'],
            'cod_fee' => ['sometimes', 'numeric', 'min:0'],
            'courier_code' => ['nullable', 'string', 'max:64'],
            'logo_url' => ['nullable', 'string', 'max:512'],
            'vehicle_type' => ['nullable', Rule::in(['bike', 'car', 'van'])],
            'is_active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        if (array_key_exists('payment_options', $data) && is_array($data['payment_options'])) {
            $opts = $data['payment_options'];
            $data['is_cod_allowed'] = $data['is_cod_allowed'] ?? in_array('cod', $opts, true);
            $data['allow_online'] = $data['allow_online'] ?? in_array('online', $opts, true);
            $data['allow_bank_transfer'] = $data['allow_bank_transfer'] ?? in_array('bank_transfer', $opts, true);
        }

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

    /**
     * Free defaults (no courier API): flat rate + local pickup with COD allowed.
     */
    private function ensureFreeShippingDefaults(string $storeId): void
    {
        $count = ShippingMethod::query()->forStore($storeId)->count();
        if ($count > 0) {
            return;
        }

        ShippingMethod::query()->create([
            'id' => $this->newId('shipm'),
            'store_id' => $storeId,
            'name' => 'Standard Delivery',
            'name_ar' => 'توصيل عادي',
            'type' => 'flat_rate',
            'fulfillment_mode' => 'own_delivery',
            'base_rate' => 25,
            'per_kg_rate' => 0,
            'per_km_rate' => 0,
            'min_order_amount' => 0,
            'free_shipping_threshold' => 250,
            'estimated_delivery' => '2-4 Days',
            'eta_type' => 'days',
            'eta_value' => 3,
            'tracking_enabled' => false,
            'is_cod_allowed' => true,
            'allow_online' => true,
            'allow_bank_transfer' => true,
            'payment_options' => ['cod', 'online', 'bank_transfer'],
            'cod_fee' => 0,
            'is_active' => true,
            'sort_order' => 1,
            'description' => 'Store own delivery — no courier API required',
        ]);

        ShippingMethod::query()->create([
            'id' => $this->newId('shipm'),
            'store_id' => $storeId,
            'name' => 'Store Pickup',
            'name_ar' => 'استلام من المتجر',
            'type' => 'local_pickup',
            'fulfillment_mode' => 'own_delivery',
            'base_rate' => 0,
            'per_kg_rate' => 0,
            'per_km_rate' => 0,
            'min_order_amount' => 0,
            'free_shipping_threshold' => null,
            'estimated_delivery' => 'Same Day',
            'eta_type' => 'same_day',
            'eta_value' => 0,
            'tracking_enabled' => false,
            'is_cod_allowed' => true,
            'allow_online' => true,
            'allow_bank_transfer' => true,
            'payment_options' => ['cod', 'online', 'bank_transfer'],
            'cod_fee' => 0,
            'is_active' => true,
            'sort_order' => 2,
            'description' => 'Customer collects from store',
        ]);
    }
}
