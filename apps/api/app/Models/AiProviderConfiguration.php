<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiProviderConfiguration extends Model
{
    protected $table = 'ai_provider_configurations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'provider_id',
        'enabled',
        'default_model',
        'default_text_model',
        'default_image_model',
        'default_language',
        'default_image_quality',
        'default_aspect_ratio',
        'max_image_resolution',
        'default_generation_mode',
        'feature_text_to_image',
        'feature_image_to_image',
        'feature_product_photography',
        'feature_background_replacement',
        'feature_lifestyle_scenes',
        'feature_promotional_banners',
        'feature_social_creatives',
        'feature_product_variations',
        'allowed_aspect_ratios',
        'output_format',
        'storage_location',
        'compression_quality',
        'max_upload_size_mb',
        'all_merchants_enabled',
        'default_daily_image_limit',
        'default_monthly_image_limit',
        'default_daily_credit_allowance',
        'default_monthly_credit_allowance',
        'max_images_per_request',
        'monthly_spending_limit_usd',
        'api_timeout_seconds',
        'retry_enabled',
        'max_retries',
        'request_concurrency_limit',
        'rate_limit_per_minute',
        'provider_fallback_enabled',
        'fallback_model',
        'failure_alerts_enabled',
        'global_maintenance_mode',
        'notes',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'feature_text_to_image' => 'boolean',
        'feature_image_to_image' => 'boolean',
        'feature_product_photography' => 'boolean',
        'feature_background_replacement' => 'boolean',
        'feature_lifestyle_scenes' => 'boolean',
        'feature_promotional_banners' => 'boolean',
        'feature_social_creatives' => 'boolean',
        'feature_product_variations' => 'boolean',
        'allowed_aspect_ratios' => 'array',
        'all_merchants_enabled' => 'boolean',
        'retry_enabled' => 'boolean',
        'provider_fallback_enabled' => 'boolean',
        'failure_alerts_enabled' => 'boolean',
        'global_maintenance_mode' => 'boolean',
        'monthly_spending_limit_usd' => 'float',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(AiProvider::class, 'provider_id', 'id');
    }
}
