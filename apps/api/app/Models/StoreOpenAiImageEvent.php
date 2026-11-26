<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOpenAiImageEvent extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $table = 'store_openai_image_events';

    protected $fillable = [
        'id', 'store_id', 'user_id', 'request_id', 'model', 'quality', 'status',
        'actual_cost_usd', 'media_id', 'error_code', 'error_message', 'meta', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'actual_cost_usd' => 'decimal:6',
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
