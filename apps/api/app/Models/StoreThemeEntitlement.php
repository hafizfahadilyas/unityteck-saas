<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreThemeEntitlement extends Model
{
    protected $table = 'store_theme_entitlements';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'theme_id',
        'source',
        'price_sar',
        'granted_at',
        'granted_by',
    ];

    protected function casts(): array
    {
        return [
            'price_sar' => 'integer',
            'granted_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(ThemeCatalog::class, 'theme_id');
    }
}
