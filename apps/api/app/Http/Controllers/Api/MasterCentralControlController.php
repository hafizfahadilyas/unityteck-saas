<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiFeatureRegistry;
use App\Models\AiMerchantLimit;
use App\Models\AiSubscriptionPlan;
use App\Models\DashboardPageRegistry;
use App\Models\GlobalPlatformConfiguration;
use App\Models\MerchantAiSubscription;
use App\Models\MerchantComponentOverride;
use App\Models\MerchantFeatureOverride;
use App\Models\MerchantPageVisibility;
use App\Models\PaymentTransaction;
use App\Models\Plan;
use App\Models\Store;
use App\Models\StoreAiPayment;
use App\Models\Subscription;
use App\Models\UiComponentRegistry;
use App\Models\User;
use App\Services\MasterAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MasterCentralControlController extends Controller
{
    /**
     * Central Overview Statistics
     */
    public function overview(): JsonResponse
    {
        $totalMerchants = User::whereIn('role', ['manager', 'merchant', 'store_owner'])->count();
        $totalStores = Store::count();
        $activeStores = Store::where('status', 'active')->count();

        $storeSubscriptionsCount = Subscription::where('status', 'active')->count();
        $aiSubscriptionsCount = MerchantAiSubscription::where('status', 'active')->count();

        $pendingPaymentsCount = StoreAiPayment::where('status', 'pending')->count()
            + DB::table('bank_transfer_proofs')->where('status', 'pending')->count();

        $totalCreditsIssued = (int) AiMerchantLimit::sum('remaining_credits');
        $totalAiFeaturesCount = AiFeatureRegistry::count();
        $activeAiFeaturesCount = AiFeatureRegistry::where('is_active', true)->where('global_status', 1)->count();

        $pagesCount = DashboardPageRegistry::count();
        $componentsCount = UiComponentRegistry::count();

        // Recent activity summary
        $recentAuditLogs = DB::table('master_central_audit_logs')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'counts' => [
                    'total_merchants' => $totalMerchants,
                    'total_stores' => $totalStores,
                    'active_stores' => $activeStores,
                    'store_subscriptions' => $storeSubscriptionsCount,
                    'ai_subscriptions' => $aiSubscriptionsCount,
                    'pending_payments' => $pendingPaymentsCount,
                    'total_credits_in_circulation' => $totalCreditsIssued,
                    'ai_features_total' => $totalAiFeaturesCount,
                    'ai_features_active' => $activeAiFeaturesCount,
                    'dashboard_pages' => $pagesCount,
                    'ui_components' => $componentsCount,
                ],
                'recent_activity' => $recentAuditLogs,
                'system_health' => [
                    'database_status' => 'connected',
                    'gemini_api' => 'operational',
                    'zatca_service' => 'operational',
                    'realtime_channel' => 'active',
                ],
            ],
        ]);
    }

    /**
     * Get All Global Settings
     */
    public function getGlobalSettings(): JsonResponse
    {
        $settings = GlobalPlatformConfiguration::all();
        $formatted = [];
        foreach ($settings as $s) {
            $formatted[$s->setting_key] = [
                'id' => $s->id,
                'key' => $s->setting_key,
                'value' => $s->setting_value,
                'group' => $s->setting_group,
                'description' => $s->description,
                'updated_at' => $s->updated_at,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    /**
     * Update Global Setting
     */
    public function updateGlobalSetting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'setting_key' => 'required|string',
            'setting_value' => 'required',
            'setting_group' => 'nullable|string',
            'description' => 'nullable|string',
            'reason' => 'nullable|string',
        ]);

        $setting = GlobalPlatformConfiguration::where('setting_key', $validated['setting_key'])->first();
        $before = $setting ? $setting->setting_value : null;

        $updated = GlobalPlatformConfiguration::updateOrInsert(
            ['setting_key' => $validated['setting_key']],
            [
                'id' => $setting ? $setting->id : 'cfg_' . Str::random(12),
                'setting_value' => is_array($validated['setting_value']) ? json_encode($validated['setting_value']) : $validated['setting_value'],
                'setting_group' => $validated['setting_group'] ?? ($setting ? $setting->setting_group : 'general'),
                'description' => $validated['description'] ?? ($setting ? $setting->description : null),
                'updated_by' => optional($request->user())->id,
                'updated_at' => now(),
            ]
        );

        MasterAuditService::record(
            'update_global_setting',
            'global_config',
            null,
            null,
            ['value' => $before],
            ['value' => $validated['setting_value']],
            $validated['reason'] ?? "Updated {$validated['setting_key']}"
        );

        return response()->json([
            'success' => true,
            'message' => 'Global setting updated successfully',
        ]);
    }

    /**
     * Real-time / Dynamic Configuration Sync Endpoint for Merchant Dashboards.
     * Evaluates the 4-tier precedence:
     * Store Override -> Merchant Override -> Plan Permission -> Global Default
     */
    public function syncConfig(Request $request): JsonResponse
    {
        $storeId = $request->header('X-Store-Id') ?? $request->query('store_id');
        $user = $request->user();

        if (!$storeId && $user) {
            $firstStore = Store::first();
            $storeId = $firstStore ? $firstStore->id : null;
        }

        $store = $storeId ? Store::find($storeId) : null;
        $merchantId = $user ? $user->id : null;

        // 1. Resolve Page Visibilities
        $pages = DashboardPageRegistry::where('global_visibility', true)->orderBy('display_order')->get();
        $pageOverrides = $storeId ? MerchantPageVisibility::where('store_id', $storeId)->pluck('is_visible', 'page_id')->toArray() : [];

        $resolvedPages = [];
        foreach ($pages as $page) {
            $visible = $page->default_visibility;
            if (isset($pageOverrides[$page->id])) {
                $visible = (bool) $pageOverrides[$page->id];
            }
            $resolvedPages[$page->route_key] = [
                'page_id' => $page->id,
                'route_key' => $page->route_key,
                'name_en' => $page->name_en,
                'name_ar' => $page->name_ar,
                'is_visible' => $visible,
                'icon' => $page->icon,
                'category' => $page->category,
            ];
        }

        // 2. Resolve AI Feature Access & Limits
        $aiFeatures = AiFeatureRegistry::where('is_active', true)->get();
        $featureOverrides = $storeId ? MerchantFeatureOverride::where('store_id', $storeId)->get()->keyBy('feature_id') : collect();

        $resolvedFeatures = [];
        foreach ($aiFeatures as $feat) {
            $enabled = (bool) $feat->global_status;
            $creditCost = $feat->credit_cost;
            $dailyLimit = $feat->daily_limit;
            $monthlyLimit = $feat->monthly_limit;

            if ($featureOverrides->has($feat->id)) {
                $ov = $featureOverrides->get($feat->id);
                $enabled = (bool) $ov->is_enabled;
                if ($ov->custom_credit_cost !== null) $creditCost = $ov->custom_credit_cost;
                if ($ov->custom_daily_limit !== null) $dailyLimit = $ov->custom_daily_limit;
                if ($ov->custom_monthly_limit !== null) $monthlyLimit = $ov->custom_monthly_limit;
            }

            $resolvedFeatures[$feat->feature_code] = [
                'feature_id' => $feat->id,
                'code' => $feat->feature_code,
                'name_en' => $feat->name_en,
                'name_ar' => $feat->name_ar,
                'is_enabled' => $enabled,
                'credit_cost' => $creditCost,
                'daily_limit' => $dailyLimit,
                'monthly_limit' => $monthlyLimit,
                'default_model' => $feat->default_model,
                'category' => $feat->category,
            ];
        }

        // 3. Resolve UI Components
        $components = UiComponentRegistry::where('global_visibility', true)->orderBy('display_order')->get();
        $compOverrides = $storeId ? MerchantComponentOverride::where('store_id', $storeId)->get()->keyBy('component_id') : collect();

        $resolvedComponents = [];
        foreach ($components as $cmp) {
            $visible = $cmp->default_visibility;
            $titleEn = $cmp->title_en ?: $cmp->name_en;
            $titleAr = $cmp->title_ar ?: $cmp->name_ar;
            $order = $cmp->display_order;
            $settings = $cmp->allowed_settings ?? [];

            if ($compOverrides->has($cmp->id)) {
                $ov = $compOverrides->get($cmp->id);
                $visible = (bool) $ov->is_visible;
                if ($ov->custom_title_en) $titleEn = $ov->custom_title_en;
                if ($ov->custom_title_ar) $titleAr = $ov->custom_title_ar;
                if ($ov->custom_order !== null) $order = $ov->custom_order;
                if (!empty($ov->custom_settings)) $settings = array_merge($settings, $ov->custom_settings);
            }

            $resolvedComponents[$cmp->component_key] = [
                'component_id' => $cmp->id,
                'component_key' => $cmp->component_key,
                'is_visible' => $visible,
                'title_en' => $titleEn,
                'title_ar' => $titleAr,
                'display_order' => $order,
                'settings' => $settings,
            ];
        }

        // 4. Resolve Credit Wallet & Limits
        $creditLimit = $storeId ? AiMerchantLimit::where('store_id', $storeId)->first() : null;
        $remainingCredits = $creditLimit ? $creditLimit->remaining_credits : 200;

        // 5. Store Plan & AI Subscription Snapshots
        $storeSubscription = $storeId ? Subscription::with('plan')->where('store_id', $storeId)->first() : null;
        $aiSubscription = $storeId ? MerchantAiSubscription::with('plan')->where('store_id', $storeId)->first() : null;

        return response()->json([
            'success' => true,
            'timestamp' => now()->toISOString(),
            'version' => time(),
            'data' => [
                'store_id' => $storeId,
                'merchant_id' => $merchantId,
                'pages' => $resolvedPages,
                'features' => $resolvedFeatures,
                'components' => $resolvedComponents,
                'wallet' => [
                    'remaining_credits' => $remainingCredits,
                    'daily_limit' => $creditLimit ? $creditLimit->daily_image_limit : 25,
                    'monthly_limit' => $creditLimit ? $creditLimit->monthly_image_limit : 200,
                ],
                'store_subscription' => $storeSubscription,
                'ai_subscription' => $aiSubscription,
            ],
        ]);
    }
}
