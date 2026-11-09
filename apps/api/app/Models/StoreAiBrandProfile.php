<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAiBrandProfile extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_ai_brand_profiles';

    protected $fillable = [
        'id',
        'store_id',
        'palette_hex',
        'persona',
        'brand_lock_default',
        'logo_overlay_enabled',
        'logo_overlay_position',
        'logo_url',
        'style_reference_urls',
    ];

    protected function casts(): array
    {
        return [
            'palette_hex' => 'array',
            'style_reference_urls' => 'array',
            'brand_lock_default' => 'boolean',
            'logo_overlay_enabled' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
