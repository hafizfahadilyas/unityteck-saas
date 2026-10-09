<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'email',
        'phone',
        'city',
        'country',
        'gender',
        'group',
        'total_orders',
        'total_spend',
        'avg_order_value',
        'acquisition_source',
        'status',
        'last_order_date',
    ];

    protected function casts(): array
    {
        return [
            'total_orders' => 'integer',
            'total_spend' => 'decimal:2',
            'avg_order_value' => 'decimal:2',
            'last_order_date' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
