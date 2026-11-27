<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantComponentOverride extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'merchant_component_overrides';

    protected $fillable = [
        'id',
        'store_id',
        'merchant_id',
        'component_id',
        'is_visible',
        'custom_order',
        'custom_title_en',
        'custom_title_ar',
        'custom_settings',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
            'custom_order' => 'integer',
            'custom_settings' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id', 'id');
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(UiComponentRegistry::class, 'component_id', 'id');
    }
}
