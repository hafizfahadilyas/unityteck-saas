<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Store;
use App\Support\HostingerCloud;
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
            $custom = $code === 'custom';
            $out[] = [
                'code' => $code,
                'id' => $row?->id ?? $meta['id'],
                'name' => $row?->name ?? $meta['name'],
                'price_sar' => $row?->price_sar ?? $meta['price_sar'],
                'currency' => 'SAR',
                'product_limit' => $custom ? ($row?->product_limit ?? $meta['product_limit']) : $meta['product_limit'],
                'order_limit' => $meta['order_limit'],
                'storage_mb' => $custom ? ($row?->storage_mb ?? $meta['storage_mb']) : $meta['storage_mb'],
                'team_seats' => $custom ? ($row?->team_seats ?? $meta['team_seats']) : $meta['team_seats'],
                'features' => $custom ? ($row?->features ?? $meta['features']) : $meta['features'],
            ];
        }

        return response()->json([
            'data' => $out,
            'platform' => [
                'name_en' => config('souq.name_en'),
                'name_ar' => config('souq.name_ar'),
                'tagline_en' => config('souq.tagline_en'),
                'tagline_ar' => config('souq.tagline_ar'),
                'central_repo' => config('souq.central_repo'),
                'package' => config('souq.package'),
            ],
        ]);
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
            'hosting' => HostingerCloud::domainPolicy($storeId),
            'store_id' => $storeId,
        ]);
    }
}
