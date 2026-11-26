<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AiProvider extends Model
{
    protected $table = 'ai_providers';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'slug',
        'name',
        'display_name_ar',
        'display_name_en',
        'status',
        'is_default',
        'api_endpoint',
        'last_connection_test_at',
        'connection_status',
        'last_connection_error',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'last_connection_test_at' => 'datetime',
    ];

    public function configuration(): HasOne
    {
        return $this->hasOne(AiProviderConfiguration::class, 'provider_id', 'id');
    }

    public function models(): HasMany
    {
        return $this->hasMany(AiModel::class, 'provider_id', 'id')->orderBy('priority');
    }
}
