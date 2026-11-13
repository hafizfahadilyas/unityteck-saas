<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    public const ROW_ID = 'platform';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'settings',
        'updated_by_user_id',
        'updated_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'updated_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }
}
