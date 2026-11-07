<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderInstallment extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    public const STATUSES = [
        'pending',
        'paid',
        'overdue',
        'cancelled',
    ];

    protected $fillable = [
        'id',
        'store_id',
        'order_id',
        'installment_number',
        'amount',
        'due_date',
        'paid_at',
        'payment_transaction_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'installment_number' => 'integer',
            'amount' => 'decimal:2',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function paymentTransaction(): BelongsTo
    {
        return $this->belongsTo(PaymentTransaction::class, 'payment_transaction_id');
    }
}
