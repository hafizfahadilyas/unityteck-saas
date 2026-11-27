<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoIntegration extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_integrations';

    protected $fillable = [
        'id',
        'store_id',
        'provider',
        'is_connected',
        'credentials_encrypted',
        'property_url',
        'api_key_masked',
        'indexnow_key',
        'last_sync_at',
        'last_status',
        'error_details',
    ];

    protected $casts = [
        'is_connected' => 'boolean',
        'last_sync_at' => 'datetime',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
