<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingZone extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'region',
        'rate',
        'rate_per_kg',
        'min_weight_kg',
        'max_weight_kg',
        'min_delivery_days',
        'max_delivery_days',
        'estimated_delivery',
        'free_above',
        'shipping_method_id',
        'courier_code',
        'cod_available',
        'city_names',
        'status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'rate_per_kg' => 'decimal:2',
            'min_weight_kg' => 'decimal:3',
            'max_weight_kg' => 'decimal:3',
            'free_above' => 'decimal:2',
            'min_delivery_days' => 'integer',
            'max_delivery_days' => 'integer',
            'cod_available' => 'boolean',
            'city_names' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
