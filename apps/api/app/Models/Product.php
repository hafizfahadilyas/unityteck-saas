<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'category_id',
        'name',
        'name_ar',
        'slug',
        'description',
        'price',
        'weight_kg',
        'original_price',
        'cost_price',
        'sku',
        'stock',
        'category',
        'category_ar',
        'image_url',
        'image_version',
        'gallery_urls',
        'video_url',
        'tags',
        'badge',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'status',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'weight_kg' => 'decimal:3',
            'original_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'gallery_urls' => 'array',
            'tags' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function categoryRelation(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function variations(): HasMany
    {
        return $this->hasMany(ProductVariation::class);
    }
}
