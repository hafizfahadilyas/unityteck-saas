<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyPointTransaction extends Model
{
    public $incrementing = false;

    public $timestamps = false;

    protected $keyType = 'string';

    protected $table = 'loyalty_point_transactions';

    protected $fillable = [
        'id',
        'store_id',
        'customer_id',
        'transaction_type',
        'points_delta',
        'balance_after',
        'method',
        'reason',
        'source_event_id',
        'order_id',
        'review_id',
        'metadata',
        'expires_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'points_delta' => 'integer',
            'balance_after' => 'integer',
            'metadata' => 'array',
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
