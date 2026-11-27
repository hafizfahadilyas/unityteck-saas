<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiMerchantLimit;
use App\Models\Store;
use App\Models\StoreGrowthAction;
use App\Models\StoreGrowthAdvisorSetting;
use App\Models\StoreGrowthRecommendation;
use App\Services\Growth\StoreDataCollectorService;
use App\Services\Growth\StoreGrowthAdvisorService;
use App\Services\Growth\StoreGrowthExecutorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Merchant Store Growth Advisor & Optimization API Controller.
 * Fully multi-tenant with strict store isolation via ResolvesStoreId.
 */
class StoreGrowthAdvisorController extends Controller
{
    use ResolvesStoreId;

    public function __construct(
        private readonly StoreDataCollectorService $dataCollector,
        private readonly StoreGrowthAdvisorService $advisor,
        private readonly StoreGrowthExecutorService $executor,
    ) {}

    /**
     * Dashboard Overview (Health Score, Credit Wallet, Mode & Summary Stats).
     */
    public function overview(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $snapshot = $this->dataCollector->collectStoreSnapshot($storeId);
        $settings = StoreGrowthAdvisorSetting::query()->firstOrCreate(
            ['store_id' => $storeId],
            [
                'id' => 'gas-' . Str::lower(Str::random(10)),
                'execution_mode' => 'merchant_approval',
                'auto_daily_audit' => true,
                'daily_credit_limit' => 100,
                'monthly_credit_limit' => 1000,
            ]
        );

        $limit = AiMerchantLimit::query()->where('store_id', $storeId)->first();
        $creditBalance = $limit ? (int) $limit->remaining_credits : 200;

        $pendingCount = StoreGrowthRecommendation::query()->forStore($storeId)->where('status', 'pending')->count();
        $completedCount = StoreGrowthRecommendation::query()->forStore($storeId)->where('status', 'completed')->count();
        $recentActions = StoreGrowthAction::query()->forStore($storeId)->latest()->limit(5)->get();

        return response()->json([
            'ok' => true,
            'health' => [
                'score' => $snapshot['health_score'] ?? 0,
                'grade' => $snapshot['health_grade'] ?? 'B',
                'breakdown' => $snapshot['health_breakdown'] ?? [],
            ],
            'wallet' => [
                'remaining_credits' => $creditBalance,
                'daily_limit' => (int) $settings->daily_credit_limit,
                'monthly_limit' => (int) $settings->monthly_credit_limit,
                'used_today' => (int) $settings->credits_used_today,
                'used_month' => (int) $settings->credits_used_month,
            ],
            'settings' => [
                'execution_mode' => $settings->execution_mode,
                'auto_daily_audit' => (bool) $settings->auto_daily_audit,
                'auto_apply_seo' => (bool) $settings->auto_apply_seo,
                'auto_apply_cart_recovery' => (bool) $settings->auto_apply_cart_recovery,
                'last_audited_at' => $settings->last_audited_at?->toIso8601String(),
            ],
            'stats' => [
                'pending_recommendations' => $pendingCount,
                'completed_recommendations' => $completedCount,
            ],
            'recent_actions' => $recentActions,
        ]);
    }

    /**
     * Trigger fresh live store analysis & AI recommendations sync.
     */
    public function analyze(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->find($storeId);
        if (!$store) {
            return response()->json(['message' => 'Store not found'], 404);
        }

        $result = $this->advisor->analyzeAndRecommend($store);

        return response()->json([
            'ok' => true,
            'message' => 'Live store analysis completed successfully.',
            'data' => $result,
        ]);
    }

    /**
     * List recommendations with optional status filter.
     */
    public function recommendations(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $query = StoreGrowthRecommendation::query()->forStore($storeId);

        if ($request->has('status') && !empty($request->query('status'))) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderByRaw("FIELD(status, 'pending', 'approved', 'completed', 'failed', 'skipped')")
            ->latest()
            ->get();

        return response()->json([
            'ok' => true,
            'data' => $list,
            'count' => $list->count(),
        ]);
    }

    /**
     * Inspect plan / diff for a recommendation before approving.
     */
    public function plan(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->findOrFail($storeId);
        $rec = StoreGrowthRecommendation::query()->forStore($storeId)->findOrFail($id);

        $plan = $this->executor->planAction($store, $rec);

        return response()->json([
            'ok' => true,
            'data' => $plan,
        ]);
    }

    /**
     * Execute an approved recommendation.
     */
    public function execute(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $store = Store::query()->findOrFail($storeId);
        $rec = StoreGrowthRecommendation::query()->forStore($storeId)->findOrFail($id);

        $setting = StoreGrowthAdvisorSetting::query()->where('store_id', $storeId)->first();
        $mode = $setting ? $setting->execution_mode : 'merchant_approval';

        $userId = $request->user()?->id;
        $result = $this->executor->executeApprovedAction($store, $rec, $userId, $mode);

        $status = ($result['ok'] ?? false) ? 200 : (($result['code'] ?? '') === 'insufficient_credits' ? 402 : 422);

        return response()->json($result, $status);
    }

    /**
     * Skip a recommendation.
     */
    public function skip(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $rec = StoreGrowthRecommendation::query()->forStore($storeId)->findOrFail($id);
        $rec->update(['status' => 'skipped']);

        return response()->json([
            'ok' => true,
            'message' => 'Recommendation dismissed.',
            'data' => $rec,
        ]);
    }

    /**
     * Rollback an executed action and restore previous database state.
     */
    public function rollback(Request $request, string $id): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $action = StoreGrowthAction::query()->forStore($storeId)->findOrFail($id);
        $userId = $request->user()?->id;

        $result = $this->executor->rollbackAction($action, $userId);
        $status = ($result['ok'] ?? false) ? 200 : 422;

        return response()->json($result, $status);
    }

    /**
     * Update Advisor Settings & Execution Mode.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $validated = $request->validate([
            'execution_mode' => ['sometimes', 'in:recommendation_only,merchant_approval,preapproved_automation'],
            'auto_daily_audit' => ['sometimes', 'boolean'],
            'auto_apply_seo' => ['sometimes', 'boolean'],
            'auto_apply_cart_recovery' => ['sometimes', 'boolean'],
            'daily_credit_limit' => ['sometimes', 'integer', 'min:10', 'max:5000'],
            'monthly_credit_limit' => ['sometimes', 'integer', 'min:50', 'max:50000'],
        ]);

        $setting = StoreGrowthAdvisorSetting::query()->firstOrCreate(
            ['store_id' => $storeId],
            ['id' => 'gas-' . Str::lower(Str::random(10))]
        );

        $setting->update($validated);

        return response()->json([
            'ok' => true,
            'message' => 'Advisor settings updated successfully.',
            'data' => $setting->fresh(),
        ]);
    }

    /**
     * Optimization Audit & Rollback History.
     */
    public function history(Request $request): JsonResponse
    {
        $storeId = $this->requireStoreId($request);
        if ($storeId instanceof JsonResponse) {
            return $storeId;
        }

        $history = StoreGrowthAction::query()->forStore($storeId)
            ->with('recommendation')
            ->latest()
            ->paginate(20);

        return response()->json([
            'ok' => true,
            'data' => $history,
        ]);
    }
}
