<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGateway extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'provider',
        'title',
        'title_ar',
        'is_enabled',
        'is_sandbox',
        'api_key',
        'secret_key',
        'public_key',
        'webhook_secret',
        'supported_methods',
        'transaction_fee_percent',
        'transaction_fee_fixed',
        'status',
        'last_tested_at',
    ];

    protected $hidden = [
        'secret_key',
        'webhook_secret',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'is_sandbox' => 'boolean',
            'supported_methods' => 'array',
            'transaction_fee_percent' => 'decimal:2',
            'transaction_fee_fixed' => 'decimal:2',
            'last_tested_at' => 'datetime',
        ];
    }

    public function getMaskedSecretKeyAttribute(): string
    {
        $raw = $this->secret_key;
        if (empty($raw)) return '';
        $len = strlen($raw);
        if ($len <= 8) return str_repeat('•', $len);
        return substr($raw, 0, 4) . str_repeat('•', max(4, $len - 8)) . substr($raw, -4);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
