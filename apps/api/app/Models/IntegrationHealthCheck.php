<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationHealthCheck extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'category',
        'provider',
        'connection_status',
        'auth_status',
        'api_health_status',
        'sandbox_status',
        'production_verification_status',
        'webhook_status',
        'last_successful_test_at',
        'last_failed_test_at',
        'api_response_time_ms',
        'last_error_message',
        'integration_version',
        'supported_features',
        'environment',
        'overall_status',
    ];

    protected function casts(): array
    {
        return [
            'supported_features' => 'array',
            'last_successful_test_at' => 'datetime',
            'last_failed_test_at' => 'datetime',
            'api_response_time_ms' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
