<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ThemePage extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'slug',
        'type',
        'title_en',
        'title_ar',
        'draft_layout',
        'published_layout',
        'seo',
        'header_mode',
        'footer_mode',
        'status',
        'published_at',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'draft_layout' => 'array',
            'published_layout' => 'array',
            'seo' => 'array',
            'published_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(ThemeRevision::class, 'page_id');
    }
}
