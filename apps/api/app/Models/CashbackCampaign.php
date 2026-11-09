<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

class CashbackCampaign extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'image_url',
        'type',
        'value',
        'min_cart_value',
        'max_cashback_per_order',
        'start_date',
        'end_date',
        'status',
        'product_scope',
        'product_ids',
        'store_wallet_only',
        'credit_expiry_days',
        'hold_days',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_cart_value' => 'decimal:2',
            'max_cashback_per_order' => 'decimal:2',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'product_ids' => 'array',
            'store_wallet_only' => 'boolean',
            'credit_expiry_days' => 'integer',
            'hold_days' => 'integer',
        ];
    }
}
