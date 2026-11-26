<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOpenAiBudgetPeriod extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_openai_budget_periods';

    protected $fillable = [
        'id',
        'store_id',
        'period_type',
        'period_key',
        'tokens_used',
        'requests_used',
        'cost_usd',
        'warning_sent',
        'hard_stopped',
    ];

    protected function casts(): array
    {
        return [
            'tokens_used' => 'integer',
            'requests_used' => 'integer',
            'cost_usd' => 'decimal:6',
            'warning_sent' => 'boolean',
            'hard_stopped' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
