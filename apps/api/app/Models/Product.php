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
        'subtitle',
        'subtitle_ar',
        'price',
        'weight_kg',
        'shipping_mode',
        'shipping_method_id',
        'delivery_fee',
        'estimated_delivery_text',
        'requires_own_driver',
        'allow_own_delivery',
        'allow_shipping_company',
        'shipping_rate_mode',
        'shipping_per_kg_rate',
        'shipping_per_km_rate',
        'shipping_payment_options',
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
        'product_options',
        'custom_fields',
        'conditional_rules',
        'badge',
        'badge_en',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'status',
        'is_active',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'weight_kg' => 'decimal:3',
            'delivery_fee' => 'decimal:2',
            'original_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'stock' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'requires_own_driver' => 'boolean',
            'allow_own_delivery' => 'boolean',
            'allow_shipping_company' => 'boolean',
            'shipping_per_kg_rate' => 'decimal:2',
            'shipping_per_km_rate' => 'decimal:2',
            'shipping_payment_options' => 'array',
            'gallery_urls' => 'array',
            'tags' => 'array',
            'product_options' => 'array',
            'custom_fields' => 'array',
            'conditional_rules' => 'array',
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
