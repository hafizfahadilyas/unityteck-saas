<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreGoogleIntegration extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'is_connected',
        'google_account_email',
        'google_account_name',
        'google_account_picture',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'granted_scopes',
        'ga4_property_id',
        'ga4_property_name',
        'ga4_measurement_id',
        'gsc_site_url',
        'gtm_account_id',
        'gtm_container_id',
        'google_ads_customer_id',
        'google_ads_account_name',
        'sync_status',
        'last_synced_at',
        'last_error',
        'analytics_snapshot',
        'search_console_snapshot',
        'pagespeed_mobile_snapshot',
        'pagespeed_desktop_snapshot',
        'google_ads_snapshot',
        'gtm_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'is_connected' => 'boolean',
            'token_expires_at' => 'datetime',
            'last_synced_at' => 'datetime',
            'analytics_snapshot' => 'array',
            'search_console_snapshot' => 'array',
            'pagespeed_mobile_snapshot' => 'array',
            'pagespeed_desktop_snapshot' => 'array',
            'google_ads_snapshot' => 'array',
            'gtm_snapshot' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
