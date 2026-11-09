<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashbackCampaign;
use App\Services\Cashback\CashbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class CashbackController extends Controller
{
    use ResolvesStoreId;

    public function __construct(private CashbackService $cashback)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('cashback_campaigns')) {
            return response()->json([
                'success' => true,
                'data' => [],
                'message' => 'Cashback tables not ready — run migration / 07_cashback_campaigns.sql',
                'store_id' => $storeId,
            ]);
        }

        $rows = CashbackCampaign::query()
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

        if (! Schema::hasTable('cashback_campaigns')) {
            return response()->json(['message' => 'Cashback tables missing.'], 503);
        }

        $data = $this->validateCampaign($request);
        $payload = [
            'id' => $this->newId('cb'),
            'store_id' => $storeId,
            'name' => $data['name'],
            'type' => $data['type'],
            'value' => $data['value'],
            'min_cart_value' => $data['min_cart_value'] ?? 0,
            'max_cashback_per_order' => $data['max_cashback_per_order'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'product_scope' => $data['product_scope'] ?? 'all',
            'product_ids' => $data['product_ids'] ?? [],
            'store_wallet_only' => true, // always enforced
            'credit_expiry_days' => $data['credit_expiry_days'] ?? null,
            'hold_days' => $data['hold_days'] ?? 7,
        ];
        if (Schema::hasColumn('cashback_campaigns', 'image_url')) {
            $payload['image_url'] = $data['image_url'] ?? null;
        }
        $campaign = CashbackCampaign::query()->create($payload);

        return response()->json([
            'success' => true,
            'data' => $campaign,
            'store_id' => $storeId,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $campaign = CashbackCampaign::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();

        $data = $this->validateCampaign($request, true);
        $fill = [
            'name' => $data['name'] ?? $campaign->name,
            'type' => $data['type'] ?? $campaign->type,
            'value' => $data['value'] ?? $campaign->value,
            'min_cart_value' => array_key_exists('min_cart_value', $data) ? $data['min_cart_value'] : $campaign->min_cart_value,
            'max_cashback_per_order' => array_key_exists('max_cashback_per_order', $data) ? $data['max_cashback_per_order'] : $campaign->max_cashback_per_order,
            'start_date' => array_key_exists('start_date', $data) ? $data['start_date'] : $campaign->start_date,
            'end_date' => array_key_exists('end_date', $data) ? $data['end_date'] : $campaign->end_date,
            'status' => $data['status'] ?? $campaign->status,
            'product_scope' => $data['product_scope'] ?? $campaign->product_scope,
            'product_ids' => array_key_exists('product_ids', $data) ? ($data['product_ids'] ?? []) : $campaign->product_ids,
            'store_wallet_only' => true,
            'credit_expiry_days' => array_key_exists('credit_expiry_days', $data) ? $data['credit_expiry_days'] : $campaign->credit_expiry_days,
            'hold_days' => $data['hold_days'] ?? $campaign->hold_days,
        ];
        if (Schema::hasColumn('cashback_campaigns', 'image_url') && array_key_exists('image_url', $data)) {
            $fill['image_url'] = $data['image_url'];
        }
        $campaign->fill($fill);
        $campaign->save();

        return response()->json([
            'success' => true,
            'data' => $campaign,
            'store_id' => $storeId,
        ]);
    }

    /**
     * Public storefront: best currently-active cashback campaign for this store.
     */
    public function storefrontActive(Request $request): JsonResponse
    {
        $storeId = trim((string) $request->query('store_id', ''));
        if ($storeId === '') {
            return response()->json(['message' => 'store_id is required.'], 422);
        }

        if (! Schema::hasTable('cashback_campaigns')) {
            return response()->json([
                'success' => true,
                'data' => null,
                'store_id' => $storeId,
            ]);
        }

        $now = now();
        $campaign = CashbackCampaign::query()
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            })
            ->orderByDesc('value')
            ->first();

        return response()->json([
            'success' => true,
            'data' => $campaign,
            'store_id' => $storeId,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $campaign = CashbackCampaign::query()
            ->where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();
        $campaign->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cashback campaign deleted.',
            'store_id' => $storeId,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function validateCampaign(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$req, 'string', 'max:255'],
            'image_url' => ['nullable', 'string', 'max:2048'],
            'type' => [$req, Rule::in(['percentage', 'fixed'])],
            'value' => [$req, 'numeric', 'min:0'],
            'min_cart_value' => ['nullable', 'numeric', 'min:0'],
            'max_cashback_per_order' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(['active', 'draft', 'completed', 'paused'])],
            'product_scope' => ['nullable', Rule::in(['all', 'include', 'exclude'])],
            'product_ids' => ['nullable', 'array'],
            'product_ids.*' => ['string', 'max:64'],
            'credit_expiry_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'hold_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'store_wallet_only' => ['nullable', 'boolean'],
        ]);
    }
}
