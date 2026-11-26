<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOpenAiAuditLog extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $table = 'store_openai_audit_logs';

    protected $fillable = [
        'id',
        'store_id',
        'actor_user_id',
        'action',
        'severity',
        'message',
        'meta',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
