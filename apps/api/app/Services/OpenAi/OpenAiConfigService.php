<?php

namespace App\Services\OpenAi;

use App\Models\OpenAiGlobalConfig;
use App\Models\Store;
use App\Models\StoreOpenAiAuditLog;
use App\Models\StoreOpenAiConfig;
use App\Models\StoreOpenAiConfigHistory;
use App\Support\OpenAiLevels;
use App\Support\Plans;
use App\Support\StoreAiSuiteAccess;
use Illuminate\Support\Str;

final class OpenAiConfigService
{
    public function global(): OpenAiGlobalConfig
    {
        $row = OpenAiGlobalConfig::query()->orderBy('created_at')->first();
        if ($row) {
            return $row;
        }

        return OpenAiGlobalConfig::query()->create([
            'id' => 'oagc-'.Str::lower(Str::random(10)),
            'enabled' => false,
            'emergency_disabled' => false,
            'default_text_model' => (string) config('services.openai.text_model', 'gpt-5.4-mini'),
            'prompt_caching_enabled' => false,
        ]);
    }

    /**
     * @return array{configured: bool, masked: string|null}
     */
    public function apiKeyStatus(): array
    {
        $key = trim((string) config('services.openai.api_key', ''));
        if ($key === '' || $key === 'sk-your-key') {
            return ['configured' => false, 'masked' => null];
        }
        $len = strlen($key);
        $masked = $len <= 8
            ? str_repeat('*', $len)
            : substr($key, 0, 3).str_repeat('*', max(4, $len - 7)).substr($key, -4);

        return ['configured' => true, 'masked' => $masked];
    }

    public function forStore(Store $store): StoreOpenAiConfig
    {
        $row = StoreOpenAiConfig::query()->where('store_id', $store->id)->first();
        if ($row) {
            return $row;
        }

        $level = OpenAiLevels::for('medium');

        return StoreOpenAiConfig::query()->create([
            'id' => 'oasc-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'enabled' => false,
            'intelligence_level' => 'medium',
            'text_model' => null,
            'reasoning_effort' => $level['reasoning_effort'],
            'max_output_tokens' => $level['default_max_output_tokens'],
            'config_status' => 'draft',
            'payment_required_for_usage' => true,
            'usage_unlocked' => false,
            'payment_status' => 'unpaid',
        ]);
    }

    public function storeIsProEligible(Store $store): bool
    {
        $code = Plans::effectiveCode($store);

        return in_array($code, ['pro', 'premium', 'custom'], true);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function updateStoreConfig(Store $store, array $payload, ?string $actorUserId): StoreOpenAiConfig
    {
        $cfg = $this->forStore($store);
        $before = $cfg->toArray();

        // Raising paid capacity locks usage again until Master re-unlocks payment.
        if (StoreAiSuiteAccess::shouldRelockForLimitRaise($before, $payload, [
            'daily_token_limit',
            'monthly_token_limit',
            'daily_request_limit',
            'monthly_request_limit',
            'daily_budget_usd',
            'monthly_budget_usd',
            'max_output_tokens',
        ])) {
            $payload = StoreAiSuiteAccess::applyRelockPayload($payload);
        }

        $level = OpenAiLevels::normalize((string) ($payload['intelligence_level'] ?? $cfg->intelligence_level));
        $levelDefaults = OpenAiLevels::for($level);

        $cfg->fill([
            'enabled' => array_key_exists('enabled', $payload) ? (bool) $payload['enabled'] : $cfg->enabled,
            'intelligence_level' => $level,
            'text_model' => array_key_exists('text_model', $payload)
                ? (trim((string) $payload['text_model']) ?: null)
                : $cfg->text_model,
            'reasoning_effort' => array_key_exists('reasoning_effort', $payload)
                ? (in_array($payload['reasoning_effort'], ['low', 'medium', 'high', null], true)
                    ? $payload['reasoning_effort']
                    : $levelDefaults['reasoning_effort'])
                : ($cfg->reasoning_effort ?: $levelDefaults['reasoning_effort']),
            'prompt_caching_enabled' => array_key_exists('prompt_caching_enabled', $payload)
                ? (bool) $payload['prompt_caching_enabled']
                : $cfg->prompt_caching_enabled,
            'daily_token_limit' => (int) ($payload['daily_token_limit'] ?? $cfg->daily_token_limit),
            'monthly_token_limit' => (int) ($payload['monthly_token_limit'] ?? $cfg->monthly_token_limit),
            'max_input_tokens' => (int) ($payload['max_input_tokens'] ?? $cfg->max_input_tokens),
            'max_output_tokens' => (int) ($payload['max_output_tokens'] ?? $cfg->max_output_tokens ?: $levelDefaults['default_max_output_tokens']),
            'daily_request_limit' => (int) ($payload['daily_request_limit'] ?? $cfg->daily_request_limit),
            'monthly_request_limit' => (int) ($payload['monthly_request_limit'] ?? $cfg->monthly_request_limit),
            'daily_budget_usd' => (float) ($payload['daily_budget_usd'] ?? $cfg->daily_budget_usd),
            'monthly_budget_usd' => (float) ($payload['monthly_budget_usd'] ?? $cfg->monthly_budget_usd),
            'max_cost_per_request_usd' => (float) ($payload['max_cost_per_request_usd'] ?? $cfg->max_cost_per_request_usd),
            'warning_threshold_pct' => in_array((int) ($payload['warning_threshold_pct'] ?? $cfg->warning_threshold_pct), [50, 80, 90], true)
                ? (int) ($payload['warning_threshold_pct'] ?? $cfg->warning_threshold_pct)
                : 80,
            'auto_stop_at_budget' => array_key_exists('auto_stop_at_budget', $payload)
                ? (bool) $payload['auto_stop_at_budget']
                : $cfg->auto_stop_at_budget,
            'allow_admin_override' => array_key_exists('allow_admin_override', $payload)
                ? (bool) $payload['allow_admin_override']
                : $cfg->allow_admin_override,
            'payment_required_for_usage' => array_key_exists('payment_required_for_usage', $payload)
                ? (bool) $payload['payment_required_for_usage']
                : $cfg->payment_required_for_usage,
            'rate_limit_per_minute' => (int) ($payload['rate_limit_per_minute'] ?? $cfg->rate_limit_per_minute),
            'config_status' => (string) ($payload['config_status'] ?? $cfg->config_status),
            'audit_logging_enabled' => array_key_exists('audit_logging_enabled', $payload)
                ? (bool) $payload['audit_logging_enabled']
                : $cfg->audit_logging_enabled,
        ]);

        if (array_key_exists('usage_unlocked', $payload)) {
            $cfg->usage_unlocked = (bool) $payload['usage_unlocked'];
        }
        if (array_key_exists('payment_status', $payload)) {
            $cfg->payment_status = (string) $payload['payment_status'];
        }
        if (array_key_exists('usage_unlocked_until', $payload)) {
            $cfg->usage_unlocked_until = $payload['usage_unlocked_until'];
        }

        $cfg->save();

        StoreOpenAiConfigHistory::query()->create([
            'id' => 'oach-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'actor_user_id' => $actorUserId,
            'before_json' => $before,
            'after_json' => $cfg->fresh()->toArray(),
            'action' => 'update',
            'created_at' => now(),
        ]);

        $this->audit($store->id, $actorUserId, 'config_updated', 'info', 'Store OpenAI config saved', [
            'enabled' => $cfg->enabled,
            'level' => $cfg->intelligence_level,
        ]);

        return $cfg->fresh();
    }

    public function resetStoreDefaults(Store $store, ?string $actorUserId): StoreOpenAiConfig
    {
        $cfg = $this->forStore($store);
        $before = $cfg->toArray();
        $level = OpenAiLevels::for('medium');

        $cfg->fill([
            'enabled' => false,
            'intelligence_level' => 'medium',
            'text_model' => null,
            'reasoning_effort' => $level['reasoning_effort'],
            'prompt_caching_enabled' => null,
            'daily_token_limit' => 50000,
            'monthly_token_limit' => 500000,
            'max_input_tokens' => 4000,
            'max_output_tokens' => $level['default_max_output_tokens'],
            'daily_request_limit' => 100,
            'monthly_request_limit' => 2000,
            'daily_budget_usd' => 5,
            'monthly_budget_usd' => 50,
            'max_cost_per_request_usd' => 1,
            'warning_threshold_pct' => 80,
            'auto_stop_at_budget' => true,
            'allow_admin_override' => true,
            'payment_required_for_usage' => true,
            'usage_unlocked' => false,
            'payment_status' => 'unpaid',
            'usage_unlocked_until' => null,
            'config_status' => 'draft',
            'rate_limit_per_minute' => 20,
        ]);
        $cfg->save();

        StoreOpenAiConfigHistory::query()->create([
            'id' => 'oach-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'actor_user_id' => $actorUserId,
            'before_json' => $before,
            'after_json' => $cfg->fresh()->toArray(),
            'action' => 'reset',
            'created_at' => now(),
        ]);

        return $cfg->fresh();
    }

    /**
     * @param  array<string, mixed>|null  $meta
     */
    public function audit(
        ?string $storeId,
        ?string $actorUserId,
        string $action,
        string $severity,
        string $message,
        ?array $meta = null,
    ): void {
        StoreOpenAiAuditLog::query()->create([
            'id' => 'oaa-'.Str::lower(Str::random(12)),
            'store_id' => $storeId,
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'severity' => $severity,
            'message' => $message,
            'meta' => $meta,
            'created_at' => now(),
        ]);
    }

    /**
     * Safe serialization — never includes API key.
     *
     * @return array<string, mixed>
     */
    public function serializeStoreConfig(Store $store, StoreOpenAiConfig $cfg): array
    {
        $pro = $this->storeIsProEligible($store);

        return [
            'store_id' => $store->id,
            'store_name' => $store->name,
            'store_plan' => Plans::effectiveCode($store),
            'pro_eligible' => $pro,
            'enabled' => (bool) $cfg->enabled,
            'intelligence_level' => $cfg->intelligence_level,
            'text_model' => $cfg->text_model,
            'reasoning_effort' => $cfg->reasoning_effort,
            'prompt_caching_enabled' => $cfg->prompt_caching_enabled,
            'daily_token_limit' => (int) $cfg->daily_token_limit,
            'monthly_token_limit' => (int) $cfg->monthly_token_limit,
            'max_input_tokens' => (int) $cfg->max_input_tokens,
            'max_output_tokens' => (int) $cfg->max_output_tokens,
            'daily_request_limit' => (int) $cfg->daily_request_limit,
            'monthly_request_limit' => (int) $cfg->monthly_request_limit,
            'daily_budget_usd' => (float) $cfg->daily_budget_usd,
            'monthly_budget_usd' => (float) $cfg->monthly_budget_usd,
            'max_cost_per_request_usd' => (float) $cfg->max_cost_per_request_usd,
            'warning_threshold_pct' => (int) $cfg->warning_threshold_pct,
            'auto_stop_at_budget' => (bool) $cfg->auto_stop_at_budget,
            'allow_admin_override' => (bool) $cfg->allow_admin_override,
            'payment_required_for_usage' => (bool) $cfg->payment_required_for_usage,
            'usage_unlocked' => (bool) $cfg->usage_unlocked,
            'payment_status' => $cfg->payment_status,
            'usage_unlocked_until' => optional($cfg->usage_unlocked_until)?->toIso8601String(),
            'store_isolation_enforced' => (bool) $cfg->store_isolation_enforced,
            'audit_logging_enabled' => (bool) $cfg->audit_logging_enabled,
            'rate_limit_per_minute' => (int) $cfg->rate_limit_per_minute,
            'config_status' => $cfg->config_status,
            'level_catalog' => OpenAiLevels::catalog(),
        ];
    }
}
