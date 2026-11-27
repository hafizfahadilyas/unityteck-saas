<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiCreditTransaction;
use App\Models\AiFeatureRegistry;
use App\Models\AiMerchantLimit;
use App\Models\AiSubscriptionPlan;
use App\Models\DashboardPageRegistry;
use App\Models\MerchantAiSubscription;
use App\Models\MerchantComponentOverride;
use App\Models\MerchantFeatureOverride;
use App\Models\MerchantPageVisibility;
use App\Models\Order;
use App\Models\Plan;
use App\Models\SeoConfig;
use App\Models\Store;
use App\Models\StoreAiPayment;
use App\Models\StoreUser;
use App\Models\Subscription;
use App\Models\UiComponentRegistry;
use App\Models\User;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterMerchantManagementController extends Controller
{
    /**
     * Merchant List with Advanced Filtering & Search
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $planFilter = $request->query('plan');
        $aiPlanFilter = $request->query('ai_plan');
        $statusFilter = $request->query('status');
        $perPage = (int) ($request->query('per_page') ?? 15);

        $query = User::whereIn('role', ['manager', 'merchant', 'store_owner', 'user']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $merchants = $query->paginate($perPage);

        $merchantData = $merchants->map(function ($user) {
            // Associated stores
            $storeUser = StoreUser::where('user_id', $user->id)->first();
            $store = $storeUser ? Store::find($storeUser->store_id) : Store::where('owner_name', $user->name)->orWhere('email', $user->email)->first();

            // Store plan & subscription
            $storeSubscription = $store ? Subscription::with('plan')->where('store_id', $store->id)->first() : null;
            $storePlanCode = $storeSubscription && $storeSubscription->plan ? $storeSubscription->plan->code : ($store ? $store->plan : 'free');

            // AI subscription
            $aiSubscription = $store ? MerchantAiSubscription::with('plan')->where('store_id', $store->id)->first() : null;
            $aiPlanCode = $aiSubscription && $aiSubscription->plan ? $aiSubscription->plan->code : 'none';

            // Wallet & credits
            $wallet = $store ? AiMerchantLimit::where('store_id', $store->id)->first() : null;

            // Pending payments
            $pendingPayments = $store ? StoreAiPayment::where('store_id', $store->id)->where('status', 'pending')->count() : 0;

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'store' => $store ? [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                    'status' => $store->status,
                    'domain' => $store->domain ?: $store->custom_domain,
                    'orders_count' => $store->orders_count ?? 0,
                    'revenue' => $store->revenue ?? 0,
                ] : null,
                'store_plan' => [
                    'code' => $storePlanCode,
                    'status' => $storeSubscription ? $storeSubscription->status : 'trial',
                    'ends_at' => $storeSubscription ? $storeSubscription->ends_at : null,
                ],
                'ai_plan' => [
                    'code' => $aiPlanCode,
                    'status' => $aiSubscription ? $aiSubscription->status : 'none',
                    'ends_at' => $aiSubscription ? $aiSubscription->ends_at : null,
                ],
                'wallet' => [
                    'remaining_credits' => $wallet ? $wallet->remaining_credits : 0,
                    'daily_limit' => $wallet ? $wallet->daily_image_limit : 25,
                    'monthly_limit' => $wallet ? $wallet->monthly_image_limit : 200,
                    'ai_enabled' => $wallet ? (bool) $wallet->ai_enabled : true,
                    'is_paused' => $wallet ? (bool) $wallet->is_paused : false,
                ],
                'pending_payments_count' => $pendingPayments,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $merchantData,
            'pagination' => [
                'current_page' => $merchants->currentPage(),
                'total_pages' => $merchants->lastPage(),
                'total_records' => $merchants->total(),
                'per_page' => $merchants->perPage(),
            ],
        ]);
    }

    /**
     * Individual Merchant Control Profile (Full 360-degree data)
     */
    public function showProfile(string $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Merchant not found'], 404);
        }

        // Associated stores
        $storeUsers = StoreUser::where('user_id', $user->id)->get();
        $storeIds = $storeUsers->pluck('store_id')->toArray();
        if (empty($storeIds)) {
            $fallbackStore = Store::where('owner_name', $user->name)->orWhere('email', $user->email)->first();
            if ($fallbackStore) $storeIds[] = $fallbackStore->id;
        }

        $stores = Store::whereIn('id', $storeIds)->get();
        $primaryStore = $stores->first();
        $primaryStoreId = $primaryStore ? $primaryStore->id : null;

        // Store Subscriptions
        $storeSubscriptions = $primaryStoreId ? Subscription::with('plan')->where('store_id', $primaryStoreId)->get() : collect();

        // AI Subscriptions
        $aiSubscriptions = $primaryStoreId ? MerchantAiSubscription::with('plan')->where('store_id', $primaryStoreId)->get() : collect();

        // Wallet & Limits
        $aiLimits = $primaryStoreId ? AiMerchantLimit::where('store_id', $primaryStoreId)->first() : null;

        // Credit Transactions History
        $creditTransactions = $primaryStoreId ? AiCreditTransaction::where('store_id', $primaryStoreId)->orderBy('created_at', 'desc')->limit(20)->get() : collect();

        // Payments History
        $payments = $primaryStoreId ? StoreAiPayment::where('store_id', $primaryStoreId)->orderBy('created_at', 'desc')->get() : collect();

        // SEO Config
        $seo = $primaryStoreId ? SeoConfig::where('store_id', $primaryStoreId)->first() : null;

        // Feature Overrides
        $featureOverrides = $primaryStoreId ? MerchantFeatureOverride::with('feature')->where('store_id', $primaryStoreId)->get() : collect();

        // Page Visibility Overrides
        $pageVisibilities = $primaryStoreId ? MerchantPageVisibility::with('page')->where('store_id', $primaryStoreId)->get() : collect();

        // UI Component Overrides
        $componentOverrides = $primaryStoreId ? MerchantComponentOverride::with('component')->where('store_id', $primaryStoreId)->get() : collect();

        // Master Audit Logs for this merchant/store
        $auditLogs = DB::table('master_central_audit_logs')
            ->where(function ($q) use ($user, $primaryStoreId) {
                $q->where('merchant_id', $user->id);
                if ($primaryStoreId) $q->orWhere('store_id', $primaryStoreId);
            })
            ->orderBy('created_at', 'desc')
            ->limit(25)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'merchant' => $user,
                'stores' => $stores,
                'primary_store' => $primaryStore,
                'store_subscriptions' => $storeSubscriptions,
                'ai_subscriptions' => $aiSubscriptions,
                'ai_limits' => $aiLimits,
                'credit_transactions' => $creditTransactions,
                'payments' => $payments,
                'seo' => $seo,
                'feature_overrides' => $featureOverrides,
                'page_visibilities' => $pageVisibilities,
                'component_overrides' => $componentOverrides,
                'audit_logs' => $auditLogs,
            ],
        ]);
    }

    /**
     * Update Individual Merchant Profile / Limits / Status
     */
    public function updateMerchant(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Merchant not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string',
            'status' => 'nullable|string|in:active,suspended',
            'store_id' => 'nullable|string',
            'remaining_credits' => 'nullable|integer',
            'daily_image_limit' => 'nullable|integer',
            'monthly_image_limit' => 'nullable|integer',
            'ai_enabled' => 'nullable|boolean',
            'is_paused' => 'nullable|boolean',
            'reason' => 'required|string',
        ]);

        $beforeUser = $user->toArray();

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
            $user->save();
        }

        $storeId = $validated['store_id'] ?? null;
        if (!$storeId) {
            $storeUser = StoreUser::where('user_id', $user->id)->first();
            $storeId = $storeUser ? $storeUser->store_id : null;
        }

        if ($storeId) {
            $store = Store::find($storeId);
            if ($store && isset($validated['status'])) {
                $store->status = $validated['status'];
                $store->save();
            }

            // Update AI Limits
            if (isset($validated['remaining_credits']) || isset($validated['daily_image_limit']) || isset($validated['monthly_image_limit']) || isset($validated['ai_enabled']) || isset($validated['is_paused'])) {
                $limit = AiMerchantLimit::firstOrNew(['store_id' => $storeId]);
                $beforeLimit = $limit->toArray();

                if (isset($validated['remaining_credits'])) $limit->remaining_credits = $validated['remaining_credits'];
                if (isset($validated['daily_image_limit'])) $limit->daily_image_limit = $validated['daily_image_limit'];
                if (isset($validated['monthly_image_limit'])) $limit->monthly_image_limit = $validated['monthly_image_limit'];
                if (isset($validated['ai_enabled'])) $limit->ai_enabled = $validated['ai_enabled'];
                if (isset($validated['is_paused'])) $limit->is_paused = $validated['is_paused'];
                $limit->save();

                MasterAuditService::record(
                    'update_merchant_limits',
                    'merchant_management',
                    $storeId,
                    $user->id,
                    $beforeLimit,
                    $limit->toArray(),
                    $validated['reason']
                );
            }
        }

        MasterAuditService::record(
            'update_merchant_profile',
            'merchant_management',
            $storeId,
            $user->id,
            $beforeUser,
            $user->toArray(),
            $validated['reason']
        );

        return response()->json([
            'success' => true,
            'message' => 'Merchant updated successfully',
        ]);
    }

    /**
     * Bulk Merchant Operations (Preview, execution, per-merchant results)
     */
    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'merchant_ids' => 'required|array',
            'merchant_ids.*' => 'string',
            'action' => 'required|string|in:add_credits,set_limits,enable_ai,disable_ai,extend_trial,suspend,activate',
            'credit_amount' => 'nullable|integer',
            'daily_limit' => 'nullable|integer',
            'monthly_limit' => 'nullable|integer',
            'trial_days' => 'nullable|integer',
            'reason' => 'required|string',
        ]);

        $merchantIds = $validated['merchant_ids'];
        $action = $validated['action'];
        $reason = $validated['reason'];
        $results = [];

        DB::beginTransaction();
        try {
            foreach ($merchantIds as $mId) {
                $user = User::find($mId);
                if (!$user) {
                    $results[] = ['id' => $mId, 'status' => 'failed', 'error' => 'Merchant not found'];
                    continue;
                }

                $storeUser = StoreUser::where('user_id', $user->id)->first();
                $store = $storeUser ? Store::find($storeUser->store_id) : Store::where('owner_name', $user->name)->orWhere('email', $user->email)->first();
                $storeId = $store ? $store->id : null;

                if (!$storeId) {
                    $results[] = ['id' => $mId, 'name' => $user->name, 'status' => 'failed', 'error' => 'No active store found'];
                    continue;
                }

                switch ($action) {
                    case 'add_credits':
                        $creditAmount = (int) ($validated['credit_amount'] ?? 50);
                        $limit = AiMerchantLimit::firstOrCreate(
                            ['store_id' => $storeId],
                            ['remaining_credits' => 200, 'daily_image_limit' => 25, 'monthly_image_limit' => 200]
                        );
                        $beforeBal = $limit->remaining_credits;
                        $limit->remaining_credits += $creditAmount;
                        $limit->save();

                        AiCreditTransaction::create([
                            'id' => 'tx_' . Str::random(16),
                            'store_id' => $storeId,
                            'merchant_id' => $user->id,
                            'provider_id' => 'provider-gemini',
                            'transaction_type' => 'bulk_grant',
                            'amount' => $creditAmount,
                            'balance_after' => $limit->remaining_credits,
                            'reason' => $reason,
                            'created_by_user_id' => optional($request->user())->id,
                            'created_at' => now(),
                        ]);
                        break;

                    case 'enable_ai':
                        $limit = AiMerchantLimit::firstOrCreate(['store_id' => $storeId]);
                        $limit->ai_enabled = true;
                        $limit->is_paused = false;
                        $limit->save();
                        break;

                    case 'disable_ai':
                        $limit = AiMerchantLimit::firstOrCreate(['store_id' => $storeId]);
                        $limit->ai_enabled = false;
                        $limit->is_paused = true;
                        $limit->save();
                        break;

                    case 'suspend':
                        if ($store) {
                            $store->status = 'suspended';
                            $store->save();
                        }
                        break;

                    case 'activate':
                        if ($store) {
                            $store->status = 'active';
                            $store->save();
                        }
                        break;
                }

                $results[] = ['id' => $mId, 'name' => $user->name, 'status' => 'success'];
            }

            MasterAuditService::record(
                'bulk_' . $action,
                'bulk_operations',
                null,
                null,
                ['selected_count' => count($merchantIds)],
                ['results' => $results],
                $reason
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk operation executed successfully',
                'data' => [
                    'processed_count' => count($results),
                    'results' => $results,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Bulk action failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
