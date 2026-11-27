<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiFeatureRegistry extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'ai_feature_registry';

    protected $fillable = [
        'id',
        'feature_code',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'category',
        'global_status',
        'plan_permissions',
        'credit_cost',
        'daily_limit',
        'monthly_limit',
        'default_provider',
        'default_model',
        'page_route',
        'page_visible',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'plan_permissions' => 'array',
            'credit_cost' => 'integer',
            'daily_limit' => 'integer',
            'monthly_limit' => 'integer',
            'global_status' => 'boolean',
            'page_visible' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(MerchantFeatureOverride::class, 'feature_id', 'id');
    }
}
