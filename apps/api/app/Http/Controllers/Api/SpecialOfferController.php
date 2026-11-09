<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpecialOffer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class SpecialOfferController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('special_offers')) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'Special offers table not ready — run migration / 08_special_offers.sql',
                'store_id' => $storeId,
            ]);
        }

        $rows = SpecialOffer::query()
            ->where('store_id', $storeId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rows,
            'store_id' => $storeId,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('special_offers')) {
            return response()->json(['message' => 'Special offers table missing.'], 503);
        }

        $data = $this->validateOffer($request);
        $offer = SpecialOffer::query()->create([
            'id' => $this->newId('so'),
            'store_id' => $storeId,
            'title_ar' => $data['title_ar'] ?? null,
            'title_en' => $data['title_en'] ?? null,
            'offer_type' => $data['offer_type'] ?? 'percentage',
            'discount_value' => $data['discount_value'] ?? 0,
            'min_order_value' => $data['min_order_value'] ?? null,
            'max_discount' => $data['max_discount'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'message' => $data['message'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'product_scope' => $data['product_scope'] ?? 'specific',
            'product_ids' => $data['product_ids'] ?? [],
            'banner_bg_color' => $data['banner_bg_color'] ?? null,
            'banner_image_url' => $data['banner_image_url'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $offer,
            'store_id' => $storeId,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $offer = SpecialOffer::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $this->validateOffer($request, true);
        $fill = [];
        foreach ([
            'title_ar', 'title_en', 'offer_type', 'discount_value', 'min_order_value',
            'max_discount', 'start_date', 'end_date', 'message', 'status',
            'product_scope', 'product_ids', 'banner_bg_color', 'banner_image_url',
        ] as $key) {
            if (array_key_exists($key, $data)) {
                $fill[$key] = $data[$key];
            }
        }
        $offer->fill($fill);
        $offer->save();

        return response()->json([
            'success' => true,
            'data' => $offer,
            'store_id' => $storeId,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $offer = SpecialOffer::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();
        $offer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Special offer deleted.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * Public storefront: best currently-active special offer for this store.
     */
    public function storefrontActive(Request $request): JsonResponse
    {
        $storeId = trim((string) $request->query('store_id', ''));
        if ($storeId === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        if (! Schema::hasTable('special_offers')) {
            return response()->json([
                'success' => true,
                'data' => null,
                'store_id' => $storeId,
            ]);
        }

        $now = now();
        $offer = SpecialOffer::query()
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderByDesc('discount_value')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $offer,
            'store_id' => $storeId,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateOffer(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title_ar' => ['nullable', 'string', 'max:255'],
            'title_en' => ['nullable', 'string', 'max:255'],
            'offer_type' => [$req, Rule::in(['percentage', 'fixed', 'bogo', 'table', 'fixed_price', 'category'])],
            'discount_value' => [$req, 'numeric', 'min:0'],
            'min_order_value' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'message' => ['nullable', 'string', 'max:500'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'draft'])],
            'product_scope' => ['nullable', Rule::in(['all', 'specific'])],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['string', 'max:64'],
            'banner_bg_color' => ['nullable', 'string', 'max:32'],
            'banner_image_url' => ['nullable', 'string', 'max:2048'],
        ]);
    }
}
