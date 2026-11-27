<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiFeatureRegistry;
use App\Models\MerchantFeatureOverride;
use App\Models\Store;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterAiFeatureRegistryController extends Controller
{
    /**
     * List all AI features with active override counts
     */
    public function index(Request $request): JsonResponse
    {
        $features = AiFeatureRegistry::withCount('overrides')->orderBy('category', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $features,
        ]);
    }

    /**
     * Global Feature Update (Enable/Disable globally, change cost, change limits)
     */
    public function updateGlobalFeature(Request $request, string $id): JsonResponse
    {
        $feature = AiFeatureRegistry::find($id);
        if (!$feature) {
            return response()->json(['success' => false, 'message' => 'AI feature not found'], 404);
        }

        $validated = $request->validate([
            'global_status' => 'nullable|boolean',
            'credit_cost' => 'nullable|integer',
            'daily_limit' => 'nullable|integer',
            'monthly_limit' => 'nullable|integer',
            'default_provider' => 'nullable|string',
            'default_model' => 'nullable|string',
            'page_visible' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'reason' => 'required|string',
        ]);

        $before = $feature->toArray();
        $feature->update($validated);

        MasterAuditService::record(
            'update_global_ai_feature',
            'ai_feature_registry',
            null,
            null,
            $before,
            $feature->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "AI Feature {$feature->name_en} updated globally",
            'data' => $feature,
        ]);
    }

    /**
     * Individual Merchant / Store Feature Override
     */
    public function setMerchantOverride(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'feature_id' => 'required|string|exists:ai_feature_registry,id',
            'merchant_id' => 'nullable|string',
            'is_enabled' => 'required|boolean',
            'custom_credit_cost' => 'nullable|integer',
            'custom_daily_limit' => 'nullable|integer',
            'custom_monthly_limit' => 'nullable|integer',
            'notes' => 'nullable|string',
            'reason' => 'required|string',
        ]);

        $override = MerchantFeatureOverride::firstOrNew([
            'store_id' => $validated['store_id'],
            'feature_id' => $validated['feature_id'],
        ]);

        $before = $override->toArray();

        $override->id = $override->id ?: 'f_ov_' . Str::random(16);
        $override->merchant_id = $validated['merchant_id'] ?? null;
        $override->is_enabled = $validated['is_enabled'];
        $override->custom_credit_cost = $validated['custom_credit_cost'] ?? null;
        $override->custom_daily_limit = $validated['custom_daily_limit'] ?? null;
        $override->custom_monthly_limit = $validated['custom_monthly_limit'] ?? null;
        $override->notes = $validated['notes'] ?? null;
        $override->updated_by = optional($request->user())->id;
        $override->save();

        MasterAuditService::record(
            'set_merchant_feature_override',
            'ai_feature_registry',
            $validated['store_id'],
            $validated['merchant_id'] ?? null,
            $before,
            $override->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Feature override saved successfully for store',
            'data' => $override->load('feature'),
        ]);
    }

    /**
     * Bulk Feature Toggle for Selected Merchants
     */
    public function bulkToggleFeature(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_ids' => 'required|array',
            'store_ids.*' => 'string',
            'feature_id' => 'required|string|exists:ai_feature_registry,id',
            'is_enabled' => 'required|boolean',
            'reason' => 'required|string',
        ]);

        $storeIds = $validated['store_ids'];
        $featureId = $validated['feature_id'];
        $isEnabled = $validated['is_enabled'];
        $reason = $validated['reason'];

        $count = 0;
        foreach ($storeIds as $sId) {
            MerchantFeatureOverride::updateOrInsert(
                ['store_id' => $sId, 'feature_id' => $featureId],
                [
                    'id' => 'f_ov_' . Str::random(16),
                    'is_enabled' => $isEnabled,
                    'updated_by' => optional($request->user())->id,
                    'updated_at' => now(),
                ]
            );
            $count++;
        }

        MasterAuditService::record(
            'bulk_toggle_ai_feature',
            'ai_feature_registry',
            null,
            null,
            ['feature_id' => $featureId, 'stores_count' => count($storeIds)],
            ['is_enabled' => $isEnabled, 'updated_count' => $count],
            $reason
        );

        return response()->json([
            'success' => true,
            'message' => "Feature access updated for {$count} stores",
        ]);
    }

    /**
     * Reset Store Feature Overrides (Revert to Inherited Defaults)
     */
    public function resetStoreOverrides(Request $request, string $storeId): JsonResponse
    {
        $deleted = MerchantFeatureOverride::where('store_id', $storeId)->delete();

        MasterAuditService::record(
            'reset_store_feature_overrides',
            'ai_feature_registry',
            $storeId,
            null,
            ['deleted_overrides_count' => $deleted],
            ['status' => 'inherited_defaults'],
            $request->input('reason', 'Reset to inherited global defaults')
        );

        return response()->json([
            'success' => true,
            'message' => "Reset {$deleted} feature overrides to inherited defaults",
        ]);
    }
}
