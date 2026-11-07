<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerActivity extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    public const TYPES = [
        'product_viewed',
        'add_to_cart',
        'remove_from_cart',
        'checkout_started',
        'order_created',
        'payment_completed',
        'order_cancelled',
    ];

    protected $fillable = [
        'id',
        'store_id',
        'customer_id',
        'customer_name',
        'activity_type',
        'product_id',
        'product_name',
        'order_id',
        'meta',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
