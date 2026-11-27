<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DashboardPageRegistry;
use App\Models\MerchantPageVisibility;
use App\Models\Store;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterPageVisibilityController extends Controller
{
    /**
     * List all dashboard pages with overrides
     */
    public function index(Request $request): JsonResponse
    {
        $pages = DashboardPageRegistry::withCount('overrides')->orderBy('display_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $pages,
        ]);
    }

    /**
     * Global Page Toggle (Hide/show page across all merchants)
     */
    public function toggleGlobal(Request $request, string $id): JsonResponse
    {
        $page = DashboardPageRegistry::find($id);
        if (!$page) {
            return response()->json(['success' => false, 'message' => 'Dashboard page not found'], 404);
        }

        $validated = $request->validate([
            'global_visibility' => 'required|boolean',
            'reason' => 'required|string',
        ]);

        $before = $page->global_visibility;
        $page->global_visibility = $validated['global_visibility'];
        $page->save();

        MasterAuditService::record(
            'toggle_global_page_visibility',
            'page_visibility',
            null,
            null,
            ['global_visibility' => $before],
            ['global_visibility' => $page->global_visibility],
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "Page {$page->name_en} visibility updated globally to " . ($page->global_visibility ? 'Visible' : 'Hidden'),
            'data' => $page,
        ]);
    }

    /**
     * Store-Specific Page Visibility Override
     */
    public function setStoreOverride(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'page_id' => 'required|string|exists:dashboard_page_registry,id',
            'merchant_id' => 'nullable|string',
            'is_visible' => 'required|boolean',
            'reason' => 'required|string',
        ]);

        $override = MerchantPageVisibility::firstOrNew([
            'store_id' => $validated['store_id'],
            'page_id' => $validated['page_id'],
        ]);

        $before = $override->toArray();

        $override->id = $override->id ?: 'p_ov_' . Str::random(16);
        $override->merchant_id = $validated['merchant_id'] ?? null;
        $override->is_visible = $validated['is_visible'];
        $override->updated_by = optional($request->user())->id;
        $override->save();

        MasterAuditService::record(
            'set_store_page_visibility',
            'page_visibility',
            $validated['store_id'],
            $validated['merchant_id'] ?? null,
            $before,
            $override->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Page visibility override saved for store',
            'data' => $override->load('page'),
        ]);
    }

    /**
     * Reset Page Visibility Overrides for a Store
     */
    public function resetStoreOverrides(Request $request, string $storeId): JsonResponse
    {
        $deleted = MerchantPageVisibility::where('store_id', $storeId)->delete();

        MasterAuditService::record(
            'reset_store_page_visibility',
            'page_visibility',
            $storeId,
            null,
            ['deleted_count' => $deleted],
            ['status' => 'inherited_defaults'],
            $request->input('reason', 'Reset page visibilities to defaults')
        );

        return response()->json([
            'success' => true,
            'message' => "Reset {$deleted} page overrides to inherited defaults",
        ]);
    }
}
