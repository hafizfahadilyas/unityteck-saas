<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    protected $table = 'ai_usage_logs';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'request_id',
        'store_id',
        'merchant_id',
        'provider_id',
        'model_id',
        'endpoint',
        'input_tokens',
        'output_tokens',
        'cost_usd',
        'response_time_ms',
        'http_status',
        'status',
        'error_code',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'input_tokens' => 'integer',
        'output_tokens' => 'integer',
        'cost_usd' => 'float',
        'response_time_ms' => 'integer',
        'http_status' => 'integer',
        'created_at' => 'datetime',
    ];
}
