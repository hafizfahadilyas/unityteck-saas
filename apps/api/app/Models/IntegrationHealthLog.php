<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationHealthLog extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'category',
        'provider',
        'test_type',
        'environment',
        'request_at',
        'response_at',
        'http_status',
        'api_endpoint',
        'duration_ms',
        'error_code',
        'error_message_sanitized',
        'transaction_id',
        'shipment_id',
        'success',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'request_at' => 'datetime',
            'response_at' => 'datetime',
            'http_status' => 'integer',
            'duration_ms' => 'integer',
            'success' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
