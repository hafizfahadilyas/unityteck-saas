<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoConfig extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'brand_name',
        'city',
        'country',
        'meta_title',
        'meta_description',
        'keywords',
        'canonical_url',
        'search_console_tag',
        'ga4_measurement_id',
        'gtm_container_id',
        'sitemap_enabled',
        'robots_txt',
        'google_connected',
        'google_account_email',
        'google_connected_at',
        'search_console_connected',
        'indexing_api_enabled',
        'sitemap_url',
        'extra',
    ];

    protected function casts(): array
    {
        return [
            'sitemap_enabled' => 'boolean',
            'google_connected' => 'boolean',
            'google_connected_at' => 'datetime',
            'search_console_connected' => 'boolean',
            'indexing_api_enabled' => 'boolean',
            'extra' => 'array',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
