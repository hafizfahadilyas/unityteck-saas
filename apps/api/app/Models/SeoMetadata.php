<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeoMetadata extends Model
{
    use BelongsToStore;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'seo_metadata';

    protected $fillable = [
        'id',
        'store_id',
        'entity_type',
        'entity_id',
        'url_path',
        'title_ar',
        'title_en',
        'meta_description_ar',
        'meta_description_en',
        'canonical_url',
        'robots_meta',
        'og_title_ar',
        'og_title_en',
        'og_description_ar',
        'og_description_en',
        'og_image_url',
        'twitter_card',
        'focus_keyword',
        'secondary_keywords',
        'search_intent',
        'schema_jsonld',
        'faq_items',
        'status',
    ];

    protected $casts = [
        'secondary_keywords' => 'array',
        'schema_jsonld' => 'array',
        'faq_items' => 'array',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
