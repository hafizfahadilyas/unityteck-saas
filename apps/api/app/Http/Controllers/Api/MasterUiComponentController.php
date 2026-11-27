<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MerchantComponentOverride;
use App\Models\Store;
use App\Models\UiComponentRegistry;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterUiComponentController extends Controller
{
    /**
     * List all UI components with overrides
     */
    public function index(Request $request): JsonResponse
    {
        $components = UiComponentRegistry::withCount('overrides')->orderBy('display_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $components,
        ]);
    }

    /**
     * Global Component Toggle (Hide/show card, box, button, or widget across all merchants)
     */
    public function toggleGlobal(Request $request, string $id): JsonResponse
    {
        $component = UiComponentRegistry::find($id);
        if (!$component) {
            return response()->json(['success' => false, 'message' => 'Component not found'], 404);
        }

        $validated = $request->validate([
            'global_visibility' => 'required|boolean',
            'reason' => 'required|string',
        ]);

        $before = $component->global_visibility;
        $component->global_visibility = $validated['global_visibility'];
        $component->save();

        MasterAuditService::record(
            'toggle_global_ui_component',
            'ui_component_management',
            null,
            null,
            ['global_visibility' => $before],
            ['global_visibility' => $component->global_visibility],
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "Component {$component->name_en} updated globally to " . ($component->global_visibility ? 'Visible' : 'Hidden'),
            'data' => $component,
        ]);
    }

    /**
     * Store-Specific Component Override (Title, display order, visibility, allowed settings)
     */
    public function setStoreOverride(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'component_id' => 'required|string|exists:ui_component_registry,id',
            'merchant_id' => 'nullable|string',
            'is_visible' => 'required|boolean',
            'custom_order' => 'nullable|integer',
            'custom_title_en' => 'nullable|string',
            'custom_title_ar' => 'nullable|string',
            'custom_settings' => 'nullable|array',
            'reason' => 'required|string',
        ]);

        $override = MerchantComponentOverride::firstOrNew([
            'store_id' => $validated['store_id'],
            'component_id' => $validated['component_id'],
        ]);

        $before = $override->toArray();

        $override->id = $override->id ?: 'c_ov_' . Str::random(16);
        $override->merchant_id = $validated['merchant_id'] ?? null;
        $override->is_visible = $validated['is_visible'];
        $override->custom_order = $validated['custom_order'] ?? null;
        $override->custom_title_en = $validated['custom_title_en'] ?? null;
        $override->custom_title_ar = $validated['custom_title_ar'] ?? null;
        $override->custom_settings = $validated['custom_settings'] ?? null;
        $override->updated_by = optional($request->user())->id;
        $override->save();

        MasterAuditService::record(
            'set_store_ui_component',
            'ui_component_management',
            $validated['store_id'],
            $validated['merchant_id'] ?? null,
            $before,
            $override->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Component override saved for store',
            'data' => $override->load('component'),
        ]);
    }

    /**
     * Reset Component Overrides for a Store
     */
    public function resetStoreOverrides(Request $request, string $storeId): JsonResponse
    {
        $deleted = MerchantComponentOverride::where('store_id', $storeId)->delete();

        MasterAuditService::record(
            'reset_store_ui_components',
            'ui_component_management',
            $storeId,
            null,
            ['deleted_count' => $deleted],
            ['status' => 'inherited_defaults'],
            $request->input('reason', 'Reset UI components to defaults')
        );

        return response()->json([
            'success' => true,
            'message' => "Reset {$deleted} component overrides to inherited defaults",
        ]);
    }
}
