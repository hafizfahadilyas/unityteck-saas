<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOpenAiConfigHistory extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $table = 'store_openai_config_histories';

    protected $fillable = [
        'id',
        'store_id',
        'actor_user_id',
        'before_json',
        'after_json',
        'action',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'before_json' => 'array',
            'after_json' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
