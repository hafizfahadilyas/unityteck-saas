<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Media extends Model
{
    use BelongsToStore;

    protected $table = 'media';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'file_name',
        'file_type',
        'mime',
        'size_bytes',
        'width',
        'height',
        'path',
        'url',
        'optimized_url',
        'webp_url',
        'avif_url',
        'thumbnail_url',
        'poster_url',
        'alt',
        'caption',
        'folder',
        'processing_status',
        'optimization_status',
        'version',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'version' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(MediaUsage::class);
    }
}
