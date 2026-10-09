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
        'category',
        'tier',
        'preview_color',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function storeThemes(): HasMany
    {
        return $this->hasMany(StoreTheme::class, 'theme_id');
    }
}
