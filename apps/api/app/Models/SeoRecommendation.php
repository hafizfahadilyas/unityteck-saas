<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoRecommendation extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_recommendations';

    protected $fillable = [
        'id',
        'store_id',
        'issue_id',
        'type',
        'target_url',
        'title_ar',
        'title_en',
        'explanation_ar',
        'explanation_en',
        'proposed_payload',
        'estimated_credits',
        'status',
    ];

    protected $casts = [
        'proposed_payload' => 'array',
        'estimated_credits' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function issue(): BelongsTo
    {
        return $this->belongsTo(SeoAuditIssue::class, 'issue_id');
    }
}
