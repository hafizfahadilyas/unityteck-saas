<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreGrowthAction extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'recommendation_id',
        'action_type',
        'merchant_user_id',
        'execution_mode',
        'credits_cost',
        'credits_refunded',
        'proposed_changes',
        'before_state',
        'after_state',
        'execution_result',
        'error_message',
        'is_rolled_back',
        'rolled_back_at',
        'rolled_back_by_user_id',
    ];

    protected $casts = [
        'proposed_changes' => 'array',
        'before_state' => 'array',
        'after_state' => 'array',
        'credits_cost' => 'integer',
        'credits_refunded' => 'integer',
        'is_rolled_back' => 'boolean',
        'rolled_back_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function recommendation(): BelongsTo
    {
        return $this->belongsTo(StoreGrowthRecommendation::class, 'recommendation_id');
    }
}
