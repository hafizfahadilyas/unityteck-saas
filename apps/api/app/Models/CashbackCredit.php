<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CashbackCredit extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'customer_id',
        'campaign_id',
        'order_id',
        'amount',
        'status',
        'available_at',
        'expires_at',
        'source_event_id',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'available_at' => 'datetime',
            'expires_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(CashbackCampaign::class, 'campaign_id');
    }
}
