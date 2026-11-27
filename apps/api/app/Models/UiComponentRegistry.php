<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UiComponentRegistry extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'ui_component_registry';

    protected $fillable = [
        'id',
        'component_key',
        'page_route',
        'name_en',
        'name_ar',
        'component_type',
        'default_visibility',
        'global_visibility',
        'display_order',
        'title_en',
        'title_ar',
        'description_en',
        'description_ar',
        'allowed_settings',
    ];

    protected function casts(): array
    {
        return [
            'default_visibility' => 'boolean',
            'global_visibility' => 'boolean',
            'display_order' => 'integer',
            'allowed_settings' => 'array',
        ];
    }

    public function overrides(): HasMany
    {
        return $this->hasMany(MerchantComponentOverride::class, 'component_id', 'id');
    }
}
