<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreUtmLink extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_utm_links';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'platform_key',
        'target_path',
        'product_id',
        'target_url',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'click_sessions',
        'conversion_count',
    ];

    protected function casts(): array
    {
        return [
            'click_sessions' => 'integer',
            'conversion_count' => 'integer',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}