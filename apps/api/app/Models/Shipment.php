<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'order_id',
        'courier_id',
        'provider',
        'awb_number',
        'tracking_number',
        'label_url',
        'status',
        'shipping_cost',
        'cod_amount',
        'pickup_requested_at',
        'delivered_at',
        'origin_address',
        'destination_address',
        'tracking_events',
    ];

    protected function casts(): array
    {
        return [
            'shipping_cost' => 'decimal:2',
            'cod_amount' => 'decimal:2',
            'pickup_requested_at' => 'datetime',
            'delivered_at' => 'datetime',
            'origin_address' => 'array',
            'destination_address' => 'array',
            'tracking_events' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function courier(): BelongsTo
    {
        return $this->belongsTo(CourierConnection::class, 'courier_id');
    }
}
