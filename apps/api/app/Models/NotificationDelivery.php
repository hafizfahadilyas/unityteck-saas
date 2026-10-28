<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationDelivery extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'notification_deliveries';

    protected $fillable = [
        'id',
        'store_id',
        'order_id',
        'order_number',
        'event',
        'channel',
        'audience',
        'recipient',
        'status',
        'provider',
        'provider_message_id',
        'preview',
        'error',
        'merchant_read',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'merchant_read' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
