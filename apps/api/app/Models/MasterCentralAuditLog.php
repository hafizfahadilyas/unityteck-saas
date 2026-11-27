<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterCentralAuditLog extends Model
{
    public $incrementing = false;
    public $timestamps = false;
    protected $keyType = 'string';
    protected $table = 'master_central_audit_logs';

    protected $fillable = [
        'id',
        'admin_id',
        'admin_name',
        'admin_email',
        'scope',
        'action',
        'target_type',
        'target_id',
        'before_state',
        'after_state',
        'reason',
        'ip_address',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'before_state' => 'array',
            'after_state' => 'array',
            'created_at' => 'datetime',
        ];
    }
}
