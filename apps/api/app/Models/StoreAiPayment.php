<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAiPayment extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'store_ai_payments';

    protected $fillable = [
        'id',
        'store_id',
        'package_id',
        'package_name',
        'amount_sar',
        'payment_method',
        'transaction_ref',
        'sender_name',
        'proof_path',
        'proof_url',
        'proof_type',
        'status',
        'limits_granted',
        'notes',
        'reviewed_at',
        'reviewed_by',
    ];

    protected function casts(): array
    {
        return [
            'amount_sar' => 'decimal:2',
            'limits_granted' => 'array',
            'reviewed_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
