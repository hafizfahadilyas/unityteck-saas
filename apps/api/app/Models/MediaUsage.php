<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaUsage extends Model
{
    use BelongsToStore;

    protected $table = 'media_usage';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'media_id',
        'store_id',
        'entity_type',
        'entity_id',
    ];

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
