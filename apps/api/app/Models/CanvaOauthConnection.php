<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CanvaOauthConnection extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'canva_oauth_connections';

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected $fillable = [
        'id',
        'owner_key',
        'is_connected',
        'display_name',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'granted_scopes',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'is_connected' => 'boolean',
            'token_expires_at' => 'datetime',
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
        ];
    }
}
