<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationWebhookEvent extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'category',
        'provider',
        'event_id',
        'event_type',
        'signature_ok',
        'status',
        'transaction_id',
        'shipment_id',
        'payload_sanitized',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'signature_ok' => 'boolean',
            'payload_sanitized' => 'array',
            'processed_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
