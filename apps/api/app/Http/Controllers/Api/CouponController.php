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

        $coupon->fill($data)->save();

        return response()->json(['data' => $coupon->fresh()]);
    }
}
