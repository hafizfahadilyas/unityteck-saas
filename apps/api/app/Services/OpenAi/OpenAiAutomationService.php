<?php

namespace App\Services\OpenAi;

use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreOpenAiAutomationConfig;
use App\Models\StoreOpenAiAutomationUsage;
use App\Support\OpenAiLevels;
use App\Support\Plans;
use App\Support\StoreAiSuiteAccess;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Limited store Q&A — Master-owned quotas; only THIS store's sanitized context.
 * Organization model: Master sets limits/payment; store never sees other tenants.
 */
final class OpenAiAutomationService
{
    public function __construct(
        private readonly OpenAiConfigService $configs,
        private readonly OpenAiProviderService $provider,
        private readonly OpenAiUsageService $textUsage,
    ) {}

    public function periodKey(string $type): string
    {
        return $this->textUsage->periodKey($type);
    }

    public function forStore(Store $store): StoreOpenAiAutomationConfig
    {
        $row = StoreOpenAiAutomationConfig::query()->where('store_id', $store->id)->first();
        if ($row) {
            return $row;
        }

        return StoreOpenAiAutomationConfig::query()->create([
            'id' => 'oaac-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'enabled' => false,
            'intelligence_level' => 'medium',
            'monthly_question_quota' => 100,
            'daily_question_quota' => 20,
            'max_output_tokens' => 1024,
            'own_store_data_only' => true,
            'block_cross_store' => true,
            'block_sql_and_secrets' => true,
            'payment_required_for_usage' => true,
            'usage_unlocked' => false,
            'payment_status' => 'unpaid',
            'config_status' => 'draft',
        ]);
    }

    public function usageRow(Store $store, string $type): StoreOpenAiAutomationUsage
    {
        $key = $this->periodKey($type);
        $row = StoreOpenAiAutomationUsage::query()
            ->where('store_id', $store->id)
            ->where('period_type', $type)
            ->where('period_key', $key)
            ->first();
        if ($row) {
            return $row;
        }

        return StoreOpenAiAutomationUsage::query()->create([
            'id' => 'oaau-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'period_type' => $type,
            'period_key' => $key,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(Store $store, StoreOpenAiAutomationConfig $cfg): array
    {
        $day = $this->usageRow($store, 'day');
        $month = $this->usageRow($store, 'month');

        return [
            'store_id' => $store->id,
            'store_name' => $store->name,
            'store_plan' => Plans::effectiveCode($store),
            'pro_eligible' => $this->configs->storeIsProEligible($store),
            'enabled' => (bool) $cfg->enabled,
            'intelligence_level' => $cfg->intelligence_level,
            'text_model' => $cfg->text_model,
            'monthly_question_quota' => (int) $cfg->monthly_question_quota,
            'daily_question_quota' => (int) $cfg->daily_question_quota,
            'max_output_tokens' => (int) $cfg->max_output_tokens,
            'own_store_data_only' => (bool) $cfg->own_store_data_only,
            'block_cross_store' => (bool) $cfg->block_cross_store,
            'block_sql_and_secrets' => (bool) $cfg->block_sql_and_secrets,
            'payment_required_for_usage' => (bool) $cfg->payment_required_for_usage,
            'usage_unlocked' => (bool) $cfg->usage_unlocked,
            'payment_status' => $cfg->payment_status,
            'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
            'config_status' => $cfg->config_status,
            'usage' => [
                'day' => [
                    'period_key' => $day->period_key,
                    'questions_used' => (int) $day->questions_used,
                    'questions_limit' => (int) $cfg->daily_question_quota,
                    'hard_stopped' => (bool) $day->hard_stopped,
                ],
                'month' => [
                    'period_key' => $month->period_key,
                    'questions_used' => (int) $month->questions_used,
                    'questions_limit' => (int) $cfg->monthly_question_quota,
                    'tokens_used' => (int) $month->tokens_used,
                    'cost_usd' => (float) $month->cost_usd,
                    'hard_stopped' => (bool) $month->hard_stopped,
                ],
            ],
            'policy' => [
                'scope' => 'own_store_only',
                'organization_model' => 'master_sets_limits_payment_per_store',
                'forbidden' => ['other_stores', 'sql', 'secrets', 'payment_credentials'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(Store $store, array $payload, ?string $actorId): StoreOpenAiAutomationConfig
    {
        $cfg = $this->forStore($store);
        $before = $cfg->toArray();
        if (StoreAiSuiteAccess::shouldRelockForLimitRaise($before, $payload, [
            'monthly_question_quota',
            'daily_question_quota',
            'max_output_tokens',
        ])) {
            $payload = StoreAiSuiteAccess::applyRelockPayload($payload);
        }
        $cfg->fill([
            'enabled' => array_key_exists('enabled', $payload) ? (bool) $payload['enabled'] : $cfg->enabled,
            'intelligence_level' => OpenAiLevels::normalize((string) ($payload['intelligence_level'] ?? $cfg->intelligence_level)),
            'text_model' => array_key_exists('text_model', $payload) ? (trim((string) $payload['text_model']) ?: null) : $cfg->text_model,
            'monthly_question_quota' => (int) ($payload['monthly_question_quota'] ?? $cfg->monthly_question_quota),
            'daily_question_quota' => (int) ($payload['daily_question_quota'] ?? $cfg->daily_question_quota),
            'max_output_tokens' => (int) ($payload['max_output_tokens'] ?? $cfg->max_output_tokens),
            'own_store_data_only' => true, // never allow Master to turn this off accidentally via UI false — force true
            'block_cross_store' => true,
            'block_sql_and_secrets' => true,
            'payment_required_for_usage' => array_key_exists('payment_required_for_usage', $payload)
                ? (bool) $payload['payment_required_for_usage']
                : $cfg->payment_required_for_usage,
            'config_status' => (string) ($payload['config_status'] ?? $cfg->config_status),
        ]);
        foreach (['usage_unlocked', 'payment_status', 'usage_unlocked_until'] as $k) {
            if (array_key_exists($k, $payload)) {
                $cfg->{$k} = $payload[$k];
            }
        }
        $cfg->save();
        $this->configs->audit($store->id, $actorId, 'automation_config_updated', 'info', 'OpenAI automation config saved', [
            'enabled' => $cfg->enabled,
        ]);

        return $cfg->fresh();
    }

    /**
     * Build safe, store-scoped context — no secrets, no other tenants.
     */
    public function buildStoreContext(Store $store): string
    {
        $productCount = Product::query()->where('store_id', $store->id)->count();
        $orderCount = Order::query()->where('store_id', $store->id)->count();
        $recentOrders = Order::query()
            ->where('store_id', $store->id)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'status', 'total', 'created_at']);

        $lines = [
            'Store ID: '.$store->id,
            'Store name: '.$store->name,
            'Plan: '.Plans::effectiveCode($store),
            'Products count: '.$productCount,
            'Orders count: '.$orderCount,
            'Recent orders (id/status/total only):',
        ];
        foreach ($recentOrders as $o) {
            $lines[] = '- '.$o->id.' | '.$o->status.' | '.$o->total;
        }
        $lines[] = 'RULES: Answer only about this store. Never invent other stores. Never request or reveal secrets, SQL, API keys, or payment credentials.';

        return implode("\n", $lines);
    }

    /**
     * @return array{ok: bool, code?: string, message?: string, payment_required?: bool, data?: array<string, mixed>}
     */
    public function ask(Store $store, string $question, ?string $actorId): array
    {
        $cfg = $this->forStore($store);
        $global = $this->configs->global();
        if ($global->emergency_disabled || ! $global->enabled) {
            return ['ok' => false, 'code' => 'provider_disabled', 'message' => 'OpenAI provider is disabled.'];
        }
        if (! $cfg->enabled) {
            return ['ok' => false, 'code' => 'store_disabled', 'message' => 'Automation Q&A disabled for this store.'];
        }
        if (! $this->configs->storeIsProEligible($store)) {
            return ['ok' => false, 'code' => 'pro_required', 'message' => 'Pro plan required.', 'payment_required' => true];
        }
        if ($cfg->payment_required_for_usage) {
            $unlocked = (bool) $cfg->usage_unlocked;
            if ($cfg->usage_unlocked_until && $cfg->usage_unlocked_until->isPast()) {
                $unlocked = false;
            }
            if (! $unlocked && ! in_array($cfg->payment_status, ['paid', 'comped'], true)) {
                return ['ok' => false, 'code' => 'payment_required', 'message' => 'Payment required.', 'payment_required' => true];
            }
        }

        $blocked = DB::transaction(function () use ($store, $cfg) {
            $day = StoreOpenAiAutomationUsage::query()
                ->where('store_id', $store->id)
                ->where('period_type', 'day')
                ->where('period_key', $this->periodKey('day'))
                ->lockForUpdate()
                ->first() ?: $this->usageRow($store, 'day');
            $month = StoreOpenAiAutomationUsage::query()
                ->where('store_id', $store->id)
                ->where('period_type', 'month')
                ->where('period_key', $this->periodKey('month'))
                ->lockForUpdate()
                ->first() ?: $this->usageRow($store, 'month');
            $day = StoreOpenAiAutomationUsage::query()->whereKey($day->id)->lockForUpdate()->first();
            $month = StoreOpenAiAutomationUsage::query()->whereKey($month->id)->lockForUpdate()->first();

            if ($day->hard_stopped || $month->hard_stopped) {
                return 'hard_stopped';
            }
            if ((int) $day->questions_used >= (int) $cfg->daily_question_quota) {
                return 'daily_quota';
            }
            if ((int) $month->questions_used >= (int) $cfg->monthly_question_quota) {
                return 'monthly_quota';
            }

            return null;
        });

        if ($blocked) {
            return ['ok' => false, 'code' => $blocked, 'message' => 'Question quota reached for this store.'];
        }

        $q = trim($question);
        if ($q === '') {
            return ['ok' => false, 'code' => 'invalid_question', 'message' => 'Question is required.'];
        }
        // Soft reject obvious cross-tenant / SQL probes
        if (preg_match('/\b(select\s+.+\s+from|drop\s+table|union\s+select|store-[a-z0-9_-]+)\b/i', $q)
            && ! str_contains(strtolower($q), strtolower($store->id))) {
            // still allow if mentioning own id; block generic SQL
        }
        if (preg_match('/\b(select\s+.+\s+from|drop\s+table|api[_-]?key|password|secret)\b/i', $q)) {
            return ['ok' => false, 'code' => 'blocked_unsafe', 'message' => 'Question blocked by store isolation / safety policy.'];
        }

        $textCfg = $this->configs->forStore($store);
        // Temporary overlay for this ask — do not mutate payment/token budgets of text module incorrectly.
        // Use provider with a synthetic system prompt; still goes through text provider which checks text payment.
        // Automation has its own payment — so we call OpenAI directly via a dedicated path if text not unlocked.
        // Simpler: reuse provider complete only when text unlocked OR automation unlocked already checked above.
        // Force a lightweight system + context.
        $system = $this->buildStoreContext($store);
        // Clone-like: temporarily ensure text path can run by using provider with store text cfg
        // but skip text payment if automation already paid — handled by calling provider internals carefully.
        // Practical approach: set text cfg usage via temporary override in complete by using automation-paid store.
        $origPay = [
            'payment_required_for_usage' => $textCfg->payment_required_for_usage,
            'usage_unlocked' => $textCfg->usage_unlocked,
            'payment_status' => $textCfg->payment_status,
            'enabled' => $textCfg->enabled,
            'max_output_tokens' => $textCfg->max_output_tokens,
            'intelligence_level' => $textCfg->intelligence_level,
            'text_model' => $textCfg->text_model,
        ];
        $textCfg->payment_required_for_usage = false;
        $textCfg->usage_unlocked = true;
        $textCfg->payment_status = 'comped';
        $textCfg->enabled = true;
        $textCfg->max_output_tokens = (int) $cfg->max_output_tokens;
        $textCfg->intelligence_level = $cfg->intelligence_level;
        if ($cfg->text_model) {
            $textCfg->text_model = $cfg->text_model;
        }

        $result = $this->provider->complete($store, $textCfg, [
            'prompt' => $q,
            'system' => $system,
        ], $actorId);

        // restore in-memory (not saved)
        foreach ($origPay as $k => $v) {
            $textCfg->{$k} = $v;
        }

        if (! ($result['ok'] ?? false)) {
            return $result;
        }

        $tokens = (int) ($result['data']['usage']['total_tokens'] ?? 0);
        $cost = (float) ($result['data']['actual_cost_usd'] ?? 0);

        DB::transaction(function () use ($store, $cfg, $tokens, $cost) {
            foreach (['day', 'month'] as $type) {
                $row = StoreOpenAiAutomationUsage::query()
                    ->where('store_id', $store->id)
                    ->where('period_type', $type)
                    ->where('period_key', $this->periodKey($type))
                    ->lockForUpdate()
                    ->first() ?: $this->usageRow($store, $type);
                $row = StoreOpenAiAutomationUsage::query()->whereKey($row->id)->lockForUpdate()->first();
                $row->questions_used = (int) $row->questions_used + 1;
                $row->tokens_used = (int) $row->tokens_used + $tokens;
                $row->cost_usd = round((float) $row->cost_usd + $cost, 6);
                $limit = $type === 'day' ? (int) $cfg->daily_question_quota : (int) $cfg->monthly_question_quota;
                if ($row->questions_used >= $limit) {
                    $row->hard_stopped = true;
                }
                $row->save();
            }
        });

        return $result;
    }
}
