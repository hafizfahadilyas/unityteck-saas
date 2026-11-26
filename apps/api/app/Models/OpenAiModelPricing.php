<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpenAiModelPricing extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'openai_model_pricings';

    protected $fillable = [
        'id',
        'model',
        'modality',
        'input_per_1m_usd',
        'output_per_1m_usd',
        'cached_input_per_1m_usd',
        'image_per_unit_usd',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'input_per_1m_usd' => 'decimal:6',
            'output_per_1m_usd' => 'decimal:6',
            'cached_input_per_1m_usd' => 'decimal:6',
            'image_per_unit_usd' => 'decimal:6',
            'active' => 'boolean',
        ];
    }
}
