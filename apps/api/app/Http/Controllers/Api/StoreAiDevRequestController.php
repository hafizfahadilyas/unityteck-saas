<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreAiDevRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Merchant can open a diagnostics support request only.
 * Cannot run Master diagnose, cannot edit source, cannot deploy.
 */
class StoreAiDevRequestController extends Controller
{
    use ResolvesStoreId;

    public function index(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('store_ai_dev_requests')) {
            return response()->json(['data' => [], 'message' => 'Not migrated yet.'], 503);
        }

        $rows = StoreAiDevRequest::query()
            ->where('store_id', $storeId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $rows, 'store_id' => $storeId]);
    }

    public function store(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        if (! Schema::hasTable('store_ai_dev_requests')) {
            return response()->json(['message' => 'Not migrated yet.'], 503);
        }

        if (! Store::query()->where('id', $storeId)->exists()) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'min:3', 'max:191'],
            'description' => ['required', 'string', 'min:5', 'max:8000'],
            'category' => ['sometimes', Rule::in(['frontend', 'api', 'database', 'integration', 'other'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high'])],
            'symptoms' => ['nullable', 'array'],
        ]);

        $row = StoreAiDevRequest::query()->create([
            'id' => 'aidev-'.Str::lower(Str::random(12)),
            'store_id' => $storeId,
            'status' => 'open',
            'priority' => $data['priority'] ?? 'medium',
            'category' => $data['category'] ?? 'other',
            'title' => $data['title'],
            'description' => $data['description'],
            'requested_by_user_id' => $request->user()?->id,
            'symptoms' => $data['symptoms'] ?? null,
            'auto_deploy_allowed' => false,
        ]);

        return response()->json([
            'data' => $row,
            'message' => 'Support request opened. Master Admin will diagnose. You cannot edit platform source.',
            'message_ar' => 'تم فتح طلب الدعم. الماستر سيشخّص. لا يمكنك تعديل مصدر المنصة.',
        ], 201);
    }
}
