<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GlobalPlatformConfiguration extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $table = 'global_platform_configurations';

    protected $fillable = [
        'id',
        'setting_key',
        'setting_value',
        'setting_group',
        'description',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'setting_value' => 'array',
        ];
    }
}
