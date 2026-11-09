<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Support\CanvaTemplates;
use App\Support\KsaCanvaTemplateCatalog;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Step 1 — Canva KSA template entitlements (catalog is SPA; limits are API).
 */
class DesignTemplatesController extends Controller
{
    use ResolvesStoreId;

    public function entitlements(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->findOrFail($storeId);
        $plan = Plans::forStore($store);
        $ent = CanvaTemplates::entitlement($store);

        return response()->json([
            'data' => [
                'store_id' => $storeId,
                'plan_code' => $plan['code'],
                'billed_code' => $plan['billed_code'],
                'master_granted_pro' => $plan['master_granted_pro'],
                ...$ent,
            ],
        ]);
    }

    public function daily(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'category' => ['required', Rule::in(['banner', 'logo', 'product', 'social', 'category'])],
        ]);

        $store = Store::query()->findOrFail($storeId);
        $plan = Plans::forStore($store);
        $daily = KsaCanvaTemplateCatalog::dailyForStore($storeId, $validated['category']);

        return response()->json([
            'data' => [
                ...$daily,
                'store_id' => $storeId,
                'plan_code' => $plan['code'],
            ],
        ]);
    }
}
