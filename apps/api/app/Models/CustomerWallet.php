<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerWallet extends Model
{
    use BelongsToStore;

    protected $fillable = [
        'store_id',
        'customer_id',
        'balance',
        'loyalty_points',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'loyalty_points' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
