<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiSubscriptionPlan extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'code',
        'billing_cycle',
        'tier',
        'name_en',
        'name_ar',
        'price_sar',
        'currency',
        'credits',
        'daily_limit',
        'monthly_limit',
        'model_permissions',
        'image_generation_limit',
        'calling_minutes',
        'bonus_credits',
        'is_active',
        'is_popular',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'price_sar' => 'decimal:2',
            'credits' => 'integer',
            'daily_limit' => 'integer',
            'monthly_limit' => 'integer',
            'image_generation_limit' => 'integer',
            'calling_minutes' => 'integer',
            'bonus_credits' => 'integer',
            'model_permissions' => 'array',
            'features' => 'array',
            'is_popular' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(MerchantAiSubscription::class, 'plan_id', 'id');
    }
}
