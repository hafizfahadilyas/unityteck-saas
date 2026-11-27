<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoImplementation extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_implementations';

    protected $fillable = [
        'id',
        'store_id',
        'recommendation_id',
        'target_url',
        'action_type',
        'executed_by_user_id',
        'credits_consumed',
        'before_state',
        'after_state',
        'live_validation_status',
        'rolled_back_at',
    ];

    protected $casts = [
        'credits_consumed' => 'integer',
        'before_state' => 'array',
        'after_state' => 'array',
        'rolled_back_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function recommendation(): BelongsTo
    {
        return $this->belongsTo(SeoRecommendation::class, 'recommendation_id');
    }
}
