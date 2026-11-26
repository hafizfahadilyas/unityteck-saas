<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpenAiGlobalConfig extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'openai_global_configs';

    protected $fillable = [
        'id',
        'enabled',
        'emergency_disabled',
        'default_text_model',
        'prompt_caching_enabled',
        'platform_daily_request_cap',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'emergency_disabled' => 'boolean',
            'prompt_caching_enabled' => 'boolean',
            'platform_daily_request_cap' => 'integer',
        ];
    }
}
