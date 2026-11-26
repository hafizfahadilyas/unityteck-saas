<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ThemeCatalog extends Model
{
    protected $table = 'themes_catalog';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'name_ar',
        'category',
        'tier',
        'price_sar',
        'included_in_tiers',
        'preview_color',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'price_sar' => 'integer',
            'included_in_tiers' => 'array',
        ];
    }

    public function storeThemes(): HasMany
    {
        return $this->hasMany(StoreTheme::class, 'theme_id');
    }

    public function entitlements(): HasMany
    {
        return $this->hasMany(StoreThemeEntitlement::class, 'theme_id');
    }
}
