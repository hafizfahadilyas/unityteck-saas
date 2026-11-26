<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOpenAiUsageLog extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $table = 'store_openai_usage_logs';

    protected $fillable = [
        'id',
        'store_id',
        'user_id',
        'request_id',
        'model',
        'intelligence_level',
        'input_tokens',
        'output_tokens',
        'cached_tokens',
        'total_tokens',
        'estimated_cost_usd',
        'actual_cost_usd',
        'status',
        'error_code',
        'error_message',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'cached_tokens' => 'integer',
            'total_tokens' => 'integer',
            'estimated_cost_usd' => 'decimal:6',
            'actual_cost_usd' => 'decimal:6',
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
