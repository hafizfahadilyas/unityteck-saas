<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SeoAudit extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_audits';

    protected $fillable = [
        'id',
        'store_id',
        'target_domain',
        'audit_type',
        'health_score',
        'technical_score',
        'product_seo_score',
        'meta_completion_score',
        'aeo_readiness_score',
        'geo_readiness_score',
        'speed_mobile_score',
        'speed_desktop_score',
        'pages_crawled',
        'indexed_pages_count',
        'broken_links_count',
        'backlinks_count',
        'issues_count',
        'status',
        'audit_summary',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'health_score' => 'integer',
        'technical_score' => 'integer',
        'product_seo_score' => 'integer',
        'meta_completion_score' => 'integer',
        'aeo_readiness_score' => 'integer',
        'geo_readiness_score' => 'integer',
        'speed_mobile_score' => 'integer',
        'speed_desktop_score' => 'integer',
        'pages_crawled' => 'integer',
        'indexed_pages_count' => 'integer',
        'broken_links_count' => 'integer',
        'backlinks_count' => 'integer',
        'issues_count' => 'integer',
        'audit_summary' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function issues(): HasMany
    {
        return $this->hasMany(SeoAuditIssue::class, 'audit_id');
    }
}
