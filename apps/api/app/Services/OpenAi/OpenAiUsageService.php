<?php

namespace App\Services\OpenAi;

use App\Models\Store;
use App\Models\StoreOpenAiBudgetPeriod;
use App\Models\StoreOpenAiConfig;
use App\Models\StoreOpenAiUsageLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class OpenAiUsageService
{
    public function periodKey(string $type, ?\DateTimeInterface $now = null): string
    {
        $tz = new \DateTimeZone('Asia/Riyadh');
        $dt = $now
            ? \DateTimeImmutable::createFromInterface($now)->setTimezone($tz)
            : new \DateTimeImmutable('now', $tz);

        return $type === 'day' ? $dt->format('Y-m-d') : $dt->format('Y-m');
    }

    public function budgetRow(Store $store, string $type): StoreOpenAiBudgetPeriod
    {
        $key = $this->periodKey($type);
        $row = StoreOpenAiBudgetPeriod::query()
            ->where('store_id', $store->id)
            ->where('period_type', $type)
            ->where('period_key', $key)
            ->first();

        if ($row) {
            return $row;
        }

        return StoreOpenAiBudgetPeriod::query()->create([
            'id' => 'oabp-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'period_type' => $type,
            'period_key' => $key,
            'tokens_used' => 0,
            'requests_used' => 0,
            'cost_usd' => 0,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshot(Store $store, StoreOpenAiConfig $cfg): array
    {
        $day = $this->budgetRow($store, 'day');
        $month = $this->budgetRow($store, 'month');

        return [
            'day' => [
                'period_key' => $day->period_key,
                'tokens_used' => (int) $day->tokens_used,
                'tokens_limit' => (int) $cfg->daily_token_limit,
                'requests_used' => (int) $day->requests_used,
                'requests_limit' => (int) $cfg->daily_request_limit,
                'cost_usd' => (float) $day->cost_usd,
                'budget_usd' => (float) $cfg->daily_budget_usd,
                'hard_stopped' => (bool) $day->hard_stopped,
            ],
            'month' => [
                'period_key' => $month->period_key,
                'tokens_used' => (int) $month->tokens_used,
                'tokens_limit' => (int) $cfg->monthly_token_limit,
                'requests_used' => (int) $month->requests_used,
                'requests_limit' => (int) $cfg->monthly_request_limit,
                'cost_usd' => (float) $month->cost_usd,
                'budget_usd' => (float) $cfg->monthly_budget_usd,
                'hard_stopped' => (bool) $month->hard_stopped,
            ],
            'warning_threshold_pct' => (int) $cfg->warning_threshold_pct,
        ];
    }

    /**
     * Pre-flight gate with row locks — concurrent requests cannot bypass.
     *
     * @return array{ok: true}|array{ok: false, code: string, message: string, payment_required?: bool}
     */
    public function assertCanConsume(Store $store, StoreOpenAiConfig $cfg, OpenAiConfigService $configs): array
    {
        $global = $configs->global();
        if ($global->emergency_disabled || ! $global->enabled) {
            return ['ok' => false, 'code' => 'provider_disabled', 'message' => 'OpenAI provider is disabled.'];
        }
        if (! $cfg->enabled || $cfg->config_status === 'emergency') {
            return ['ok' => false, 'code' => 'store_disabled', 'message' => 'OpenAI is disabled for this store.'];
        }
        if (! $configs->storeIsProEligible($store)) {
            return [
                'ok' => false,
                'code' => 'pro_required',
                'message' => 'OpenAI AI Management usage requires a Pro plan.',
                'payment_required' => true,
            ];
        }
        if ($cfg->payment_required_for_usage) {
            $unlocked = (bool) $cfg->usage_unlocked;
            if ($cfg->usage_unlocked_until && $cfg->usage_unlocked_until->isPast()) {
                $unlocked = false;
            }
            if (! $unlocked && ! in_array($cfg->payment_status, ['paid', 'comped'], true)) {
                return [
                    'ok' => false,
                    'code' => 'payment_required',
                    'message' => 'Payment is required before OpenAI usage for this store.',
                    'payment_required' => true,
                ];
            }
        }

        return DB::transaction(function () use ($store, $cfg) {
            $day = StoreOpenAiBudgetPeriod::query()
                ->where('store_id', $store->id)
                ->where('period_type', 'day')
                ->where('period_key', $this->periodKey('day'))
                ->lockForUpdate()
                ->first();
            $month = StoreOpenAiBudgetPeriod::query()
                ->where('store_id', $store->id)
                ->where('period_type', 'month')
                ->where('period_key', $this->periodKey('month'))
                ->lockForUpdate()
                ->first();

            if (! $day) {
                $day = $this->budgetRow($store, 'day');
                $day = StoreOpenAiBudgetPeriod::query()->whereKey($day->id)->lockForUpdate()->first();
            }
            if (! $month) {
                $month = $this->budgetRow($store, 'month');
                $month = StoreOpenAiBudgetPeriod::query()->whereKey($month->id)->lockForUpdate()->first();
            }

            if ($day->hard_stopped || $month->hard_stopped) {
                return ['ok' => false, 'code' => 'hard_stopped', 'message' => 'Usage hard-stopped for this store period.'];
            }
            if ((int) $day->requests_used >= (int) $cfg->daily_request_limit) {
                return ['ok' => false, 'code' => 'daily_request_limit', 'message' => 'Daily request limit reached.'];
            }
            if ((int) $month->requests_used >= (int) $cfg->monthly_request_limit) {
                return ['ok' => false, 'code' => 'monthly_request_limit', 'message' => 'Monthly request limit reached.'];
            }
            if ((int) $day->tokens_used >= (int) $cfg->daily_token_limit) {
                return ['ok' => false, 'code' => 'daily_token_limit', 'message' => 'Daily token limit reached.'];
            }
            if ((int) $month->tokens_used >= (int) $cfg->monthly_token_limit) {
                return ['ok' => false, 'code' => 'monthly_token_limit', 'message' => 'Monthly token limit reached.'];
            }
            if ($cfg->auto_stop_at_budget) {
                if ((float) $day->cost_usd >= (float) $cfg->daily_budget_usd) {
                    return ['ok' => false, 'code' => 'daily_budget', 'message' => 'Daily budget reached.'];
                }
                if ((float) $month->cost_usd >= (float) $cfg->monthly_budget_usd) {
                    return ['ok' => false, 'code' => 'monthly_budget', 'message' => 'Monthly budget reached.'];
                }
            }

            return ['ok' => true];
        });
    }

    /**
     * @param  array<string, mixed>  $fields
     */
    public function log(Store $store, array $fields): StoreOpenAiUsageLog
    {
        return StoreOpenAiUsageLog::query()->create(array_merge([
            'id' => 'oaul-'.Str::lower(Str::random(12)),
            'store_id' => $store->id,
            'created_at' => now(),
        ], $fields));
    }

    public function applyUsage(Store $store, StoreOpenAiConfig $cfg, int $tokens, float $costUsd): void
    {
        DB::transaction(function () use ($store, $cfg, $tokens, $costUsd) {
            foreach (['day', 'month'] as $type) {
                $row = StoreOpenAiBudgetPeriod::query()
                    ->where('store_id', $store->id)
                    ->where('period_type', $type)
                    ->where('period_key', $this->periodKey($type))
                    ->lockForUpdate()
                    ->first();
                if (! $row) {
                    $row = $this->budgetRow($store, $type);
                    $row = StoreOpenAiBudgetPeriod::query()->whereKey($row->id)->lockForUpdate()->first();
                }
                $row->tokens_used = (int) $row->tokens_used + max(0, $tokens);
                $row->requests_used = (int) $row->requests_used + 1;
                $row->cost_usd = round((float) $row->cost_usd + max(0, $costUsd), 6);

                $limitTokens = $type === 'day' ? (int) $cfg->daily_token_limit : (int) $cfg->monthly_token_limit;
                $budget = $type === 'day' ? (float) $cfg->daily_budget_usd : (float) $cfg->monthly_budget_usd;
                $warnPct = max(1, (int) $cfg->warning_threshold_pct) / 100;

                if (! $row->warning_sent) {
                    $tokenRatio = $limitTokens > 0 ? $row->tokens_used / $limitTokens : 0;
                    $costRatio = $budget > 0 ? ((float) $row->cost_usd) / $budget : 0;
                    if ($tokenRatio >= $warnPct || $costRatio >= $warnPct) {
                        $row->warning_sent = true;
                    }
                }

                if ($cfg->auto_stop_at_budget) {
                    if ($row->tokens_used >= $limitTokens || (float) $row->cost_usd >= $budget) {
                        $row->hard_stopped = true;
                    }
                }

                $row->save();
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $totalRequests = (int) StoreOpenAiUsageLog::query()->count();
        $totalTokens = (int) StoreOpenAiUsageLog::query()->sum('total_tokens');
        $totalCost = (float) StoreOpenAiUsageLog::query()->sum('actual_cost_usd');
        $activeStores = (int) StoreOpenAiConfig::query()->where('enabled', true)->count();
        $disabled = (int) StoreOpenAiConfig::query()->where('enabled', false)->count();
        $near = StoreOpenAiBudgetPeriod::query()
            ->where('period_type', 'month')
            ->where('period_key', $this->periodKey('month'))
            ->where('warning_sent', true)
            ->count();

        return [
            'total_requests' => $totalRequests,
            'total_tokens' => $totalTokens,
            'total_cost_usd' => round($totalCost, 4),
            'active_stores' => $activeStores,
            'stores_near_limit' => (int) $near,
            'stores_disabled' => $disabled,
        ];
    }
}
