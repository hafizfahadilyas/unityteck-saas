<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOpenAiAutomationConfig extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_automation_configs';

    protected $fillable = [
        'id', 'store_id', 'enabled', 'intelligence_level', 'text_model',
        'monthly_question_quota', 'daily_question_quota', 'max_output_tokens',
        'own_store_data_only', 'block_cross_store', 'block_sql_and_secrets',
        'payment_required_for_usage', 'usage_unlocked', 'payment_status',
        'usage_unlocked_until', 'config_status',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'monthly_question_quota' => 'integer',
            'daily_question_quota' => 'integer',
            'max_output_tokens' => 'integer',
            'own_store_data_only' => 'boolean',
            'block_cross_store' => 'boolean',
            'block_sql_and_secrets' => 'boolean',
            'payment_required_for_usage' => 'boolean',
            'usage_unlocked' => 'boolean',
            'usage_unlocked_until' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
