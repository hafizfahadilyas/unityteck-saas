<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOpenAiImageConfig extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_image_configs';

    protected $fillable = [
        'id', 'store_id', 'enabled', 'default_model', 'default_quality',
        'monthly_image_quota', 'monthly_budget_usd', 'max_cost_per_image_usd',
        'warning_threshold_pct', 'auto_stop_at_quota', 'payment_required_for_usage',
        'usage_unlocked', 'payment_status', 'usage_unlocked_until', 'config_status',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'monthly_image_quota' => 'integer',
            'monthly_budget_usd' => 'decimal:4',
            'max_cost_per_image_usd' => 'decimal:4',
            'warning_threshold_pct' => 'integer',
            'auto_stop_at_quota' => 'boolean',
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
