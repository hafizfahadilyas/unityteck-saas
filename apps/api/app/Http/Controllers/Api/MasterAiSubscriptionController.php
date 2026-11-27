<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSubscriptionPlan;
use App\Models\MerchantAiSubscription;
use App\Models\Store;
use App\Models\User;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MasterAiSubscriptionController extends Controller
{
    /**
     * List all 6 AI Subscription Plans (Monthly & Yearly: Basic, Advanced, Most Popular)
     */
    public function index(): JsonResponse
    {
        $plans = AiSubscriptionPlan::withCount('subscriptions')->orderBy('price_sar', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $plans,
        ]);
    }

    /**
     * Update AI Plan details
     */
    public function updatePlan(Request $request, string $id): JsonResponse
    {
        $plan = AiSubscriptionPlan::find($id);
        if (!$plan) {
            return response()->json(['success' => false, 'message' => 'AI plan not found'], 404);
        }

        $validated = $request->validate([
            'name_en' => 'nullable|string',
            'name_ar' => 'nullable|string',
            'price_sar' => 'nullable|numeric',
            'credits' => 'nullable|integer',
            'daily_limit' => 'nullable|integer',
            'monthly_limit' => 'nullable|integer',
            'image_generation_limit' => 'nullable|integer',
            'calling_minutes' => 'nullable|integer',
            'bonus_credits' => 'nullable|integer',
            'model_permissions' => 'nullable|array',
            'features' => 'nullable|array',
            'is_popular' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'reason' => 'required|string',
        ]);

        $before = $plan->toArray();

        // If setting this plan to is_popular = true, reset other plans in the same billing cycle
        if (!empty($validated['is_popular']) && $validated['is_popular'] === true) {
            AiSubscriptionPlan::where('billing_cycle', $plan->billing_cycle)->update(['is_popular' => false]);
        }

        $plan->update($validated);

        MasterAuditService::record(
            'update_ai_plan',
            'ai_subscriptions',
            null,
            null,
            $before,
            $plan->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'AI plan updated successfully',
            'data' => $plan,
        ]);
    }

    /**
     * Assign AI Subscription to a Merchant / Store
     */
    public function assignSubscription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|string|exists:stores,id',
            'merchant_id' => 'nullable|string',
            'plan_id' => 'required|string|exists:ai_subscription_plans,id',
            'status' => 'nullable|string|in:active,trial,suspended',
            'duration_days' => 'nullable|integer',
            'custom_limits' => 'nullable|array',
            'reason' => 'required|string',
        ]);

        $store = Store::findOrFail($validated['store_id']);
        $plan = AiSubscriptionPlan::findOrFail($validated['plan_id']);

        $subscription = MerchantAiSubscription::firstOrNew(['store_id' => $store->id]);
        $before = $subscription->toArray();

        $days = (int) ($validated['duration_days'] ?? ($plan->billing_cycle === 'yearly' ? 365 : 30));

        $subscription->id = $subscription->id ?: 'aisub_' . Str::random(16);
        $subscription->merchant_id = $validated['merchant_id'] ?? $store->owner_name;
        $subscription->plan_id = $plan->id;
        $subscription->status = $validated['status'] ?? 'active';
        $subscription->starts_at = now();
        $subscription->ends_at = now()->addDays($days);
        if (isset($validated['custom_limits'])) {
            $subscription->custom_limits = $validated['custom_limits'];
        }
        $subscription->assigned_by = optional($request->user())->id;
        $subscription->save();

        MasterAuditService::record(
            'assign_ai_subscription',
            'ai_subscriptions',
            $store->id,
            $validated['merchant_id'] ?? null,
            $before,
            $subscription->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "Assigned AI plan {$plan->name_en} to store {$store->name}",
            'data' => $subscription->load('plan'),
        ]);
    }

    /**
     * Suspend / Reactivate AI Subscription
     */
    public function toggleSubscriptionStatus(Request $request, string $id): JsonResponse
    {
        $subscription = MerchantAiSubscription::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|string|in:active,suspended',
            'reason' => 'required|string',
        ]);

        $before = $subscription->status;
        $subscription->status = $validated['status'];
        $subscription->save();

        MasterAuditService::record(
            'toggle_ai_subscription_status',
            'ai_subscriptions',
            $subscription->store_id,
            $subscription->merchant_id,
            ['status' => $before],
            ['status' => $subscription->status],
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => "AI subscription status updated to {$subscription->status}",
            'data' => $subscription,
        ]);
    }
}
