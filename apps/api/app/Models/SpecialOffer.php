<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;

class SpecialOffer extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'title_ar',
        'title_en',
        'offer_type',
        'discount_value',
        'min_order_value',
        'max_discount',
        'start_date',
        'end_date',
        'message',
        'status',
        'product_scope',
        'product_ids',
        'banner_bg_color',
        'banner_image_url',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'min_order_value' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'product_ids' => 'array',
        ];
    }
}
