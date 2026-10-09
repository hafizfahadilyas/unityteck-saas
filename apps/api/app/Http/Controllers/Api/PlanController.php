<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Store;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    use ResolvesStoreId;

    /** Catalog Free/Paid/Pro/Custom (Master + Store). */
    public function index(): JsonResponse
    {
        $db = Plan::query()->where('is_active', true)->orderBy('code')->get()->keyBy('code');
        $out = [];
        foreach (Plans::catalog() as $code => $meta) {
            $row = $db->get($code);
            $out[] = [
                'code' => $code,
                'id' => $row?->id ?? $meta['id'],
                'name' => $row?->name ?? $meta['name'],
                'product_limit' => $row?->product_limit ?? $meta['product_limit'],
                'order_limit' => $meta['order_limit'],
                'storage_mb' => $row?->storage_mb ?? $meta['storage_mb'],
                'team_seats' => $row?->team_seats ?? $meta['team_seats'],
                'features' => $row?->features ?? $meta['features'],
            ];
        }

        return response()->json(['data' => $out]);
    }

    /** Effective plan + usage for current X-Store-Id. */
    public function current(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->findOrFail($storeId);

        return response()->json([
            'data' => Plans::forStore($store),
            'store_id' => $storeId,
        ]);
    }
}
