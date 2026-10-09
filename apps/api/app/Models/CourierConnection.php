<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class CourierConnection extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'provider',
        'account_name',
        'account_number',
        'api_key',
        'api_secret',
        'entity_pin',
        'is_sandbox',
        'is_connected',
        'status',
        'settings',
        'last_tested_at',
        'last_sync_at',
    ];

    protected $hidden = [
        'api_secret',
        'entity_pin',
    ];

    protected function casts(): array
    {
        return [
            'is_sandbox' => 'boolean',
            'is_connected' => 'boolean',
            'settings' => 'array',
            'last_tested_at' => 'datetime',
            'last_sync_at' => 'datetime',
        ];
    }

    /**
     * Mask API key for safe frontend display (never expose raw secret keys)
     */
    public function getMaskedApiKeyAttribute(): string
    {
        $raw = $this->api_key;
        if (empty($raw)) return '';
        $len = strlen($raw);
        if ($len <= 8) return str_repeat('•', $len);
        return substr($raw, 0, 4) . str_repeat('•', max(4, $len - 8)) . substr($raw, -4);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function shipments(): HasMany
    {
        return $this->hasMany(Shipment::class, 'courier_id');
    }
}
