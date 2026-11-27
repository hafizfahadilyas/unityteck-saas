<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoSearchPerformance extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_search_performance';

    protected $fillable = [
        'id',
        'store_id',
        'date',
        'source',
        'clicks',
        'impressions',
        'ctr',
        'avg_position',
        'top_queries',
        'top_pages',
    ];

    protected $casts = [
        'date' => 'date',
        'clicks' => 'integer',
        'impressions' => 'integer',
        'ctr' => 'decimal:4',
        'avg_position' => 'decimal:2',
        'top_queries' => 'array',
        'top_pages' => 'array',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
