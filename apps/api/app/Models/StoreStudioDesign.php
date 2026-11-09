<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

class StoreStudioDesign extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'editor_type',
        'category',
        'title',
        'width',
        'height',
        'design_json',
        'preview_media_id',
        'source',
    ];

    protected $casts = [
        'design_json' => 'array',
        'width' => 'integer',
        'height' => 'integer',
    ];
}
