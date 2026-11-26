<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOpenAiAutomationUsage extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_automation_usage';

    protected $fillable = [
        'id', 'store_id', 'period_type', 'period_key',
        'questions_used', 'tokens_used', 'cost_usd', 'hard_stopped',
    ];

    protected function casts(): array
    {
        return [
            'questions_used' => 'integer',
            'tokens_used' => 'integer',
            'cost_usd' => 'decimal:6',
            'hard_stopped' => 'boolean',
        ];
    }
}
