<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGenerationHistory extends Model
{
    protected $table = 'ai_generation_history';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'store_id',
        'merchant_id',
        'provider_id',
        'model_id',
        'action_type',
        'prompt',
        'revised_prompt',
        'aspect_ratio',
        'image_size',
        'style',
        'media_id',
        'image_url',
        'size_bytes',
        'mime_type',
        'execution_time_ms',
        'status',
        'error_message',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'size_bytes' => 'integer',
        'execution_time_ms' => 'integer',
        'created_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id', 'id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id', 'id');
    }
}
