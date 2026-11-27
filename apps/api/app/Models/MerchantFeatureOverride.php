<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantFeatureOverride extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'merchant_feature_overrides';

    protected $fillable = [
        'id',
        'store_id',
        'merchant_id',
        'feature_id',
        'is_enabled',
        'custom_credit_cost',
        'custom_daily_limit',
        'custom_monthly_limit',
        'custom_provider',
        'custom_model',
        'notes',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'custom_credit_cost' => 'integer',
            'custom_daily_limit' => 'integer',
            'custom_monthly_limit' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id', 'id');
    }

    public function feature(): BelongsTo
    {
        return $this->belongsTo(AiFeatureRegistry::class, 'feature_id', 'id');
    }
}
