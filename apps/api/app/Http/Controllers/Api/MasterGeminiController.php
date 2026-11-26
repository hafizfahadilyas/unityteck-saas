<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiGenerationHistory;
use App\Models\AiMerchantLimit;
use App\Models\AiModel;
use App\Models\AiUsageLog;
use App\Models\Store;
use App\Services\Gemini\GeminiSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class MasterGeminiController extends Controller
{
    public function __construct(
        private readonly GeminiSettingsService $settingsService,
    ) {}

    private function assertMaster(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (! $user || ($user->role ?? '') !== 'super_admin') {
            return response()->json(['message' => 'Super Admin access required.'], 403);
        }

        return null;
    }

    /**
     * TAB 1 & Overview: Full Gemini settings & state.
     */
    public function settings(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $provider = $this->settingsService->getOrCreateProvider();
        $config = $this->settingsService->getOrCreateConfig();
        $apiKeyInfo = $this->settingsService->getMaskedApiKey();
        $this->settingsService->syncOfficialModels();

        return response()->json([
            'provider' => [
                'id' => $provider->id,
                'slug' => $provider->slug,
                'name' => $provider->name,
                'display_name_ar' => $provider->display_name_ar,
                'display_name_en' => $provider->display_name_en,
                'status' => $provider->status,
                'is_default' => (bool) $provider->is_default,
                'api_endpoint' => $provider->api_endpoint,
                'connection_status' => $provider->connection_status,
                'last_connection_test_at' => $provider->last_connection_test_at?->toIso8601String(),
                'last_connection_error' => $provider->last_connection_error,
            ],
            'api_key' => $apiKeyInfo,
            'config' => $config,
        ]);
    }

    /**
     * TAB 1 & 4 & 9: Save settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', 'in:active,disabled,maintenance'],
            'provider_name' => ['sometimes', 'string', 'max:80'],
            'api_endpoint' => ['sometimes', 'string', 'max:255'],
            'default_model' => ['sometimes', 'string', 'max:80'],
            'default_text_model' => ['sometimes', 'string', 'max:80'],
            'default_image_model' => ['sometimes', 'string', 'max:80'],
            'default_language' => ['sometimes', 'string', 'in:ar,en,auto'],
            'default_image_quality' => ['sometimes', 'string', 'in:standard,balanced,pro'],
            'default_aspect_ratio' => ['sometimes', 'string', 'max:16'],
            'max_image_resolution' => ['sometimes', 'string', 'in:1K,2K,4K'],
            'default_generation_mode' => ['sometimes', 'string', 'max:32'],
            // Features
            'feature_text_to_image' => ['sometimes', 'boolean'],
            'feature_image_to_image' => ['sometimes', 'boolean'],
            'feature_product_photography' => ['sometimes', 'boolean'],
            'feature_background_replacement' => ['sometimes', 'boolean'],
            'feature_lifestyle_scenes' => ['sometimes', 'boolean'],
            'feature_promotional_banners' => ['sometimes', 'boolean'],
            'feature_social_creatives' => ['sometimes', 'boolean'],
            'feature_product_variations' => ['sometimes', 'boolean'],
            'allowed_aspect_ratios' => ['sometimes', 'array'],
            'output_format' => ['sometimes', 'string', 'in:webp,png,jpeg'],
            'storage_location' => ['sometimes', 'string', 'max:32'],
            'compression_quality' => ['sometimes', 'integer', 'between:1,100'],
            'max_upload_size_mb' => ['sometimes', 'integer', 'between:1,50'],
            // Merchant Quotas
            'all_merchants_enabled' => ['sometimes', 'boolean'],
            'default_daily_image_limit' => ['sometimes', 'integer', 'min:1'],
            'default_monthly_image_limit' => ['sometimes', 'integer', 'min:1'],
            'default_daily_credit_allowance' => ['sometimes', 'integer', 'min:1'],
            'default_monthly_credit_allowance' => ['sometimes', 'integer', 'min:1'],
            'max_images_per_request' => ['sometimes', 'integer', 'between:1,4'],
            'monthly_spending_limit_usd' => ['sometimes', 'numeric', 'min:0'],
            // Advanced
            'api_timeout_seconds' => ['sometimes', 'integer', 'between:5,180'],
            'retry_enabled' => ['sometimes', 'boolean'],
            'max_retries' => ['sometimes', 'integer', 'between:0,5'],
            'request_concurrency_limit' => ['sometimes', 'integer', 'between:1,20'],
            'rate_limit_per_minute' => ['sometimes', 'integer', 'between:1,500'],
            'provider_fallback_enabled' => ['sometimes', 'boolean'],
            'fallback_model' => ['sometimes', 'string', 'max:80'],
            'failure_alerts_enabled' => ['sometimes', 'boolean'],
            'global_maintenance_mode' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $provider = $this->settingsService->getOrCreateProvider();
        if (isset($validated['status'])) {
            $provider->status = $validated['status'];
        }
        if (isset($validated['provider_name'])) {
            $provider->name = $validated['provider_name'];
        }
        if (isset($validated['api_endpoint'])) {
            $provider->api_endpoint = $validated['api_endpoint'];
        }
        $provider->save();

        $config = $this->settingsService->getOrCreateConfig();
        $config->fill($validated);
        $config->save();

        return response()->json([
            'ok' => true,
            'message' => 'Gemini settings saved successfully.',
            'config' => $config,
            'provider' => $provider,
        ]);
    }

    /**
     * TAB 2: Live Connection test against official Google Gemini API.
     */
    public function testConnection(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $result = $this->settingsService->testConnection();

        return response()->json($result);
    }

    /**
     * TAB 2: Update API Key securely on backend.
     */
    public function updateApiKey(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'api_key' => ['required', 'string', 'min:15', 'max:100'],
        ]);

        $key = trim($validated['api_key']);
        $envPath = base_path('.env');

        if (File::exists($envPath)) {
            $content = File::get($envPath);
            if (preg_match('/^GEMINI_API_KEY=/m', $content)) {
                $content = preg_replace('/^GEMINI_API_KEY=.*/m', "GEMINI_API_KEY={$key}", $content);
            } else {
                $content .= "\nGEMINI_API_KEY={$key}\n";
            }
            File::put($envPath, $content);
        }

        config(['services.gemini.api_key' => $key]);

        // Auto test connection with newly updated key
        $test = $this->settingsService->testConnection();

        return response()->json([
            'ok' => true,
            'message' => 'API Key updated successfully on Laravel backend.',
            'api_key' => $this->settingsService->getMaskedApiKey(),
            'connection_test' => $test,
        ]);
    }

    /**
     * TAB 3: Models List.
     */
    public function models(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $this->settingsService->syncOfficialModels();
        $models = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->orderBy('priority')
            ->get();

        return response()->json([
            'models' => $models,
            'count' => $models->count(),
        ]);
    }

    /**
     * TAB 3: Refresh models from official API catalog.
     */
    public function refreshModels(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $this->settingsService->syncOfficialModels();
        $models = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->orderBy('priority')
            ->get();

        return response()->json([
            'ok' => true,
            'message' => 'Official Gemini models refreshed.',
            'models' => $models,
        ]);
    }

    /**
     * TAB 3: Update model configuration (enable/disable, default, priority, pricing).
     */
    public function updateModel(Request $request, string $id): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $model = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('model_id', $id);
            })
            ->first();

        if (! $model) {
            return response()->json(['message' => 'Model not found.'], 404);
        }

        $validated = $request->validate([
            'is_enabled' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'boolean'],
            'priority' => ['sometimes', 'integer', 'between:1,100'],
            'image_generation_price_usd' => ['sometimes', 'numeric', 'min:0'],
            'input_token_price_per_1m_usd' => ['sometimes', 'numeric', 'min:0'],
            'output_token_price_per_1m_usd' => ['sometimes', 'numeric', 'min:0'],
        ]);

        if (! empty($validated['is_default'])) {
            // Unset other defaults for same modality
            AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)
                ->where('supports_image_generation', $model->supports_image_generation)
                ->where('id', '!=', $model->id)
                ->update(['is_default' => false]);
            $validated['is_enabled'] = true;
        }

        $model->fill($validated);
        $model->save();

        return response()->json([
            'ok' => true,
            'message' => "Model {$model->model_id} updated.",
            'model' => $model,
        ]);
    }

    /**
     * TAB 5: Merchant Limits & Credits list.
     */
    public function merchantLimits(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $stores = Store::orderBy('name')->get();
        $data = [];
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        foreach ($stores as $store) {
            $limit = $this->settingsService->getOrCreateMerchantLimit($store);

            $dailyUsed = AiGenerationHistory::where('store_id', $store->id)
                ->where('created_at', '>=', $todayStart)
                ->where('status', 'success')
                ->count();

            $monthlyUsed = AiGenerationHistory::where('store_id', $store->id)
                ->where('created_at', '>=', $monthStart)
                ->where('status', 'success')
                ->count();

            $data[] = [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'plan_code' => $limit->plan_code,
                'ai_enabled' => (bool) $limit->ai_enabled,
                'is_paused' => (bool) $limit->is_paused,
                'pause_reason' => $limit->pause_reason,
                'daily_image_limit' => (int) $limit->daily_image_limit,
                'daily_used' => $dailyUsed,
                'monthly_image_limit' => (int) $limit->monthly_image_limit,
                'monthly_used' => $monthlyUsed,
                'daily_credits_allowance' => (int) $limit->daily_credits_allowance,
                'monthly_credits_allowance' => (int) $limit->monthly_credits_allowance,
                'remaining_credits' => (int) $limit->remaining_credits,
                'max_images_per_request' => (int) $limit->max_images_per_request,
            ];
        }

        return response()->json([
            'merchants' => $data,
            'count' => count($data),
        ]);
    }

    /**
     * TAB 5: Update specific merchant limit or toggle pause.
     */
    public function updateMerchantLimits(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'store_id' => ['required', 'string', 'exists:stores,id'],
            'ai_enabled' => ['sometimes', 'boolean'],
            'is_paused' => ['sometimes', 'boolean'],
            'pause_reason' => ['sometimes', 'nullable', 'string', 'max:255'],
            'daily_image_limit' => ['sometimes', 'integer', 'min:1'],
            'monthly_image_limit' => ['sometimes', 'integer', 'min:1'],
            'max_images_per_request' => ['sometimes', 'integer', 'between:1,4'],
        ]);

        $store = Store::findOrFail($validated['store_id']);
        $limit = $this->settingsService->getOrCreateMerchantLimit($store);
        $limit->fill($validated);
        $limit->save();

        return response()->json([
            'ok' => true,
            'message' => "AI limits updated for {$store->name}.",
            'limit' => $limit,
        ]);
    }

    /**
     * TAB 5: Adjust merchant credits manually.
     */
    public function adjustMerchantCredits(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $validated = $request->validate([
            'store_id' => ['required', 'string', 'exists:stores,id'],
            'amount' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $store = Store::findOrFail($validated['store_id']);
        $limit = $this->settingsService->adjustMerchantCredits(
            $store,
            (int) $validated['amount'],
            $validated['reason'],
            $request->user()?->id
        );

        return response()->json([
            'ok' => true,
            'message' => "Credits updated. New balance: {$limit->remaining_credits}.",
            'limit' => $limit,
        ]);
    }

    /**
     * TAB 6: Pricing & Cost Management.
     */
    public function pricing(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $models = AiModel::where('provider_id', GeminiSettingsService::PROVIDER_ID)->get();
        $config = $this->settingsService->getOrCreateConfig();

        // Calculate actual spend this month
        $spendThisMonth = (float) AiUsageLog::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('cost_usd');

        return response()->json([
            'currency' => 'USD',
            'models' => $models,
            'monthly_spending_limit_usd' => (float) $config->monthly_spending_limit_usd,
            'actual_spending_this_month_usd' => round($spendThisMonth, 4),
            'spending_percentage' => $config->monthly_spending_limit_usd > 0
                ? round(($spendThisMonth / $config->monthly_spending_limit_usd) * 100, 1)
                : 0,
        ]);
    }

    /**
     * TAB 7: Real Analytics & Charts.
     */
    public function analytics(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $filters = [
            'period' => $request->query('period', '30d'),
            'store_id' => $request->query('store_id'),
            'model_id' => $request->query('model_id'),
            'start_date' => $request->query('start_date'),
            'end_date' => $request->query('end_date'),
        ];

        $analytics = $this->settingsService->getAnalytics($filters);

        return response()->json($analytics);
    }

    /**
     * TAB 8: API Logs & Errors.
     */
    public function logs(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $limit = min(100, max(10, (int) $request->query('limit', 25)));
        $query = AiUsageLog::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->orderByDesc('created_at');

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', $storeId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $logs = $query->paginate($limit);

        // Map store names
        $storeIds = collect($logs->items())->pluck('store_id')->filter()->unique();
        $storeNames = Store::whereIn('id', $storeIds)->pluck('name', 'id');

        $items = collect($logs->items())->map(function ($log) use ($storeNames) {
            return [
                'id' => $log->id,
                'request_id' => $log->request_id,
                'store_id' => $log->store_id,
                'store_name' => $storeNames[$log->store_id] ?? 'Master System',
                'merchant_id' => $log->merchant_id,
                'model_id' => $log->model_id,
                'endpoint' => $log->endpoint,
                'input_tokens' => $log->input_tokens,
                'output_tokens' => $log->output_tokens,
                'cost_usd' => (float) $log->cost_usd,
                'response_time_ms' => $log->response_time_ms,
                'http_status' => $log->http_status,
                'status' => $log->status,
                'error_code' => $log->error_code,
                'error_message' => $log->error_message,
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $items,
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'total' => $logs->total(),
        ]);
    }

    /**
     * Generation History across stores for Master.
     */
    public function history(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $limit = min(100, max(10, (int) $request->query('limit', 25)));
        $query = AiGenerationHistory::where('provider_id', GeminiSettingsService::PROVIDER_ID)
            ->orderByDesc('created_at');

        if ($storeId = $request->query('store_id')) {
            $query->where('store_id', $storeId);
        }

        $history = $query->paginate($limit);

        $storeIds = collect($history->items())->pluck('store_id')->filter()->unique();
        $storeNames = Store::whereIn('id', $storeIds)->pluck('name', 'id');

        $items = collect($history->items())->map(function ($h) use ($storeNames) {
            return [
                'id' => $h->id,
                'store_id' => $h->store_id,
                'store_name' => $storeNames[$h->store_id] ?? 'Unknown Store',
                'model_id' => $h->model_id,
                'action_type' => $h->action_type,
                'prompt' => $h->prompt,
                'aspect_ratio' => $h->aspect_ratio,
                'image_size' => $h->image_size,
                'image_url' => $h->image_url,
                'status' => $h->status,
                'execution_time_ms' => $h->execution_time_ms,
                'error_message' => $h->error_message,
                'created_at' => $h->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $items,
            'current_page' => $history->currentPage(),
            'last_page' => $history->lastPage(),
            'total' => $history->total(),
        ]);
    }
}
