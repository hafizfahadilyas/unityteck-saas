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

    /**
     * Public storefront: validate one coupon code for checkout (per store_id).
     * Does not list secret inventory — only returns the matched active coupon.
     */
    public function storefrontValidate(Request $request): JsonResponse
    {
        $raw = (string) ($request->header('X-Store-Id') ?? $request->input('store_id', ''));
        if (trim($raw) === '') {
            return response()->json(['message' => 'Store ID required.', 'valid' => false], 400);
        }

        $storeId = $this->canonicalStoreId($raw);
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'cart_total' => ['nullable', 'numeric', 'min:0'],
        ]);

        $code = strtoupper(trim((string) preg_replace('/\s+/', '', $data['code'])));
        $cartTotal = (float) ($data['cart_total'] ?? 0);

        $coupon = Coupon::query()
            ->withoutGlobalScope('store')
            ->where('store_id', $storeId)
            ->whereRaw('UPPER(TRIM(code)) = ?', [$code])
            ->first();

        if (! $coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon code is invalid.',
                'store_id' => $storeId,
            ], 404);
        }

        $active = ((bool) $coupon->is_active) && strtolower((string) $coupon->status) === 'active';
        if (! $active) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon is inactive or expired.',
                'store_id' => $storeId,
            ], 422);
        }

        if ($coupon->expires_at && $coupon->expires_at->isPast()) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon has expired.',
                'store_id' => $storeId,
            ], 422);
        }

        if ($coupon->max_uses !== null && (int) $coupon->usage_count >= (int) $coupon->max_uses) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon usage limit reached.',
                'store_id' => $storeId,
            ], 422);
        }

        $minOrder = (float) ($coupon->min_order_amount ?? 0);
        if ($minOrder > 0 && $cartTotal > 0 && $cartTotal < $minOrder) {
            return response()->json([
                'valid' => false,
                'message' => 'Minimum order amount not met.',
                'min_order_amount' => $minOrder,
                'store_id' => $storeId,
            ], 422);
        }

        $discountValue = (float) $coupon->discount_value;
        $discount = $coupon->discount_type === 'percentage'
            ? round($cartTotal * ($discountValue / 100), 2)
            : min($cartTotal > 0 ? $cartTotal : $discountValue, $discountValue);

        return response()->json([
            'valid' => true,
            'store_id' => $storeId,
            'discount' => $discount,
            'data' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'discount_type' => $coupon->discount_type,
                'discount_value' => $coupon->discount_value,
                'min_order_amount' => $coupon->min_order_amount,
                'max_uses' => $coupon->max_uses,
                'usage_count' => $coupon->usage_count,
                'status' => $coupon->status,
                'is_active' => $coupon->is_active,
                'expires_at' => $coupon->expires_at,
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
            'code' => ['required', 'string', 'max:64'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_uses' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['active', 'expired', 'scheduled'])],
            'is_active' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
            'design_type' => ['nullable', Rule::in(['solid_color', 'image_based', 'image_only'])],
            'design_color' => ['nullable', 'string', 'max:32'],
            'design_image_url' => ['nullable', 'string'],
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
            'design_type' => $data['design_type'] ?? 'solid_color',
            'design_color' => $data['design_color'] ?? null,
            'design_image_url' => $data['design_image_url'] ?? null,
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
            'design_type' => ['sometimes', Rule::in(['solid_color', 'image_based', 'image_only'])],
            'design_color' => ['nullable', 'string', 'max:32'],
            'design_image_url' => ['nullable', 'string'],
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
