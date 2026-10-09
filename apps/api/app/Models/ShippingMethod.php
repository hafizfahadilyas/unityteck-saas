<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingMethod extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'name_ar',
        'type',
        'base_rate',
        'per_kg_rate',
        'min_order_amount',
        'free_shipping_threshold',
        'estimated_delivery',
        'is_cod_allowed',
        'cod_fee',
        'courier_code',
        'is_active',
        'sort_order',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'base_rate' => 'decimal:2',
            'per_kg_rate' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'free_shipping_threshold' => 'decimal:2',
            'cod_fee' => 'decimal:2',
            'is_cod_allowed' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
