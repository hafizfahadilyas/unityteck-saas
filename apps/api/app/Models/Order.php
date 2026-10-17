<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'order_number',
        'customer_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'items_count',
        'items_summary',
        'total_amount',
        'currency',
        'source',
        'source_details',
        'medium',
        'campaign',
        'utm_term',
        'utm_content',
        'delivery_location',
        'status',
        'shipping_status',
        'payment_method',
        'payment_status',
        'payment_transaction_id',
        'shipping_method_id',
        'shipping_zone_id',
        'courier_code',
        'awb_number',
        'tracking_number',
        'shipping_cost',
        'cod_status',
        'cod_collected_at',
        'cod_remitted_at',
        'cod_notes',
        'refund_status',
        'refund_amount',
        'return_reason',
        'return_notes',
        'returned_at',
        'restocked_at',
        'order_date',
    ];

    protected function casts(): array
    {
        return [
            'items_count' => 'integer',
            'total_amount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'refund_amount' => 'decimal:2',
            'order_date' => 'datetime',
            'cod_collected_at' => 'datetime',
            'cod_remitted_at' => 'datetime',
            'returned_at' => 'datetime',
            'restocked_at' => 'datetime',
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

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function returns(): HasMany
    {
        return $this->hasMany(OrderReturn::class);
    }
}
