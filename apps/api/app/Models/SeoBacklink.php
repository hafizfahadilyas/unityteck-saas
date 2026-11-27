<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoBacklink extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_backlinks';

    protected $fillable = [
        'id',
        'store_id',
        'source_url',
        'target_url',
        'anchor_text',
        'is_verified',
        'link_type',
        'outreach_status',
        'outreach_notes',
        'outreach_template',
        'first_detected_at',
        'last_verified_at',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'first_detected_at' => 'datetime',
        'last_verified_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
