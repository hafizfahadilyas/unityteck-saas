<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOpenAiImageUsage extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_image_usage';

    protected $fillable = [
        'id', 'store_id', 'period_key', 'images_success', 'images_failed',
        'cost_usd', 'warning_sent', 'hard_stopped',
    ];

    protected function casts(): array
    {
        return [
            'images_success' => 'integer',
            'images_failed' => 'integer',
            'cost_usd' => 'decimal:6',
            'warning_sent' => 'boolean',
            'hard_stopped' => 'boolean',
        ];
    }
}
