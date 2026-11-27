<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Store;
use App\Models\Subscription;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterStorePlanController extends Controller
{
    /**
     * List all Store Plans
     */
    public function index(): JsonResponse
    {
        $plans = Plan::withCount('subscriptions')->orderBy('price_sar', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }

    /**
     * Update Store Plan configuration (Does NOT retroactively alter paid merchant subscriptions)
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $plan = Plan::find($id);
        if (!$plan) {
            return response()->json(['success' => false, 'message' => 'Store plan not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'price_sar' => 'nullable|integer',
            'product_limit' => 'nullable|integer',
            'storage_mb' => 'nullable|integer',
            'team_seats' => 'nullable|integer',
            'features' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'reason' => 'required|string',
        ]);

        $before = $plan->toArray();

        if (isset($validated['name'])) $plan->name = $validated['name'];
        if (isset($validated['price_sar'])) $plan->price_sar = $validated['price_sar'];
        if (isset($validated['product_limit'])) $plan->product_limit = $validated['product_limit'];
        if (isset($validated['storage_mb'])) $plan->storage_mb = $validated['storage_mb'];
        if (isset($validated['team_seats'])) $plan->team_seats = $validated['team_seats'];
        if (isset($validated['features'])) $plan->features = $validated['features'];
        if (isset($validated['is_active'])) $plan->is_active = $validated['is_active'];
        $plan->save();

        MasterAuditService::record(
            'update_store_plan',
            'store_plans',
            null,
            null,
            $before,
            $plan->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Store plan updated successfully. Existing subscriptions remain intact.',
            'data' => $plan,
        ]);
    }

    /**
     * Assign or change a store's Store Plan
     */
    public function assignStorePlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'plan_id' => 'required|string|exists:plans,id',
            'status' => 'nullable|string|in:active,trial,grace,expired,suspended',
            'duration_days' => 'nullable|integer',
            'reason' => 'required|string',
        ]);

        $store = Store::findOrFail($validated['store_id']);
        $plan = Plan::findOrFail($validated['plan_id']);

        $subscription = Subscription::firstOrNew(['store_id' => $store->id]);
        $before = $subscription->toArray();

        $subscription->id = $subscription->id ?: 'sub_' . Str::random(16);
        $subscription->plan_id = $plan->id;
        $subscription->status = $validated['status'] ?? 'active';
        $subscription->starts_at = now();

        $days = (int) ($validated['duration_days'] ?? 30);
        $subscription->ends_at = now()->addDays($days);
        $subscription->save();

        // Update snapshot on store model
        $store->plan = $plan->code;
        $store->subscription_status = $subscription->status;
        $store->save();

        MasterAuditService::record(
            'assign_store_plan',
            'store_plans',
            $store->id,
            null,
            $before,
            $subscription->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "Assigned plan {$plan->name} to store {$store->name}",
            'data' => $subscription->load('plan'),
        ]);
    }
}
