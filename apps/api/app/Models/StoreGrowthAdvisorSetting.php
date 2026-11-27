<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreGrowthAdvisorSetting extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'execution_mode',
        'auto_daily_audit',
        'auto_apply_seo',
        'auto_apply_cart_recovery',
        'daily_credit_limit',
        'monthly_credit_limit',
        'credits_used_today',
        'credits_used_month',
        'last_audited_at',
    ];

    protected $casts = [
        'auto_daily_audit' => 'boolean',
        'auto_apply_seo' => 'boolean',
        'auto_apply_cart_recovery' => 'boolean',
        'daily_credit_limit' => 'integer',
        'monthly_credit_limit' => 'integer',
        'credits_used_today' => 'integer',
        'credits_used_month' => 'integer',
        'last_audited_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
