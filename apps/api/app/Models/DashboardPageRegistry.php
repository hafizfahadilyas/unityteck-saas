<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DashboardPageRegistry extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'dashboard_page_registry';

    protected $fillable = [
        'id',
        'route_key',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'category',
        'icon',
        'default_visibility',
        'global_visibility',
        'plan_eligibility',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'default_visibility' => 'boolean',
            'global_visibility' => 'boolean',
            'plan_eligibility' => 'array',
            'display_order' => 'integer',
        ];
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(MerchantPageVisibility::class, 'page_id', 'id');
    }
}
