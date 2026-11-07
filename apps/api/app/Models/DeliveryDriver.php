<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryDriver extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'name_ar',
        'phone',
        'email',
        'vehicle_type',
        'city',
        'base_location',
        'service_areas',
        'rate_mode',
        'fixed_rate',
        'per_kg_rate',
        'per_km_rate',
        'same_day',
        'eta_text',
        'payment_options',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'same_day' => 'boolean',
            'service_areas' => 'array',
            'payment_options' => 'array',
            'fixed_rate' => 'decimal:2',
            'per_kg_rate' => 'decimal:2',
            'per_km_rate' => 'decimal:2',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'driver_id');
    }
}
