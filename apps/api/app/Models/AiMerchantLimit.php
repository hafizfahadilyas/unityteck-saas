<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiMerchantLimit extends Model
{
    protected $table = 'ai_merchant_limits';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'store_id',
        'merchant_id',
        'provider_id',
        'ai_enabled',
        'is_paused',
        'plan_code',
        'daily_image_limit',
        'monthly_image_limit',
        'daily_credits_allowance',
        'monthly_credits_allowance',
        'remaining_credits',
        'max_images_per_request',
        'allowed_models',
        'pause_reason',
    ];

    protected $casts = [
        'ai_enabled' => 'boolean',
        'is_paused' => 'boolean',
        'allowed_models' => 'array',
        'remaining_credits' => 'integer',
        'daily_image_limit' => 'integer',
        'monthly_image_limit' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id', 'id');
    }

    public function creditTransactions(): HasMany
    {
        return $this->hasMany(AiCreditTransaction::class, 'store_id', 'store_id')->orderByDesc('created_at');
    }
}
