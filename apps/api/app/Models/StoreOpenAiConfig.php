<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOpenAiConfig extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_configs';

    protected $fillable = [
        'id',
        'store_id',
        'enabled',
        'intelligence_level',
        'text_model',
        'reasoning_effort',
        'prompt_caching_enabled',
        'daily_token_limit',
        'monthly_token_limit',
        'max_input_tokens',
        'max_output_tokens',
        'daily_request_limit',
        'monthly_request_limit',
        'daily_budget_usd',
        'monthly_budget_usd',
        'max_cost_per_request_usd',
        'warning_threshold_pct',
        'auto_stop_at_budget',
        'allow_admin_override',
        'payment_required_for_usage',
        'usage_unlocked',
        'payment_status',
        'usage_unlocked_until',
        'store_isolation_enforced',
        'audit_logging_enabled',
        'rate_limit_per_minute',
        'config_status',
        'level_overrides',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'prompt_caching_enabled' => 'boolean',
            'daily_token_limit' => 'integer',
            'monthly_token_limit' => 'integer',
            'max_input_tokens' => 'integer',
            'max_output_tokens' => 'integer',
            'daily_request_limit' => 'integer',
            'monthly_request_limit' => 'integer',
            'daily_budget_usd' => 'decimal:4',
            'monthly_budget_usd' => 'decimal:4',
            'max_cost_per_request_usd' => 'decimal:4',
            'warning_threshold_pct' => 'integer',
            'auto_stop_at_budget' => 'boolean',
            'allow_admin_override' => 'boolean',
            'payment_required_for_usage' => 'boolean',
            'usage_unlocked' => 'boolean',
            'usage_unlocked_until' => 'datetime',
            'store_isolation_enforced' => 'boolean',
            'audit_logging_enabled' => 'boolean',
            'rate_limit_per_minute' => 'integer',
            'level_overrides' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
