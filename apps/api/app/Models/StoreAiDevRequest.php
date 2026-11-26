<?php

namespace App\Models;

use App\Models\Concerns\BelongsToStore;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAiDevRequest extends Model
{
    use BelongsToStore;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'store_ai_dev_requests';

    protected $fillable = [
        'id',
        'store_id',
        'status',
        'severity',
        'category',
        'title',
        'description',
        'requested_by_user_id',
        'assigned_master_user_id',
        'symptoms',
        'diagnosis',
        'master_notes',
        'auto_deploy_allowed',
        'diagnosed_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'symptoms' => 'array',
            'diagnosis' => 'array',
            'auto_deploy_allowed' => 'boolean',
            'diagnosed_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
