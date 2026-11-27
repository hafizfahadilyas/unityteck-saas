<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoContentHistory extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_content_history';

    protected $fillable = [
        'id',
        'store_id',
        'entity_type',
        'entity_id',
        'field_name',
        'old_value',
        'new_value',
        'changed_by',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
