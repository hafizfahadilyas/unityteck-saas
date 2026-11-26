<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreOpenAiAuditLog;
use App\Models\StoreOpenAiConfigHistory;
use App\Models\StoreOpenAiUsageLog;
use App\Services\OpenAi\OpenAiAutomationService;
use App\Services\OpenAi\OpenAiConfigService;
use App\Services\OpenAi\OpenAiCostService;
use App\Services\OpenAi\OpenAiImageService;
use App\Services\OpenAi\OpenAiProviderService;
use App\Services\OpenAi\OpenAiUsageService;
use App\Support\OpenAiLevels;
use App\Support\Plans;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Master-only OpenAI AI Management (Text + Image + Automation). Isolated from Gemini.
 * Org model: Master owns limits/payment per store; each store is an isolated workspace.
 */
class MasterOpenAiController extends Controller
{
    public function __construct(
        private readonly OpenAiConfigService $configs,
        private readonly OpenAiUsageService $usage,
        private readonly OpenAiCostService $costs,
        private readonly OpenAiProviderService $provider,
        private readonly OpenAiImageService $images,
        private readonly OpenAiAutomationService $automation,
    ) {}

    private function assertMaster(Request $request): ?JsonResponse
    {
        $user = $request->user();
        if (! $user || ($user->role ?? '') !== 'super_admin') {
            return response()->json(['message' => 'Master SuperAdmin only.'], 403);
        }

        return null;
    }

    public function overview(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $global = $this->configs->global();
        $key = $this->configs->apiKeyStatus();

        return response()->json([
            'global' => [
                'enabled' => (bool) $global->enabled,
                'emergency_disabled' => (bool) $global->emergency_disabled,
                'default_text_model' => $global->default_text_model,
                'prompt_caching_enabled' => (bool) $global->prompt_caching_enabled,
            ],
            'api_key' => $key,
            'overview' => $this->usage->overview(),
            'levels' => OpenAiLevels::catalog(),
            'pricing' => $this->costs->listPricing(),
        ]);
    }

    public function updateGlobal(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'emergency_disabled' => ['sometimes', 'boolean'],
            'default_text_model' => ['sometimes', 'string', 'max:80'],
            'prompt_caching_enabled' => ['sometimes', 'boolean'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $global = $this->configs->global();
        $global->fill($data);
        $global->save();

        $this->configs->audit(null, $request->user()?->id, 'global_updated', 'security', 'OpenAI global config updated', [
            'enabled' => $global->enabled,
            'emergency_disabled' => $global->emergency_disabled,
        ]);

        return response()->json(['ok' => true, 'global' => $global->only([
            'enabled', 'emergency_disabled', 'default_text_model', 'prompt_caching_enabled',
        ])]);
    }

    public function stores(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $stores = Store::query()->orderBy('name')->get();
        $rows = [];
        foreach ($stores as $store) {
            $cfg = $this->configs->forStore($store);
            $snap = $this->usage->snapshot($store, $cfg);
            $rows[] = [
                'store_id' => $store->id,
                'store_name' => $store->name,
                'plan' => Plans::effectiveCode($store),
                'pro_eligible' => $this->configs->storeIsProEligible($store),
                'enabled' => (bool) $cfg->enabled,
                'intelligence_level' => $cfg->intelligence_level,
                'model' => $cfg->text_model ?: $this->configs->global()->default_text_model,
                'daily_usage' => $snap['day'],
                'monthly_usage' => $snap['month'],
                'monthly_budget_usd' => (float) $cfg->monthly_budget_usd,
                'actual_cost_usd' => (float) $snap['month']['cost_usd'],
                'payment_status' => $cfg->payment_status,
                'usage_unlocked' => (bool) $cfg->usage_unlocked,
                'config_status' => $cfg->config_status,
            ];
        }

        return response()->json(['data' => $rows, 'count' => count($rows)]);
    }

    public function showStore(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $cfg = $this->configs->forStore($store);
        $snap = $this->usage->snapshot($store, $cfg);
        $history = StoreOpenAiConfigHistory::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();
        $logs = StoreOpenAiUsageLog::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();
        $audits = StoreOpenAiAuditLog::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json([
            'config' => $this->configs->serializeStoreConfig($store, $cfg),
            'usage' => $snap,
            'config_history' => $history,
            'usage_logs' => $logs,
            'security_events' => $audits,
            'api_key' => $this->configs->apiKeyStatus(),
        ]);
    }

    public function updateStore(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'intelligence_level' => ['sometimes', 'in:low,medium,high'],
            'text_model' => ['sometimes', 'nullable', 'string', 'max:80'],
            'reasoning_effort' => ['sometimes', 'nullable', 'in:low,medium,high'],
            'prompt_caching_enabled' => ['sometimes', 'nullable', 'boolean'],
            'daily_token_limit' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            'monthly_token_limit' => ['sometimes', 'integer', 'min:0', 'max:1000000000'],
            'max_input_tokens' => ['sometimes', 'integer', 'min:1', 'max:200000'],
            'max_output_tokens' => ['sometimes', 'integer', 'min:1', 'max:100000'],
            'daily_request_limit' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'monthly_request_limit' => ['sometimes', 'integer', 'min:0', 'max:10000000'],
            'daily_budget_usd' => ['sometimes', 'numeric', 'min:0'],
            'monthly_budget_usd' => ['sometimes', 'numeric', 'min:0'],
            'max_cost_per_request_usd' => ['sometimes', 'numeric', 'min:0'],
            'warning_threshold_pct' => ['sometimes', 'integer', 'in:50,80,90'],
            'auto_stop_at_budget' => ['sometimes', 'boolean'],
            'allow_admin_override' => ['sometimes', 'boolean'],
            'payment_required_for_usage' => ['sometimes', 'boolean'],
            'usage_unlocked' => ['sometimes', 'boolean'],
            'payment_status' => ['sometimes', 'in:unpaid,paid,comped,overdue'],
            'usage_unlocked_until' => ['sometimes', 'nullable', 'date'],
            'rate_limit_per_minute' => ['sometimes', 'integer', 'min:1', 'max:600'],
            'config_status' => ['sometimes', 'in:draft,active,paused,emergency'],
            'audit_logging_enabled' => ['sometimes', 'boolean'],
        ]);

        if (! empty($data['enabled']) && ! $this->configs->storeIsProEligible($store)) {
            return response()->json([
                'message' => 'Only Pro (or higher) stores can enable OpenAI usage. Configure is allowed; enable requires Pro.',
                'code' => 'pro_required',
                'payment_required' => true,
            ], 422);
        }

        $cfg = $this->configs->updateStoreConfig($store, $data, $request->user()?->id);

        return response()->json([
            'ok' => true,
            'config' => $this->configs->serializeStoreConfig($store, $cfg),
        ]);
    }

    public function resetStore(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $cfg = $this->configs->resetStoreDefaults($store, $request->user()?->id);

        return response()->json([
            'ok' => true,
            'config' => $this->configs->serializeStoreConfig($store, $cfg),
        ]);
    }

    public function unlockPayment(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $data = $request->validate([
            'method' => ['required', 'in:mark_paid,comp,services_points'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:366'],
        ]);

        if (! $this->configs->storeIsProEligible($store)) {
            return response()->json([
                'message' => 'Upgrade store to Pro before unlocking OpenAI usage.',
                'code' => 'pro_required',
                'payment_required' => true,
            ], 422);
        }

        $days = (int) ($data['days'] ?? 30);
        $status = match ($data['method']) {
            'comp' => 'comped',
            'services_points' => 'paid',
            default => 'paid',
        };

        $cfg = $this->configs->updateStoreConfig($store, [
            'usage_unlocked' => true,
            'payment_status' => $status,
            'usage_unlocked_until' => now()->addDays($days)->toDateTimeString(),
            'config_status' => 'active',
        ], $request->user()?->id);

        $this->configs->audit($store->id, $request->user()?->id, 'payment_unlock', 'security', 'OpenAI usage unlocked', [
            'method' => $data['method'],
            'days' => $days,
        ]);

        return response()->json([
            'ok' => true,
            'config' => $this->configs->serializeStoreConfig($store, $cfg),
        ]);
    }

    public function complete(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }

        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:20000'],
            'system' => ['sometimes', 'nullable', 'string', 'max:8000'],
        ]);

        // Never accept alternate store_id from body — path + Master auth only.
        $cfg = $this->configs->forStore($store);
        $result = $this->provider->complete($store, $cfg, $data, $request->user()?->id);

        if (! ($result['ok'] ?? false)) {
            $status = ($result['payment_required'] ?? false) ? 402 : 422;

            return response()->json($result, $status);
        }

        return response()->json($result);
    }

    public function updatePricing(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'model' => ['required', 'string', 'max:80'],
            'modality' => ['required', 'in:text,image'],
            'input_per_1m_usd' => ['required', 'numeric', 'min:0'],
            'output_per_1m_usd' => ['required', 'numeric', 'min:0'],
            'cached_input_per_1m_usd' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'image_per_unit_usd' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $this->costs->ensureDefaultPricing();
        $row = \App\Models\OpenAiModelPricing::query()
            ->where('model', $data['model'])
            ->where('modality', $data['modality'])
            ->first();

        if (! $row) {
            $row = \App\Models\OpenAiModelPricing::query()->create([
                'id' => 'oap-'.\Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(12)),
                'model' => $data['model'],
                'modality' => $data['modality'],
                'input_per_1m_usd' => $data['input_per_1m_usd'],
                'output_per_1m_usd' => $data['output_per_1m_usd'],
                'cached_input_per_1m_usd' => $data['cached_input_per_1m_usd'] ?? null,
                'image_per_unit_usd' => $data['image_per_unit_usd'] ?? null,
                'active' => $data['active'] ?? true,
            ]);
        } else {
            $row->fill($data);
            $row->save();
        }

        return response()->json(['ok' => true, 'pricing' => $this->costs->listPricing()]);
    }

    public function imageShow(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $cfg = $this->images->forStore($store);

        return response()->json([
            'config' => $this->images->serialize($store, $cfg),
            'api_key' => $this->configs->apiKeyStatus(),
            'events' => \App\Models\StoreOpenAiImageEvent::query()
                ->where('store_id', $store->id)
                ->orderByDesc('created_at')
                ->limit(40)
                ->get(),
        ]);
    }

    public function imageUpdate(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'default_model' => ['sometimes', 'string', 'max:80'],
            'default_quality' => ['sometimes', 'in:low,medium,high'],
            'monthly_image_quota' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'monthly_budget_usd' => ['sometimes', 'numeric', 'min:0'],
            'max_cost_per_image_usd' => ['sometimes', 'numeric', 'min:0'],
            'warning_threshold_pct' => ['sometimes', 'integer', 'in:50,80,90'],
            'auto_stop_at_quota' => ['sometimes', 'boolean'],
            'payment_required_for_usage' => ['sometimes', 'boolean'],
            'usage_unlocked' => ['sometimes', 'boolean'],
            'payment_status' => ['sometimes', 'in:unpaid,paid,comped,overdue'],
            'usage_unlocked_until' => ['sometimes', 'nullable', 'date'],
            'config_status' => ['sometimes', 'in:draft,active,paused,emergency'],
        ]);
        if (! empty($data['enabled']) && ! $this->configs->storeIsProEligible($store)) {
            return response()->json([
                'message' => 'Only Pro stores can enable OpenAI Image.',
                'code' => 'pro_required',
                'payment_required' => true,
            ], 422);
        }
        $cfg = $this->images->update($store, $data, $request->user()?->id);

        return response()->json(['ok' => true, 'config' => $this->images->serialize($store, $cfg)]);
    }

    public function imageUnlock(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate([
            'method' => ['required', 'in:mark_paid,comp,services_points'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:366'],
        ]);
        if (! $this->configs->storeIsProEligible($store)) {
            return response()->json(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true], 422);
        }
        $status = $data['method'] === 'comp' ? 'comped' : 'paid';
        $cfg = $this->images->update($store, [
            'usage_unlocked' => true,
            'payment_status' => $status,
            'usage_unlocked_until' => now()->addDays((int) ($data['days'] ?? 30))->toDateTimeString(),
            'config_status' => 'active',
        ], $request->user()?->id);

        return response()->json(['ok' => true, 'config' => $this->images->serialize($store, $cfg)]);
    }

    public function imageGenerate(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate(['prompt' => ['required', 'string', 'max:32000']]);
        $result = $this->images->generate($store, $data['prompt'], $request->user()?->id);
        if (! ($result['ok'] ?? false)) {
            return response()->json($result, ($result['payment_required'] ?? false) ? 402 : 422);
        }

        return response()->json($result);
    }

    public function automationShow(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $cfg = $this->automation->forStore($store);

        return response()->json([
            'config' => $this->automation->serialize($store, $cfg),
            'api_key' => $this->configs->apiKeyStatus(),
        ]);
    }

    public function automationUpdate(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'intelligence_level' => ['sometimes', 'in:low,medium,high'],
            'text_model' => ['sometimes', 'nullable', 'string', 'max:80'],
            'monthly_question_quota' => ['sometimes', 'integer', 'min:0', 'max:1000000'],
            'daily_question_quota' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'max_output_tokens' => ['sometimes', 'integer', 'min:64', 'max:16000'],
            'payment_required_for_usage' => ['sometimes', 'boolean'],
            'usage_unlocked' => ['sometimes', 'boolean'],
            'payment_status' => ['sometimes', 'in:unpaid,paid,comped,overdue'],
            'usage_unlocked_until' => ['sometimes', 'nullable', 'date'],
            'config_status' => ['sometimes', 'in:draft,active,paused,emergency'],
        ]);
        if (! empty($data['enabled']) && ! $this->configs->storeIsProEligible($store)) {
            return response()->json(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true], 422);
        }
        $cfg = $this->automation->update($store, $data, $request->user()?->id);

        return response()->json(['ok' => true, 'config' => $this->automation->serialize($store, $cfg)]);
    }

    public function automationUnlock(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate([
            'method' => ['required', 'in:mark_paid,comp,services_points'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:366'],
        ]);
        if (! $this->configs->storeIsProEligible($store)) {
            return response()->json(['message' => 'Pro required.', 'code' => 'pro_required', 'payment_required' => true], 422);
        }
        $cfg = $this->automation->update($store, [
            'usage_unlocked' => true,
            'payment_status' => $data['method'] === 'comp' ? 'comped' : 'paid',
            'usage_unlocked_until' => now()->addDays((int) ($data['days'] ?? 30))->toDateTimeString(),
            'config_status' => 'active',
        ], $request->user()?->id);

        return response()->json(['ok' => true, 'config' => $this->automation->serialize($store, $cfg)]);
    }

    public function automationAsk(Request $request, string $storeId): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }
        $store = Store::query()->find($storeId);
        if (! $store) {
            return response()->json(['message' => 'Store not found.'], 404);
        }
        $data = $request->validate(['question' => ['required', 'string', 'max:8000']]);
        $result = $this->automation->ask($store, $data['question'], $request->user()?->id);
        if (! ($result['ok'] ?? false)) {
            return response()->json($result, ($result['payment_required'] ?? false) ? 402 : 422);
        }

        return response()->json($result);
    }

    /**
     * Instant unlock Text + Image + Automation for one store or all Pro-eligible stores.
     * Non-Pro stores are skipped (never fake-unlocked).
     */
    public function unlockSuite(Request $request): JsonResponse
    {
        if ($deny = $this->assertMaster($request)) {
            return $deny;
        }

        $data = $request->validate([
            'scope' => ['required', 'in:store,all'],
            'store_id' => ['required_if:scope,store', 'nullable', 'string', 'max:64'],
            'method' => ['required', 'in:mark_paid,comp,services_points'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:366'],
        ]);

        $days = (int) ($data['days'] ?? 30);
        $payStatus = $data['method'] === 'comp' ? 'comped' : 'paid';
        $until = now()->addDays($days)->toDateTimeString();
        $actorId = $request->user()?->id;

        $targets = [];
        if ($data['scope'] === 'store') {
            $store = Store::query()->find((string) $data['store_id']);
            if (! $store) {
                return response()->json(['message' => 'Store not found.'], 404);
            }
            $targets = [$store];
        } else {
            $targets = Store::query()->orderBy('id')->get()->all();
        }

        $unlocked = [];
        $skipped = [];

        foreach ($targets as $store) {
            if (! $this->configs->storeIsProEligible($store)) {
                $skipped[] = [
                    'store_id' => $store->id,
                    'store_name' => $store->name ?? $store->id,
                    'reason' => 'pro_required',
                ];
                continue;
            }

            $this->configs->updateStoreConfig($store, [
                'enabled' => true,
                'usage_unlocked' => true,
                'payment_status' => $payStatus,
                'usage_unlocked_until' => $until,
                'config_status' => 'active',
            ], $actorId);

            $this->images->update($store, [
                'enabled' => true,
                'usage_unlocked' => true,
                'payment_status' => $payStatus,
                'usage_unlocked_until' => $until,
                'config_status' => 'active',
            ], $actorId);

            $this->automation->update($store, [
                'enabled' => true,
                'usage_unlocked' => true,
                'payment_status' => $payStatus,
                'usage_unlocked_until' => $until,
                'config_status' => 'active',
            ], $actorId);

            $this->configs->audit($store->id, $actorId, 'suite_unlock', 'security', 'OpenAI suite unlocked (text+image+automation)', [
                'method' => $data['method'],
                'days' => $days,
                'scope' => $data['scope'],
            ]);

            $unlocked[] = [
                'store_id' => $store->id,
                'store_name' => $store->name ?? $store->id,
            ];
        }

        return response()->json([
            'ok' => true,
            'scope' => $data['scope'],
            'method' => $data['method'],
            'days' => $days,
            'unlocked_count' => count($unlocked),
            'skipped_count' => count($skipped),
            'unlocked' => $unlocked,
            'skipped' => $skipped,
        ]);
    }
}
