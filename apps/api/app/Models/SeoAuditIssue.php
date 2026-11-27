<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoAuditIssue extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_audit_issues';

    protected $fillable = [
        'id',
        'audit_id',
        'store_id',
        'category',
        'severity',
        'affected_url',
        'title_en',
        'title_ar',
        'issue_description_en',
        'issue_description_ar',
        'why_it_matters_en',
        'why_it_matters_ar',
        'suggested_solution_en',
        'suggested_solution_ar',
        'ai_credits_cost',
        'auto_fixable',
        'status',
        'proposed_payload',
    ];

    protected $casts = [
        'ai_credits_cost' => 'integer',
        'auto_fixable' => 'boolean',
        'proposed_payload' => 'array',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function audit(): BelongsTo
    {
        return $this->belongsTo(SeoAudit::class, 'audit_id');
    }
}
