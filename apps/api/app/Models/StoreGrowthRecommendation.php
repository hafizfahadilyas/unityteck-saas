<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoreGrowthRecommendation extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'category',
        'feature_name',
        'problem_identified',
        'reason',
        'supporting_store_data',
        'expected_benefit',
        'implementation_steps',
        'required_credits',
        'action_key',
        'manual_config_url',
        'status',
    ];

    protected $casts = [
        'supporting_store_data' => 'array',
        'implementation_steps' => 'array',
        'required_credits' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(StoreGrowthAction::class, 'recommendation_id');
    }
}
