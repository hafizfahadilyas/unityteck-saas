<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Domain extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'domain_name',
        'is_primary',
        'ssl_status',
        'dns_configured',
        'dns_verified',
        'hosting_tier',
        'monthly_fee',
        'payment_received',
        'status',
        'nameservers',
        'registered_date',
        'hosting_id',
        'database_id',
        'deployment_status',
        'hostinger_plan',
        'server_ip',
        'dns_records',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'dns_configured' => 'boolean',
            'dns_verified' => 'boolean',
            'monthly_fee' => 'decimal:2',
            'payment_received' => 'boolean',
            'nameservers' => 'array',
            'dns_records' => 'array',
            'registered_date' => 'date',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
