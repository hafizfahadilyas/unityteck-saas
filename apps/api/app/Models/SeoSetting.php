<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoSetting extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_settings';

    protected $fillable = [
        'id',
        'store_id',
        'primary_language',
        'secondary_language',
        'automation_mode',
        'auto_generate_products',
        'auto_generate_categories',
        'auto_generate_images_alt',
        'weekly_audit_enabled',
        'broken_link_monitor_enabled',
        'sitemap_auto_ping',
        'target_region',
        'city',
        'social_profiles',
        'competitor_domains',
    ];

    protected $casts = [
        'auto_generate_products' => 'boolean',
        'auto_generate_categories' => 'boolean',
        'auto_generate_images_alt' => 'boolean',
        'weekly_audit_enabled' => 'boolean',
        'broken_link_monitor_enabled' => 'boolean',
        'sitemap_auto_ping' => 'boolean',
        'social_profiles' => 'array',
        'competitor_domains' => 'array',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
