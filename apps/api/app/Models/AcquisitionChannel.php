<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AcquisitionChannel extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'name',
        'channel_type',
        'traffic_share',
        'visits',
        'add_to_cart',
        'orders_count',
        'conversion_rate',
        'revenue',
        'roas',
        'roi',
        'cac',
        'icon',
        'trend_sparkline',
        'trend_change',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'traffic_share' => 'integer',
            'visits' => 'integer',
            'add_to_cart' => 'integer',
            'orders_count' => 'integer',
            'conversion_rate' => 'decimal:2',
            'revenue' => 'decimal:2',
            'roas' => 'decimal:2',
            'cac' => 'decimal:2',
            'trend_sparkline' => 'array',
            'trend_change' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
