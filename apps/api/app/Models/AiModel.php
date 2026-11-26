<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiModel extends Model
{
    protected $table = 'ai_models';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'provider_id',
        'model_id',
        'name_en',
        'name_ar',
        'description_en',
        'description_ar',
        'tier',
        'capabilities',
        'supports_image_generation',
        'supports_image_editing',
        'input_modalities',
        'output_modalities',
        'availability_status',
        'is_enabled',
        'is_default',
        'priority',
        'input_token_price_per_1m_usd',
        'output_token_price_per_1m_usd',
        'image_generation_price_usd',
    ];

    protected $casts = [
        'capabilities' => 'array',
        'input_modalities' => 'array',
        'output_modalities' => 'array',
        'supports_image_generation' => 'boolean',
        'supports_image_editing' => 'boolean',
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
        'input_token_price_per_1m_usd' => 'float',
        'output_token_price_per_1m_usd' => 'float',
        'image_generation_price_usd' => 'float',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'provider_id', 'id');
    }
}
