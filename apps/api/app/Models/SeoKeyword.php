<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoKeyword extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_keywords';

    protected $fillable = [
        'id',
        'store_id',
        'keyword',
        'language',
        'keyword_type',
        'search_intent',
        'search_volume',
        'difficulty_score',
        'cpc_sar',
        'ranking_position',
        'target_url',
        'source',
    ];

    protected $casts = [
        'search_volume' => 'integer',
        'difficulty_score' => 'integer',
        'cpc_sar' => 'decimal:2',
        'ranking_position' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
