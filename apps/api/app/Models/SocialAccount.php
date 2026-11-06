<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialAccount extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'store_id',
        'platform',
        'account_name',
        'page_id',
        'ig_user_id',
        'access_token',
        'token_expires_at',
        'is_connected',
        'last_tested_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'is_connected' => 'boolean',
            'token_expires_at' => 'datetime',
            'last_tested_at' => 'datetime',
        ];
    }

    protected $hidden = [
        'access_token',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
