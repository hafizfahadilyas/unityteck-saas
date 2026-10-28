<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $coupons = Coupon::query()
            ->forStore($storeId)
            ->orderBy('code')
            ->get();

        return response()->json([
            'data' => $coupons,
            'store_id' => $storeId,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['active', 'expired', 'scheduled'])],
            'is_active' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $code = strtoupper(trim($data['code']));

        $exists = Coupon::query()
            ->forStore($storeId)
            ->where('code', $code)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Coupon code already exists for this store.'], 422);
        }

        $coupon = Coupon::query()->create([
            'id' => $this->newId('coup'),
            'store_id' => $storeId,
            'code' => $code,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'min_order_amount' => $data['min_order_amount'] ?? 0,
            'usage_count' => 0,
            'max_uses' => $data['max_uses'] ?? null,
            'status' => $data['status'] ?? 'active',
            'is_active' => $data['is_active'] ?? true,
            'expires_at' => $data['expires_at'] ?? null,
        ]);

        return response()->json(['data' => $coupon], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $coupon = Coupon::query()->forStore($storeId)->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:64'],
            'discount_type' => ['sometimes', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['sometimes', 'numeric', 'min:0'],
            'min_order_amount' => ['sometimes', 'numeric', 'min:0'],
            'usage_count' => ['sometimes', 'integer', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(['active', 'expired', 'scheduled'])],
            'is_active' => ['sometimes', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        $coupon->fill($data)->save();

        return response()->json(['data' => $coupon->fresh()]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $coupon = Coupon::query()->forStore($storeId)->where('id', $id)->firstOrFail();
        $coupon->delete();

        return response()->json(['message' => 'Coupon deleted.', 'id' => $id]);
    }
}
