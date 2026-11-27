<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantPageVisibility extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'merchant_page_visibility';

    protected $fillable = [
        'id',
        'store_id',
        'merchant_id',
        'page_id',
        'is_visible',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_visible' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id', 'id');
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(DashboardPageRegistry::class, 'page_id', 'id');
    }
}
