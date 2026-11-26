<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankTransferProof extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'order_id',
        'transaction_id',
        'media_path',
        'media_url',
        'status',
        'reviewed_by',
        'notes',
        'reviewed_at',
        'audit_trail',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'audit_trail' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
